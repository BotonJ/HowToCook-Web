import { useState, useEffect, useRef } from 'react';
import { fetchAllRecipes, fetchCategories } from '@/services/api';
import { transformDishIndex } from '@/lib/api-transform';
import type { Recipe, Category } from '@/types';
import type { DishIndex, ApiCategory, EnIndexData } from '@/types/api';

interface UseRecipesResult {
  recipes: Recipe[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

function buildCategoriesFromApi(
  dishes: DishIndex[],
  apiCategories: ApiCategory[],
): Category[] {
  const nameMap = new Map(apiCategories.map(c => [c.id, c.name]));
  const grouped = new Map<string, Recipe[]>();

  for (const dish of dishes) {
    const recipe = transformDishIndex(dish);
    const list = grouped.get(dish.category);
    if (list) {
      list.push(recipe);
    } else {
      grouped.set(dish.category, [recipe]);
    }
  }

  return Array.from(grouped.entries()).map(([id, recipes]) => ({
    id,
    name: nameMap.get(id) ?? id,
    displayName: nameMap.get(id) ?? id,
    count: recipes.length,
    recipes,
  }));
}

async function fetchIndex(): Promise<Category[]> {
  // API-primary: fetch all Chinese recipes (incl. 面食之神) from the API (§6).
  const [dishes, apiCategories] = await Promise.all([
    fetchAllRecipes(),
    fetchCategories(),
  ]);
  return buildCategoriesFromApi(dishes, apiCategories);
}

async function fetchEnglishIndex(): Promise<Category[]> {
  try {
    const res = await fetch('/data/en_index_curated.json');
    if (!res.ok) return [];
    const data: EnIndexData = await res.json();
    const recipes: Recipe[] = data.dishes.map((dish) => ({
      id: `en/${dish.name}`,
      name: dish.name,
      category: dish.category,
      imagePath: '',
      difficulty: dish.difficulty,
      cuisine: dish.cuisine,
      cooking_method: dish.cooking_method,
      cook_time: dish.cook_time,
      ingredients: dish.ingredients,
      main_ingredients: dish.main_ingredients ?? [],
      tags: dish.tags ?? {},
      source: dish.source,
      description: dish.epicurious_meta?.description ?? '',
      language: 'en' as const,
    }));
    const grouped = new Map<string, Recipe[]>();
    for (const recipe of recipes) {
      const list = grouped.get(recipe.category);
      if (list) {
        list.push(recipe);
      } else {
        grouped.set(recipe.category, [recipe]);
      }
    }
    return Array.from(grouped.entries()).map(([id, recs]) => ({
      id: `en-${id}`,
      name: `English ${id}`,
      displayName: `English ${id}`,
      count: recs.length,
      recipes: recs,
    }));
  } catch {
    return [];
  }
}


async function fetchFlavorProfiles(): Promise<Record<string, { sweet: number; sour: number; bitter: number; umami: number; spicy: number; fat: number; salty: number; aromatic: number }>> {
  try {
    const res = await fetch('/data/flavor/recipe-flavor-profiles.json');
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

/**
 * Look up a single recipe by ID in the local cached index (O(1) Map lookup).
 * The cache is populated by loadRecipes() — which already merges flavor
 * profiles — so the returned recipe carries its flavorProfile.
 *
 * On a deep-link/refresh where the cache is empty, we populate it first via
 * loadRecipes() (the same API index the listing page uses). This is the
 * local-first fallback for RecipeDetail; the rich detail (steps/introduction)
 * is then layered on by useRecipeDetail's API call.
 */
let recipeIndexCache: Map<string, Recipe> | null = null;

export async function findRecipeById(id: string): Promise<Recipe | null> {
  if (!cachedRecipes) {
    await loadRecipes();
  }
  if (!recipeIndexCache && cachedRecipes) {
    recipeIndexCache = new Map(cachedRecipes.map(r => [r.id, r]));
  }
  return recipeIndexCache?.get(id) ?? null;
}

// Module-level cache so data is fetched only once across re-renders/remounts
let cachedCategories: Category[] | null = null;
let cachedRecipes: Recipe[] | null = null;
let inflight: Promise<{ categories: Category[]; recipes: Recipe[] }> | null = null;

async function loadRecipes(): Promise<{ categories: Category[]; recipes: Recipe[] }> {
  if (cachedCategories && cachedRecipes) {
    return { categories: cachedCategories, recipes: cachedRecipes };
  }

  if (inflight) return inflight;

  inflight = (async () => {
    // 1. Load data: API (Chinese index) + static files (EN/flavor, deferred)
    const [categories, englishCategories, flavorProfiles] = await Promise.all([
      fetchIndex(),
      fetchEnglishIndex(),
      fetchFlavorProfiles(),
    ]);

    // 2. Merge English categories into Chinese categories immutably
    const mergedCategories = [...categories];
    for (const enCat of englishCategories) {
      const existingIdx = mergedCategories.findIndex(c => c.id === enCat.id.replace('en-', ''));
      if (existingIdx !== -1) {
        const existing = mergedCategories[existingIdx];
        mergedCategories[existingIdx] = {
          ...existing,
          recipes: [...existing.recipes, ...enCat.recipes],
          count: existing.recipes.length + enCat.recipes.length,
        };
      } else {
        mergedCategories.push(enCat);
      }
    }

    const recipes = mergedCategories.flatMap(c => c.recipes);

    // 4. Merge flavor profiles into recipes immutably
    const recipesWithFlavor = recipes.map(recipe => {
      const fp = flavorProfiles[recipe.id];
      return fp ? { ...recipe, flavorProfile: fp } : recipe;
    });

    // Rebuild categories with updated recipe references
    const finalCategories = mergedCategories.map(cat => ({
      ...cat,
      recipes: cat.recipes.map(r => {
        const fp = flavorProfiles[r.id];
        return fp ? { ...r, flavorProfile: fp } : r;
      }),
    }));

    cachedCategories = finalCategories;
    cachedRecipes = recipesWithFlavor;

    return { categories: finalCategories, recipes: recipesWithFlavor };
  })();

  return inflight;
}

export function useRecipes(): UseRecipesResult {
  const [categories, setCategories] = useState<Category[]>(
    cachedCategories ?? [],
  );
  const [recipes, setRecipes] = useState<Recipe[]>(cachedRecipes ?? []);
  const [loading, setLoading] = useState(!cachedCategories);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const doLoad = () => {
    if (cachedCategories && cachedRecipes) {
      setCategories(cachedCategories);
      setRecipes(cachedRecipes);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    loadRecipes()
      .then(({ categories: cats, recipes: recs }) => {
        if (mountedRef.current) {
          setCategories(cats);
          setRecipes(recs);
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setError(
            err instanceof Error ? err.message : 'Failed to load recipe data',
          );
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  };

  useEffect(() => {
    mountedRef.current = true;
    doLoad();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const retry = () => {
    cachedCategories = null;
    cachedRecipes = null;
    inflight = null;
    recipeIndexCache = null;
    doLoad();
  };

  return { recipes, categories, loading, error, retry };
}

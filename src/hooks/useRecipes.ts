import { useState, useEffect, useRef } from 'react';
import { fetchAllRecipes, fetchCategories } from '@/services/api';
import { transformDishIndex } from '@/lib/api-transform';
import type { Recipe, Category } from '@/types';
import type { DishIndex, ApiCategory, EnIndexData, NoodleData } from '@/types/api';

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
  const res = await fetch('/data/recipes-meta.json');
  if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
  return res.json() as Promise<Category[]>;
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

async function fetchNoodleRecipes(): Promise<Category[]> {
  try {
    const res = await fetch('/data/noodle-recipes.json');
    if (!res.ok) return [];
    const data: NoodleData = await res.json();
    const recipes: Recipe[] = data.dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      imagePath: '',
      difficulty: dish.difficulty,
      cuisine: dish.cuisine,
      cooking_method: dish.cooking_method,
      cook_time: dish.cook_time,
      ingredients: dish.ingredients,
      main_ingredients: dish.main_ingredients ?? [],
      tags: {},
      source: dish.source,
      description: dish.description,
      language: 'zh' as const,
      steps_text: dish.steps_text,
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
      id: `noodle-${id}`,
      name: `面食之神 ${id}`,
      displayName: '面食之神',
      count: recs.length,
      recipes: recs,
    }));
  } catch {
    return [];
  }
}

async function fetchFlavorProfiles(): Promise<Record<string, { sweet: number; sour: number; bitter: number; umami: number; spicy: number; fatty: number }>> {
  try {
    const res = await fetch('/data/epicure/flavor-profiles.json');
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function fetchFullFallback(): Promise<Category[]> {
  const res = await fetch('/data/recipes-detail.json');
  if (!res.ok) throw new Error(`Fallback fetch failed: ${res.status}`);
  return res.json() as Promise<Category[]>;
}

let fullDataCache: Category[] | null = null;

async function getFullRecipeData(): Promise<Category[]> {
  if (fullDataCache) return fullDataCache;
  const [data, englishCategories, noodleCategories, flavorProfiles] = await Promise.all([
    fetchFullFallback(),
    fetchEnglishIndex(),
    fetchNoodleRecipes(),
    fetchFlavorProfiles(),
  ]);
  // Merge English categories into Chinese categories (same logic as loadRecipes)
  const mergedCategories = [...data];
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
  // Merge noodle recipes into categories (same logic as loadRecipes)
  for (const noodleCat of noodleCategories) {
    const realCatId = noodleCat.id.replace('noodle-', '');
    const existingIdx = mergedCategories.findIndex(c => c.id === realCatId);
    if (existingIdx !== -1) {
      const existing = mergedCategories[existingIdx];
      mergedCategories[existingIdx] = {
        ...existing,
        recipes: [...existing.recipes, ...noodleCat.recipes],
        count: existing.recipes.length + noodleCat.recipes.length,
      };
    } else {
      mergedCategories.push(noodleCat);
    }
  }
  // Merge flavor profiles immutably
  const merged = mergedCategories.map(cat => ({
    ...cat,
    recipes: cat.recipes.map(recipe => {
      const fp = flavorProfiles[recipe.id];
      return fp ? { ...recipe, flavorProfile: fp } : recipe;
    }),
  }));
  fullDataCache = merged;
  return merged;
}

export { getFullRecipeData };

/** Look up a single recipe by ID in O(1) using a pre-built index. */
let recipeIndexCache: Map<string, Recipe> | null = null;

function getRecipeIndex(categories: Category[]): Map<string, Recipe> {
  if (recipeIndexCache) return recipeIndexCache;
  const map = new Map<string, Recipe>();
  for (const cat of categories) {
    for (const r of cat.recipes) {
      map.set(r.id, r);
    }
  }
  recipeIndexCache = map;
  return map;
}

export function findRecipeById(id: string): Promise<Recipe | null> {
  return getFullRecipeData().then(cats => getRecipeIndex(cats).get(id) ?? null);
}

// Module-level cache so data is fetched only once across re-renders/remounts
let cachedCategories: Category[] | null = null;
let cachedRecipes: Recipe[] | null = null;
let inflight: Promise<{ categories: Category[]; recipes: Recipe[] }> | null = null;
const listeners = new Set<(cats: Category[], recs: Recipe[]) => void>();

function notifyListeners(cats: Category[], recs: Recipe[]): void {
  for (const fn of listeners) fn(cats, recs);
}

async function fetchFromApiAndUpdate(): Promise<void> {
  try {
    const [dishes, apiCategories] = await Promise.all([
      fetchAllRecipes(),
      fetchCategories(),
    ]);
    const categories = buildCategoriesFromApi(dishes, apiCategories);
    const recipes = categories.flatMap(c => c.recipes);
    cachedCategories = categories;
    cachedRecipes = recipes;
    notifyListeners(categories, recipes);
  } catch {
    // API refresh failed silently; local data is already loaded
  }
}

async function loadRecipes(): Promise<{ categories: Category[]; recipes: Recipe[] }> {
  if (cachedCategories && cachedRecipes) {
    return { categories: cachedCategories, recipes: cachedRecipes };
  }

  if (inflight) return inflight;

  inflight = (async () => {
    // 1. Load local index immediately for instant render (~12KB gzip)
    const [categories, englishCategories, noodleCategories, flavorProfiles] = await Promise.all([
      fetchIndex(),
      fetchEnglishIndex(),
      fetchNoodleRecipes(),
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

    // 3. Merge noodle recipes (面食之神) into their real categories immutably
    for (const noodleCat of noodleCategories) {
      // noodleCat.id is like "noodle-staple" — extract real category id
      const realCatId = noodleCat.id.replace('noodle-', '');
      const existingIdx = mergedCategories.findIndex(c => c.id === realCatId);
      if (existingIdx !== -1) {
        const existing = mergedCategories[existingIdx];
        mergedCategories[existingIdx] = {
          ...existing,
          recipes: [...existing.recipes, ...noodleCat.recipes],
          count: existing.recipes.length + noodleCat.recipes.length,
        };
      } else {
        mergedCategories.push(noodleCat);
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

    // 5. Refresh from API in background (fire-and-forget)
    fetchFromApiAndUpdate().catch(() => {});

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
    const onUpdate = (cats: Category[], recs: Recipe[]) => {
      if (mountedRef.current) {
        setCategories(cats);
        setRecipes(recs);
      }
    };
    listeners.add(onUpdate);
    doLoad();
    return () => {
      mountedRef.current = false;
      listeners.delete(onUpdate);
    };
  }, []);

  const retry = () => {
    cachedCategories = null;
    cachedRecipes = null;
    inflight = null;
    fullDataCache = null;
    recipeIndexCache = null;
    doLoad();
  };

  return { recipes, categories, loading, error, retry };
}

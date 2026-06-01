import { useState, useEffect, useRef } from 'react';
import { fetchAllRecipes, fetchCategories } from '@/services/api';
import { transformDishIndex } from '@/lib/api-transform';
import type { Recipe, Category } from '@/types';
import type { DishIndex, ApiCategory } from '@/types/api';

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
  const res = await fetch('/data/recipes-index.json');
  if (!res.ok) throw new Error(`Index fetch failed: ${res.status}`);
  return res.json() as Promise<Category[]>;
}

async function fetchEnglishIndex(): Promise<Category[]> {
  try {
    const res = await fetch('/data/en_index_curated.json');
    if (!res.ok) return [];
    const data = await res.json();
    // Transform English dishes to Category format
    const recipes = data.dishes.map((dish: any) => ({
      id: `en/${dish.name}`,
      name: dish.name,
      category: dish.category,
      imagePath: '', // 不使用外部图片，避免侵权
      difficulty: dish.difficulty,
      cuisine: dish.cuisine,
      cooking_method: dish.cooking_method,
      cook_time: dish.cook_time,
      ingredients: dish.ingredients,
      main_ingredients: dish.main_ingredients || [],
      tags: dish.tags || {},
      source: dish.source,
      description: dish.epicurious_meta?.description || '',
      language: 'en',
    }));
    // Group by category
    const grouped = new Map<string, any[]>();
    for (const recipe of recipes) {
      const list = grouped.get(recipe.category);
      if (list) {
        list.push(recipe);
      } else {
        grouped.set(recipe.category, [recipe]);
      }
    }
    return Array.from(grouped.entries()).map(([id, recipes]) => ({
      id: `en-${id}`,
      name: `English ${id}`,
      displayName: `English ${id}`,
      count: recipes.length,
      recipes,
    }));
  } catch {
    return [];
  }
}

async function fetchNoodleRecipes(): Promise<Category[]> {
  try {
    const res = await fetch('/data/noodle-recipes.json');
    if (!res.ok) return [];
    const data = await res.json();
    // Transform noodle dishes to Category format
    const recipes = data.dishes.map((dish: any) => ({
      id: dish.id,
      name: dish.name,
      category: dish.category,
      imagePath: '',
      difficulty: dish.difficulty,
      cuisine: dish.cuisine,
      cooking_method: dish.cooking_method,
      cook_time: dish.cook_time,
      ingredients: dish.ingredients,
      main_ingredients: dish.main_ingredients || [],
      tags: {},
      source: dish.source,
      description: dish.description || '',
      language: 'zh',
      steps_text: dish.steps_text || '',
    }));
    // Group by category
    const grouped = new Map<string, any[]>();
    for (const recipe of recipes) {
      const list = grouped.get(recipe.category);
      if (list) {
        list.push(recipe);
      } else {
        grouped.set(recipe.category, [recipe]);
      }
    }
    return Array.from(grouped.entries()).map(([id, recipes]) => ({
      id: `noodle-${id}`,
      name: `面食之神 ${id}`,
      displayName: `面食之神`,
      count: recipes.length,
      recipes,
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
  const res = await fetch('/data/recipes.json');
  if (!res.ok) throw new Error(`Fallback fetch failed: ${res.status}`);
  return res.json() as Promise<Category[]>;
}

let fullDataCache: Category[] | null = null;

async function getFullRecipeData(): Promise<Category[]> {
  if (fullDataCache) return fullDataCache;
  const [data, flavorProfiles] = await Promise.all([
    fetchFullFallback(),
    fetchFlavorProfiles(),
  ]);
  // Merge flavor profiles into recipes
  for (const cat of data) {
    for (const recipe of cat.recipes) {
      const fp = flavorProfiles[recipe.id];
      if (fp) recipe.flavorProfile = fp;
    }
  }
  fullDataCache = data;
  return data;
}

export { getFullRecipeData };

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
  } catch (err) {
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

    // 2. Merge English categories into Chinese categories
    const mergedCategories = [...categories];
    for (const enCat of englishCategories) {
      const existing = mergedCategories.find(c => c.id === enCat.id.replace('en-', ''));
      if (existing) {
        // Add English recipes to existing category
        existing.recipes.push(...enCat.recipes);
        existing.count = existing.recipes.length;
      } else {
        // Add new English category
        mergedCategories.push(enCat);
      }
    }

    // 3. Merge noodle recipes (面食之神) into categories
    for (const noodleCat of noodleCategories) {
      const existing = mergedCategories.find(c => c.id === 'staple');
      if (existing) {
        // Add noodle recipes to staple category
        existing.recipes.push(...noodleCat.recipes);
        existing.count = existing.recipes.length;
      } else {
        // Add new category
        mergedCategories.push(noodleCat);
      }
    }

    const recipes = mergedCategories.flatMap(c => c.recipes);

    // 3. Merge flavor profiles into recipes
    for (const recipe of recipes) {
      const fp = flavorProfiles[recipe.id];
      if (fp) {
        recipe.flavorProfile = fp;
      }
    }

    cachedCategories = mergedCategories;
    cachedRecipes = recipes;

    // 4. Refresh from API in background (fire-and-forget)
    fetchFromApiAndUpdate().catch(() => {});

    return { categories: mergedCategories, recipes };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    cachedCategories = null;
    cachedRecipes = null;
    inflight = null;
    fullDataCache = null;
    doLoad();
  };

  return { recipes, categories, loading, error, retry };
}

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

async function fetchFallback(): Promise<Category[]> {
  const res = await fetch('/data/recipes.json');
  if (!res.ok) throw new Error(`Fallback fetch failed: ${res.status}`);
  return res.json() as Promise<Category[]>;
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
  } catch (err) {
    console.warn('[useRecipes] API refresh failed, using local data:', err instanceof Error ? err.message : err);
  }
}

async function loadRecipes(): Promise<{ categories: Category[]; recipes: Recipe[] }> {
  if (cachedCategories && cachedRecipes) {
    return { categories: cachedCategories, recipes: cachedRecipes };
  }

  if (inflight) return inflight;

  inflight = (async () => {
    // 1. Load local JSON immediately for instant render
    const categories = await fetchFallback();
    const recipes = categories.flatMap(c => c.recipes);
    cachedCategories = categories;
    cachedRecipes = recipes;

    // 2. Refresh from API in background (fire-and-forget)
    fetchFromApiAndUpdate().catch(() => {});

    return { categories, recipes };
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
            err instanceof Error ? err.message : '加载菜谱数据失败',
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
    // Reset cache and inflight so a fresh fetch happens
    cachedCategories = null;
    cachedRecipes = null;
    inflight = null;
    doLoad();
  };

  return { recipes, categories, loading, error, retry };
}

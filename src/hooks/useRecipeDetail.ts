import { useState, useEffect, useRef } from 'react';
import { getRecipeDetail } from '@/services/api';
import { transformApiRecipe } from '@/lib/api-transform';
import type { Recipe } from '@/types';

interface UseRecipeDetailResult {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  fromApi: boolean;
}

export function useRecipeDetail(
  recipeId: string | undefined,
  localFallback: Recipe | null,
): UseRecipeDetailResult {
  const [recipe, setRecipe] = useState<Recipe | null>(localFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromApi, setFromApi] = useState(false);

  const fallbackRef = useRef(localFallback);
  fallbackRef.current = localFallback;

  useEffect(() => {
    if (!recipeId) {
      setRecipe(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDetail(id: string) {
      setLoading(true);
      setError(null);
      try {
        const apiRecipe = await getRecipeDetail(id);
        if (!cancelled) {
          setRecipe(transformApiRecipe(apiRecipe));
          setFromApi(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recipe');
          setRecipe(fallbackRef.current);
          setFromApi(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail(recipeId);
    return () => { cancelled = true; };
  }, [recipeId]);

  return { recipe, loading, error, fromApi };
}
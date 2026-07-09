import { useState, useEffect, useRef } from 'react';
import { getRecipeDetail } from '@/services/api';
import { transformApiRecipe, withFlavorProfile } from '@/lib/api-transform';
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
  // Render the local fallback immediately — no blank screen while the API
  // request is in flight or timing out (10s). The API call enhances; it never
  // blocks first paint. Mirrors the "local-first" model used by useRecipes.
  const [recipe, setRecipe] = useState<Recipe | null>(localFallback);
  const [loading, setLoading] = useState(!localFallback);
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

    // Show the local fallback right away so the user never stares at a
    // loading spinner waiting on the API. Only block on loading when there
    // is genuinely no local data to show.
    setRecipe(fallbackRef.current);
    setError(null);
    setFromApi(false);
    setLoading(!fallbackRef.current);

    let cancelled = false;

    async function fetchDetail(id: string) {
      try {
        const apiRecipe = await getRecipeDetail(id);
        if (!cancelled) {
          // API detail enriches steps/introduction but does NOT carry
          // flavorProfile — re-attach the one from the local fallback
          // (merged by loadRecipes) so the radar chart survives the API swap.
          setRecipe(
            withFlavorProfile(
              transformApiRecipe(apiRecipe),
              fallbackRef.current?.flavorProfile,
            ),
          );
          setFromApi(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recipe');
          // Keep the local fallback already shown; don't blank it out.
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
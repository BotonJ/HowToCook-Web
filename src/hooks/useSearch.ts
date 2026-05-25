import { useState, useEffect, useMemo } from 'react';
import { searchRecipes } from '@/services/api';
import type { Recipe } from '@/types';
import type { ApiSearchResult } from '@/types/api';
import { transformSearchResult } from '@/lib/api-transform';

interface UseSearchResult {
  results: Recipe[] | null;
  loading: boolean;
  error: string | null;
}

export function useSearch(
  query: string,
  localRecipes: Recipe[],
  debounceMs = 300,
): UseSearchResult {
  const [results, setResults] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localMap = useMemo(
    () => new Map(localRecipes.map(r => [r.id, r])),
    [localRecipes],
  );

  const sourceIds = useMemo(
    () => new Set(localRecipes.map(r => r.source)),
    [localRecipes],
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchRecipes({ q: trimmed });
        const recipes = response.results
          .map((r: ApiSearchResult) => transformSearchResult(r, localMap))
          .filter(r => sourceIds.has(r.source));
        setResults(recipes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, localMap, sourceIds, debounceMs]);

  return { results, loading, error };
}

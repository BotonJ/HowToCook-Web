import { useState, useEffect, useMemo, useRef } from 'react';
import { searchRecipes } from '@/services/api';
import { useTurnstileToken } from '@/components/TurnstileProvider';
import type { Recipe } from '@/types';
import type { ApiSearchResult } from '@/types/api';
import { transformSearchResult } from '@/lib/api-transform';

const RATE_LIMIT_WINDOW = 30_000;
const RATE_LIMIT_MAX = 10;

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
  const { getToken } = useTurnstileToken();

  const localMap = useMemo(
    () => new Map(localRecipes.map(r => [r.id, r])),
    [localRecipes],
  );

  const sourceIds = useMemo(
    () => new Set(localRecipes.map(r => r.source)),
    [localRecipes],
  );

  const apiTimestamps = useRef<number[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort any in-flight fetch from a previous keystroke
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      // Client-side rate limiting: max 10 API requests per 30s
      const now = Date.now();
      apiTimestamps.current = apiTimestamps.current.filter(t => now - t < RATE_LIMIT_WINDOW);
      if (apiTimestamps.current.length >= RATE_LIMIT_MAX) {
        // Rate limited — fallback to local search
        const local = localRecipes.filter(r => r.name.toLowerCase().includes(trimmed.toLowerCase()));
        setResults(local);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        apiTimestamps.current.push(Date.now());
        const turnstileToken = await getToken();
        if (controller.signal.aborted) return;
        const response = await searchRecipes({ q: trimmed, turnstileToken });
        if (controller.signal.aborted) return;
        const recipes = response.results
          .map((r: ApiSearchResult) => transformSearchResult(r, localMap))
          .filter(r => sourceIds.has(r.source));
        setResults(recipes);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, localMap, sourceIds, debounceMs, getToken, localRecipes]);

  return { results, loading, error };
}

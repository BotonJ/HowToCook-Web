import { useState, useEffect } from 'react';

/**
 * Substitute profile entry — precomputed top-5 alternatives for an ingredient.
 *
 * Source: recipe-embedding/data/cluster_validation/08_substitute_profiles.py
 * Contract: DATA-ACCESS-CONTRACT §11 (substitute 预计算层).
 *
 * Notes:
 * - `flavor` and `nutrition_sim` are optional; the UI currently shows only
 *   name + reason. Richer fields are carried for future use.
 * - The JSON carries NO vectors (Axiom 2): only derived similarity scores
 *   and precomputed flavor/nutrition summaries are shipped to the client.
 */
export interface SubstituteEntry {
  name: string;
  score: number;
  reason: '同类替代' | '风味匹配';
  flavor?: { sweet: number; sour: number; umami: number; spicy: number } | null;
  nutrition_sim?: number | null;
}

export type SubstituteMap = Record<string, SubstituteEntry[]>;

// Module-level cache: the JSON (~2.4MB) is fetched once per session and held
// in memory. Mirrors the cachedRecipes pattern in useRecipes.ts.
let cachedProfiles: SubstituteMap | null = null;
let inflight: Promise<SubstituteMap> | null = null;

async function fetchSubstituteProfiles(): Promise<SubstituteMap> {
  if (cachedProfiles) return cachedProfiles;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/data/substitute-profiles.json');
      if (!res.ok) return {};
      const data = (await res.json()) as SubstituteMap;
      cachedProfiles = data;
      return data;
    } catch {
      return {};
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

interface UseSubstituteProfilesResult {
  /** Lookup helper: returns substitutes for an ingredient name, or null. */
  getSubstitutes: (ingredient: string) => SubstituteEntry[] | null;
  /** True until the JSON has been fetched (or fetch failed) at least once. */
  loading: boolean;
}

/**
 * Load the substitute-profiles JSON once (session-cached) and expose a lookup
 * helper. Intended for the recipe detail page — the fetch fires on first mount
 * and is shared across subsequent mounts via the module-level cache.
 */
export function useSubstituteProfiles(): UseSubstituteProfilesResult {
  const [loading, setLoading] = useState(!cachedProfiles);

  useEffect(() => {
    if (cachedProfiles) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchSubstituteProfiles().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getSubstitutes = (ingredient: string): SubstituteEntry[] | null => {
    if (!cachedProfiles) return null;
    return cachedProfiles[ingredient] ?? null;
  };

  return { getSubstitutes, loading };
}

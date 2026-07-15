import { useState, useEffect } from 'react';

export interface PairEntry {
  name: string;
  pmi: number;
  score: number;
}

export type PairMap = Record<string, PairEntry[]>;

let cachedProfiles: PairMap | null = null;
let inflight: Promise<PairMap> | null = null;

async function fetchPairProfiles(): Promise<PairMap> {
  if (cachedProfiles) return cachedProfiles;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/data/pair-profiles.json');
      if (!res.ok) return {};
      const data = (await res.json()) as PairMap;
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

interface UsePairProfilesResult {
  getPairs: (ingredient: string) => PairEntry[] | null;
  loading: boolean;
}

export function usePairProfiles(): UsePairProfilesResult {
  const [loading, setLoading] = useState(!cachedProfiles);

  useEffect(() => {
    if (cachedProfiles) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchPairProfiles().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getPairs = (ingredient: string): PairEntry[] | null => {
    if (!cachedProfiles) return null;
    return cachedProfiles[ingredient] ?? null;
  };

  return { getPairs, loading };
}

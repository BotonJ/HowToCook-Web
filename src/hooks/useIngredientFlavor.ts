import { useState, useEffect } from 'react';

export interface IngredientFlavor {
  sweet: number;
  sour: number;
  umami: number;
  spicy: number;
  category: string;
}

export type IngredientFlavorMap = Record<string, IngredientFlavor>;

let cachedProfiles: IngredientFlavorMap | null = null;
let inflight: Promise<IngredientFlavorMap> | null = null;

async function fetchIngredientFlavor(): Promise<IngredientFlavorMap> {
  if (cachedProfiles) return cachedProfiles;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/data/ingredient-flavor-profiles.json');
      if (!res.ok) return {};
      const data = (await res.json()) as IngredientFlavorMap;
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

interface UseIngredientFlavorResult {
  getFlavor: (ingredient: string) => IngredientFlavor | null;
  hasIngredient: (ingredient: string) => boolean;
  loading: boolean;
}

export function useIngredientFlavor(): UseIngredientFlavorResult {
  const [loading, setLoading] = useState(!cachedProfiles);

  useEffect(() => {
    if (cachedProfiles) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchIngredientFlavor().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getFlavor = (ingredient: string): IngredientFlavor | null => {
    if (!cachedProfiles) return null;
    return cachedProfiles[ingredient] ?? null;
  };

  const hasIngredient = (ingredient: string): boolean => {
    if (!cachedProfiles) return false;
    return ingredient in cachedProfiles;
  };

  return { getFlavor, hasIngredient, loading };
}

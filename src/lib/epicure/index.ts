import { useState, useEffect, useRef, useCallback } from 'react';
import type { PairingResult, ModeResult, CuisinePole } from './types';
import * as engine from './engine';

export interface UseEpicureResult {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  getNearestNeighbors: (ingredient: string, k: number) => PairingResult[];
  slerp: (seed: string, direction: string, angleDeg: number, k: number) => PairingResult[];
  slerpToCuisine: (seed: string, cuisineKey: string, angleDeg: number, k: number) => PairingResult[];
  getClosestMode: (ingredient: string, k: number) => ModeResult[];
  searchVocabulary: (query: string, limit: number) => string[];
  getEmbedding: (index: number) => Float32Array | null;
  computeRecipeEmbeddings: (recipes: Array<{ id: string; ingredients: string[] }>) => Array<{ id: string; embedding: Float32Array }>;
  getIngredientIndex: (name: string) => number | undefined;
  cuisinePoles: CuisinePole[];
  zhMap: Record<string, string>;
  modeLabelsZh: Record<string, string>;
}

export function useEpicure(): UseEpicureResult {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (engine.isLoaded()) {
      setLoaded(true);
      setLoading(false);
      return;
    }

    engine
      .loadData()
      .then(() => {
        if (mountedRef.current) {
          setLoaded(true);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load ingredient data');
          setLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getNearestNeighbors = useCallback(
    (ingredient: string, k: number): PairingResult[] => {
      if (!engine.isLoaded()) return [];
      return engine.getNearestNeighbors(ingredient, k);
    },
    [],
  );

  const slerp = useCallback(
    (seed: string, direction: string, angleDeg: number, k: number): PairingResult[] => {
      if (!engine.isLoaded()) return [];
      return engine.slerp(seed, direction, angleDeg, k);
    },
    [],
  );

  const slerpToCuisine = useCallback(
    (seed: string, cuisineKey: string, angleDeg: number, k: number): PairingResult[] => {
      if (!engine.isLoaded()) return [];
      return engine.slerpToCuisine(seed, cuisineKey, angleDeg, k);
    },
    [],
  );

  const getClosestMode = useCallback(
    (ingredient: string, k: number): ModeResult[] => {
      if (!engine.isLoaded()) return [];
      return engine.getClosestMode(ingredient, k);
    },
    [],
  );

  const searchVocabulary = useCallback(
    (query: string, limit: number): string[] => {
      if (!engine.isLoaded()) return [];
      return engine.searchVocabulary(query, limit);
    },
    [],
  );

  const getEmbedding = useCallback(
    (index: number): Float32Array | null => {
      if (!engine.isLoaded()) return null;
      return engine.getEmbedding(index);
    },
    [],
  );

  const computeRecipeEmbeddings = useCallback(
    (recipes: Array<{ id: string; ingredients: string[] }>): Array<{ id: string; embedding: Float32Array }> => {
      if (!engine.isLoaded()) return [];
      return engine.computeRecipeEmbeddings(recipes);
    },
    [],
  );

  const getIngredientIndex = useCallback(
    (name: string): number | undefined => {
      if (!engine.isLoaded()) return undefined;
      return engine.getIngredientIndex(name);
    },
    [],
  );

  const cuisinePoles = engine.isLoaded() ? engine.getCuisinePoles() : [];
  const zhMap = engine.isLoaded() ? engine.getZhMap() : {};
  const modeLabelsZh = engine.isLoaded() ? engine.getModeLabelsZh() : {};

  return {
    loaded,
    loading,
    error,
    getNearestNeighbors,
    slerp,
    slerpToCuisine,
    getClosestMode,
    searchVocabulary,
    getEmbedding,
    computeRecipeEmbeddings,
    getIngredientIndex,
    cuisinePoles,
    zhMap,
    modeLabelsZh,
  };
}

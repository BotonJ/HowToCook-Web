import { useState, useEffect, useRef, useCallback } from 'react';
import type { PairingResult, ModeResult, CuisinePole } from './types';
import * as engine from './engine';

interface UseEpicureResult {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  getNearestNeighbors: (ingredient: string, k: number) => PairingResult[];
  slerp: (seed: string, direction: string, angleDeg: number, k: number) => PairingResult[];
  slerpToCuisine: (seed: string, cuisineKey: string, angleDeg: number, k: number) => PairingResult[];
  getClosestMode: (ingredient: string, k: number) => ModeResult[];
  searchVocabulary: (query: string, limit: number) => string[];
  cuisinePoles: CuisinePole[];
  zhMap: Record<string, string>;
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

  const cuisinePoles = engine.isLoaded() ? engine.getCuisinePoles() : [];
  const zhMap = engine.isLoaded() ? engine.getZhMap() : {};

  return {
    loaded,
    loading,
    error,
    getNearestNeighbors,
    slerp,
    slerpToCuisine,
    getClosestMode,
    searchVocabulary,
    cuisinePoles,
    zhMap,
  };
}

import { useMemo } from 'react';
import {
  getFlavorProfile,
  loadFlavorProfiles,
  isFlavorProfilesLoaded,
} from '@/lib/flavor-profiles';
import {
  getNearestNeighbors,
  slerp,
  getCooccurrencePairs,
  getEnName,
} from '@/lib/epicure/engine';
import type { PairingResult } from '@/lib/epicure/types';
import { loadCooccurrenceData } from '@/lib/epicure/engine';
import type { FlavorProfile } from '@/lib/epicure/types';
import type { Neighbor } from './mockData';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Map epicure PairingResult → Neighbor shape for the UI */
function toNeighbor(p: PairingResult): Neighbor {
  return {
    name: p.nameZh || p.name,
    score: p.score,
    emoji: '🍽️', // emoji resolved by caller via ingredient emoji map
  };
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/**
 * Resolves real data for the currently selected ingredient.
 * Call this inside a component that is wrapped by WorkbenchV2Provider.
 *
 * @param selectedZh Chinese display name of the selected ingredient
 */
export function useWorkbenchV2Data(selectedZh: string) {
  const enName = getEnName(selectedZh); // '' if not found

  // ── Flavor Profile (6D) ────────────────────────────────────────────────
  const flavorProfile = useMemo<FlavorProfile | null>(() => {
    if (!enName) return null;
    return getFlavorProfile(enName);
  }, [enName]);

  // ── Nearest Neighbors (flavor wheel) ──────────────────────────────────
  const neighbors = useMemo<Neighbor[]>(() => {
    if (!enName) return [];
    return getNearestNeighbors(enName, 9).map(toNeighbor);
  }, [enName]);

  // ── SLERP results at 4 interpolation angles ─────────────────────────────
  // We interpolate from the selected ingredient toward a fixed "bridge" ingredient (Strawberry).
  // In production this target would be user-selectable.
  const SLERP_TARGET = 'strawberry';
  const slerpResults = useMemo(() => {
    if (!enName) return [];
    return [0, 30, 60, 90].map((angle) => {
      const items = slerp(enName, SLERP_TARGET, angle, 2).map((p) => {
        const zh = p.nameZh || p.name;
        return `${zh}(${p.score.toFixed(2)})`;
      });
      return { angle: `${angle}°` as const, items };
    });
  }, [enName]);

  // ── Cooccurrence Pairs (classic pairings) ───────────────────────────────
  const cooccurrencePairs = useMemo(() => {
    if (!selectedZh) return [];
    // Cooccurrence data is keyed by Chinese name
    return getCooccurrencePairs(selectedZh, selectedZh, 4).map((p) => ({
      emoji: '🧄',
      name: p.ingredient,
      pmi: p.pmi,
      compound: `PMI ${p.pmi.toFixed(1)}`,
    }));
  }, [selectedZh]);

  return {
    flavorProfile,
    neighbors,
    slerpResults,
    cooccurrencePairs,
  };
}

/** Ensure all epicure data is loaded before rendering. */
export async function preloadWorkbenchV2Data(): Promise<void> {
  await Promise.all([loadFlavorProfiles(), loadCooccurrenceData()]);
}

/** True when all required datasets are ready. */
export function isWorkbenchV2DataReady(): boolean {
  return isFlavorProfilesLoaded();
}
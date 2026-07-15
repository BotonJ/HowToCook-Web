/**
 * Four-dimensional flavor system constants.
 * Shared across all recipe-level radar components.
 *
 * Single source of truth for dimension keys, labels (zh), and colors.
 * Import from here instead of defining local constants.
 */

export const FLAVOR_DIMS = ['sweet', 'sour', 'umami', 'spicy'] as const;
export type FlavorDim = typeof FLAVOR_DIMS[number];

export const FLAVOR_LABELS_ZH: Record<FlavorDim, string> = {
  sweet: '甜',
  sour: '酸',
  umami: '鲜',
  spicy: '辣',
};

/** Canonical per-dimension config used by RadarChart, DimBars, FlavorProfileBars, etc. */
export const FLAVOR_DIM_CONFIG: ReadonlyArray<{
  readonly key: FlavorDim;
  readonly label: string;
  readonly color: string;
}> = [
  { key: 'sweet',  label: '甜', color: '#ff6b9d' },
  { key: 'sour',   label: '酸', color: '#ffd166' },
  { key: 'umami',  label: '鲜', color: '#4ecdc4' },
  { key: 'spicy',  label: '辣', color: '#ef476f' },
] as const;

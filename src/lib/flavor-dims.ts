/**
 * Six-dimensional flavor system constants.
 * Shared across all workbench components.
 *
 * Single source of truth for dimension keys, labels (zh), colors, and emojis.
 * Import from here instead of defining local constants.
 */

export const FLAVOR_DIMS = ['sweet', 'sour', 'bitter', 'umami', 'spicy', 'fatty'] as const;
export type FlavorDim = typeof FLAVOR_DIMS[number];

export const FLAVOR_LABELS_ZH: Record<FlavorDim, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  umami: '鲜',
  spicy: '辣',
  fatty: '脂',
};

/** Canonical per-dimension config used by RadarChart, DimBars, FlavorProfileBars, etc. */
export const FLAVOR_DIM_CONFIG: ReadonlyArray<{
  readonly key: FlavorDim;
  readonly label: string;
  readonly color: string;
  readonly emoji: string;
}> = [
  { key: 'sweet',  label: '甜', color: '#ff6b9d', emoji: '🍬' },
  { key: 'sour',   label: '酸', color: '#ffd166', emoji: '🍋' },
  { key: 'bitter', label: '苦', color: '#06d6a0', emoji: '🫒' },
  { key: 'umami',  label: '鲜', color: '#4ecdc4', emoji: '🍄' },
  { key: 'spicy',  label: '辣', color: '#ef476f', emoji: '🌶️' },
  { key: 'fatty',  label: '脂', color: '#e0aaff', emoji: '🧈' },
] as const;

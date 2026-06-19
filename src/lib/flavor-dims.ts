/**
 * Eight-dimensional flavor system constants.
 * Shared across all workbench components.
 *
 * Single source of truth for dimension keys, labels (zh), colors, and emojis.
 * Import from here instead of defining local constants.
 */

export const FLAVOR_DIMS = ['sweet', 'sour', 'bitter', 'umami', 'spicy', 'fat', 'salty', 'aromatic'] as const;
export type FlavorDim = typeof FLAVOR_DIMS[number];

export const FLAVOR_LABELS_ZH: Record<FlavorDim, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  umami: '鲜',
  spicy: '辣',
  fat: '脂肪',
  salty: '咸',
  aromatic: '香',
};

/** Canonical per-dimension config used by RadarChart, DimBars, FlavorProfileBars, etc. */
export const FLAVOR_DIM_CONFIG: ReadonlyArray<{
  readonly key: FlavorDim;
  readonly label: string;
  readonly color: string;
  readonly emoji: string;
}> = [
  { key: 'sweet',    label: '甜', color: '#ff6b9d', emoji: '🍬' },
  { key: 'sour',     label: '酸', color: '#ffd166', emoji: '🍋' },
  { key: 'bitter',   label: '苦', color: '#06d6a0', emoji: '🫒' },
  { key: 'umami',    label: '鲜', color: '#4ecdc4', emoji: '🍄' },
  { key: 'spicy',    label: '辣', color: '#ef476f', emoji: '🌶️' },
  { key: 'fat',      label: '脂肪', color: '#e0aaff', emoji: '🧈' },
  { key: 'salty',    label: '咸', color: '#118ab2', emoji: '🧂' },
  { key: 'aromatic', label: '香', color: '#d4a373', emoji: '🌿' },
] as const;

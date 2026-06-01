/**
 * Six-dimensional flavor system constants.
 * Shared across all workbench components.
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

export const FLAVOR_COLORS: Record<FlavorDim, string> = {
  sweet: '#f59e0b',
  sour: '#84cc16',
  bitter: '#6366f1',
  umami: '#ef4444',
  spicy: '#f97316',
  fatty: '#a855f7',
};

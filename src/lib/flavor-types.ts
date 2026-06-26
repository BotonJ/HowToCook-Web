/**
 * Canonical 8-dimensional flavor vector type.
 * Single source of truth for the flavor data shape across all components.
 */

export interface FlavorVector {
  sweet: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fat: number;
  salty: number;
  aromatic: number;
}

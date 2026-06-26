/**
 * Nutrition data contract for workbench ingredients.
 *
 * Reads nutrition info from workbench-data.json (c3v2 pipeline output).
 * Contract is stable — future data source changes only affect implementation,
 * not callers.
 */

export interface NutritionInfo {
  energy: number;        // kcal
  protein: number;       // g
  carbohydrate: number;  // g
  fat_total: number;     // g
  fiber: number;         // g
  nutritionSource: string;   // nutrition_index | usda_manual | ...
  nutritionMatch: 'direct' | 'alias' | 'curated' | 'fuzzy';
}

interface WorkbenchIngredient {
  id: string;
  nutrition?: NutritionInfo;
}

let nutritionMap: Map<string, NutritionInfo> | null = null;

/**
 * Load nutrition data from workbench-data.json.
 * Idempotent — subsequent calls are no-ops.
 */
export async function loadNutrition(): Promise<void> {
  if (nutritionMap) return;

  const resp = await fetch('/data/flavor-workbench/workbench-data.json');
  if (!resp.ok) throw new Error(`Failed to load workbench data: ${resp.status}`);

  const data = await resp.json();
  const ingredients: WorkbenchIngredient[] = data.ingredients ?? [];

  nutritionMap = new Map();
  for (const ing of ingredients) {
    if (ing.nutrition?.energy != null) {
      nutritionMap.set(ing.id, ing.nutrition);
    }
  }
}

/**
 * Get nutrition info for an ingredient by id.
 * Returns null if ingredient not found or has no nutrition data.
 */
export function getNutrition(ingredientId: string): NutritionInfo | null {
  return nutritionMap?.get(ingredientId) ?? null;
}

/**
 * Check if nutrition data is loaded.
 */
export function isNutritionLoaded(): boolean {
  return nutritionMap !== null;
}

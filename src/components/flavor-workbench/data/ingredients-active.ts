import { getIngredients, getCooccurrencePairs, type Ingredient } from './ingredients';

/**
 * Get ingredients that have at least 1 cooccurrence pair.
 * This is the shared active ingredients computation used across multiple tabs.
 */
export function getActiveIngredients(): Ingredient[] {
  const all = getIngredients();
  if (all.length === 0) return [];
  const pairs = getCooccurrencePairs();
  const connectedIds = new Set<string>();
  for (const p of pairs) {
    connectedIds.add(p.a);
    connectedIds.add(p.b);
  }
  return all.filter(i => connectedIds.has(i.id));
}

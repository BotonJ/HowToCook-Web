import { useMemo } from 'react';
import { getFlavorProfile, getAllFlavorProfiles } from '@/lib/flavor-profiles';
import { FLAVOR_DIMS, FLAVOR_LABELS_ZH } from '@/lib/flavor-dims';

interface SuggestionsProps {
  ingredients: string[];
  onAdd?: (ingredient: string) => void;
}

export function Suggestions({ ingredients, onAdd }: SuggestionsProps) {
  const suggestions = useMemo(() => {
    const all = getAllFlavorProfiles();
    if (!all) return [];

    const profiles = ingredients
      .map((id) => getFlavorProfile(id))
      .filter((p): p is NonNullable<typeof p> => p !== null && p.tier <= 3);

    if (profiles.length === 0) return [];

    const avg: Record<string, number> = {};
    for (const dim of FLAVOR_DIMS) {
      avg[dim] = profiles.reduce((s, p) => s + (p[dim] as number), 0) / profiles.length;
    }

    // Find weakest dimension
    const sorted = [...FLAVOR_DIMS].sort((a, b) => avg[a] - avg[b]);
    const weakest = sorted[0];
    const weakestVal = avg[weakest];

    if (weakestVal > 6) return []; // Balanced enough

    // Find Tier 1-2 ingredients strong in weakest dimension, excluding selected
    const selectedSet = new Set(ingredients);
    const candidates: Array<{ id: string; value: number }> = [];

    for (const [id, prof] of Object.entries(all)) {
      if (selectedSet.has(id)) continue;
      if (prof.tier > 2) continue;
      const val = prof[weakest as keyof typeof prof] as number;
      if (val >= 7) {
        candidates.push({ id, value: val });
      }
    }

    candidates.sort((a, b) => b.value - a.value);
    return candidates.slice(0, 5).map((c) => ({
      id: c.id,
      dim: weakest,
      dimLabel: FLAVOR_LABELS_ZH[weakest],
      value: c.value,
    }));
  }, [ingredients]);

  if (suggestions.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-3">补充建议</h3>
        <p className="text-sm text-on-surface-variant">风味已较均衡，无需特别补充</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">补充建议</h3>
      <p className="text-sm text-on-surface-variant mb-3">
        {suggestions[0]?.dimLabel}味偏弱，推荐添加以下食材：
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onAdd?.(s.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface transition hover:border-primary hover:bg-primary-container"
          >
            <span className="font-medium">{s.id.replace(/_/g, ' ')}</span>
            <span className="text-xs text-on-surface-variant">{s.dimLabel} {s.value.toFixed(1)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

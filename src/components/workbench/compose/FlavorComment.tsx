import { useMemo } from 'react';
import { getFlavorProfile } from '@/lib/flavor-profiles';
import { FLAVOR_DIMS, FLAVOR_LABELS_ZH } from '@/lib/flavor-dims';

interface FlavorCommentProps {
  ingredients: string[];
}

export function FlavorComment({ ingredients }: FlavorCommentProps) {
  const comment = useMemo(() => {
    const profiles = ingredients
      .map((id) => getFlavorProfile(id))
      .filter((p): p is NonNullable<typeof p> => p !== null && p.tier <= 3);

    if (profiles.length === 0) return null;

    const avg: Record<string, number> = {};
    for (const dim of FLAVOR_DIMS) {
      avg[dim] = profiles.reduce((s, p) => s + (p[dim] as number), 0) / profiles.length;
    }

    const sorted = [...FLAVOR_DIMS].sort((a, b) => avg[b] - avg[a]);
    const top = sorted[0];
    const second = sorted[1];
    const topVal = avg[top];
    const topLabel = FLAVOR_LABELS_ZH[top];
    const secondLabel = FLAVOR_LABELS_ZH[second];

    if (topVal > 7) return `${topLabel}味突出（${topVal.toFixed(1)}），${secondLabel}作为辅助，整体风味鲜明有力。`;
    if (topVal > 5) return `${topLabel}和${secondLabel}为主导，风味均衡有层次。`;
    return `各维度相对均衡，整体风味温和内敛。`;
  }, [ingredients]);

  if (!comment) return null;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-3">风味评价</h3>
      <p className="text-sm text-on-surface leading-relaxed">{comment}</p>
    </div>
  );
}

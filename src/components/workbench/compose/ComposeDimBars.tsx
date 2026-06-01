import { useMemo } from 'react';
import { getFlavorProfile } from '@/lib/flavor-profiles';

const DIM_CONFIG = [
  { key: 'sweet', label: '甜', color: '#ff6b9d' },
  { key: 'sour', label: '酸', color: '#ffd166' },
  { key: 'bitter', label: '苦', color: '#06d6a0' },
  { key: 'umami', label: '鲜', color: '#4ecdc4' },
  { key: 'spicy', label: '辣', color: '#ef476f' },
  { key: 'fatty', label: '脂', color: '#e0aaff' },
];

interface ComposeDimBarsProps {
  ingredients: string[];
}

export function ComposeDimBars({ ingredients }: ComposeDimBarsProps) {
  const profiles = useMemo(() => {
    return ingredients
      .map((id) => getFlavorProfile(id))
      .filter((p): p is NonNullable<typeof p> => p !== null && p.tier <= 3);
  }, [ingredients]);

  const avg = useMemo(() => {
    if (profiles.length === 0) return null;
    const result: Record<string, number> = {};
    for (const dim of DIM_CONFIG) {
      const sum = profiles.reduce((s, p) => s + (p[dim.key as keyof typeof p] as number), 0);
      result[dim.key] = sum / profiles.length;
    }
    return result;
  }, [profiles]);

  const mixedTier = useMemo(() => {
    if (profiles.length === 0) return null;
    return Math.max(...profiles.map((p) => p.tier));
  }, [profiles]);

  if (!avg || mixedTier === null) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-3">合成风味</h3>
        <p className="text-sm text-on-surface-variant">所选食材暂无 6 维风味数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-headline-sm text-on-surface">合成风味</h3>
        {mixedTier === 3 && <span className="text-xs text-on-surface-variant/60">参考值</span>}
      </div>
      <div className="space-y-3">
        {DIM_CONFIG.map((dim) => {
          const val = avg[dim.key];
          const pct = Math.min(100, Math.max(0, (val / 10) * 100));
          return (
            <div key={dim.key} className="flex items-center gap-3">
              <span className="text-sm text-on-surface w-8">{dim.label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: dim.color,
                    opacity: mixedTier === 3 ? 0.5 : 1,
                  }}
                />
              </div>
              <span className="text-xs text-on-surface-variant w-10 text-right">{val.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

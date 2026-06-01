import { useMemo } from 'react';
import { getFlavorProfile } from '@/lib/flavor-profiles';

const DIM_CONFIG: { key: string; label: string; color: string; emoji: string }[] = [
  { key: 'sweet', label: '甜', color: '#ff6b9d', emoji: '🍬' },
  { key: 'sour', label: '酸', color: '#ffd166', emoji: '🍋' },
  { key: 'bitter', label: '苦', color: '#06d6a0', emoji: '🫒' },
  { key: 'umami', label: '鲜', color: '#4ecdc4', emoji: '🍄' },
  { key: 'spicy', label: '辣', color: '#ef476f', emoji: '🌶️' },
  { key: 'fatty', label: '脂', color: '#e0aaff', emoji: '🧈' },
];

interface FlavorProfileBarsProps {
  ingredient: string;
}

export function FlavorProfileBars({ ingredient }: FlavorProfileBarsProps) {
  const profile = useMemo(() => getFlavorProfile(ingredient), [ingredient]);

  const tierLabel = useMemo(() => {
    if (!profile) return null;
    if (profile.tier === 1) return null;
    if (profile.tier === 2) return `基于 ${profile.nRecipes} 道菜推算`;
    if (profile.tier === 3) return '参考值';
    return null;
  }, [profile]);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-3">六维风味</h3>
        <p className="text-sm text-on-surface-variant">该食材暂无 6 维风味数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-headline-sm text-on-surface">六维风味</h3>
        {tierLabel && (
          <span className={`text-xs ${profile.tier === 3 ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
            {tierLabel}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {DIM_CONFIG.map((dim) => {
          const val = profile[dim.key as keyof typeof profile] as number;
          const pct = Math.min(100, Math.max(0, (val / 10) * 100));
          return (
            <div key={dim.key} className="flex items-center gap-3" title={`${dim.label}: ${val.toFixed(1)}/10`}>
              <span className="text-base w-6 text-center">{dim.emoji}</span>
              <span className="text-sm text-on-surface w-8">{dim.label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: dim.color,
                    opacity: profile.tier === 3 ? 0.5 : 1,
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

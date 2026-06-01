import { useMemo } from 'react';
import { getFlavorProfile } from '@/lib/flavor-profiles';

const DIMS = [
  { key: 'sweet', label: '甜', color: '#ff6b9d', emoji: '🍬' },
  { key: 'sour', label: '酸', color: '#ffd166', emoji: '🍋' },
  { key: 'bitter', label: '苦', color: '#06d6a0', emoji: '🫒' },
  { key: 'umami', label: '鲜', color: '#4ecdc4', emoji: '🍄' },
  { key: 'spicy', label: '辣', color: '#ef476f', emoji: '🌶️' },
  { key: 'fatty', label: '脂', color: '#e0aaff', emoji: '🧈' },
];

const COLORS = ['#ab3500', '#006e1c', '#00677e', '#8d7168', '#594139'];

interface RadarChartProps {
  ingredients: string[];
}

function hexVertex(i: number, radius: number, cx: number, cy: number) {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

export function RadarChart({ ingredients }: RadarChartProps) {
  const profiles = useMemo(() => {
    return ingredients
      .map((id) => ({ id, profile: getFlavorProfile(id) }))
      .filter((p): p is { id: string; profile: NonNullable<ReturnType<typeof getFlavorProfile>> } =>
        p.profile !== null && p.profile.tier <= 3
      );
  }, [ingredients]);

  const avgProfile = useMemo(() => {
    if (profiles.length === 0) return null;
    const avg: Record<string, number> = {};
    for (const dim of DIMS) {
      const sum = profiles.reduce((s, p) => s + (p.profile[dim.key as keyof typeof p.profile] as number), 0);
      avg[dim.key] = sum / profiles.length;
    }
    return avg;
  }, [profiles]);

  const cx = 200;
  const cy = 200;
  const R = 160;

  const gridLevels = [2, 4, 6, 8, 10];

  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-3">风味雷达图</h3>
        <p className="text-sm text-on-surface-variant">所选食材暂无 6 维风味数据</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">风味雷达图</h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-[320px] h-auto">
          {/* Grid */}
          {gridLevels.map((level) => {
            const points = DIMS.map((_, i) => {
              const v = hexVertex(i, (level / 10) * R, cx, cy);
              return `${v.x},${v.y}`;
            }).join(' ');
            return (
              <polygon
                key={`grid-${level}`}
                points={points}
                fill="none"
                stroke="#e1bfb5"
                strokeWidth={0.5}
                opacity={0.5}
              />
            );
          })}

          {/* Axis lines */}
          {DIMS.map((_, i) => {
            const v = hexVertex(i, R, cx, cy);
            return <line key={`axis-${i}`} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke="#e1bfb5" strokeWidth={0.5} opacity={0.5} />;
          })}

          {/* Data polygons */}
          {profiles.map((p, pi) => {
            const points = DIMS.map((dim, i) => {
              const val = p.profile[dim.key as keyof typeof p.profile] as number;
              const v = hexVertex(i, (val / 10) * R, cx, cy);
              return `${v.x},${v.y}`;
            }).join(' ');
            const color = COLORS[pi % COLORS.length];
            return (
              <polygon
                key={`poly-${p.id}`}
                points={points}
                fill={color}
                fillOpacity={0.08}
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.7}
              />
            );
          })}

          {/* Average polygon (dashed) */}
          {avgProfile && (
            <polygon
              points={DIMS.map((dim, i) => {
                const val = avgProfile[dim.key];
                const v = hexVertex(i, (val / 10) * R, cx, cy);
                return `${v.x},${v.y}`;
              }).join(' ')}
              fill="none"
              stroke="#ab3500"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}

          {/* Labels */}
          {DIMS.map((dim, i) => {
            const v = hexVertex(i, R + 22, cx, cy);
            return (
              <text
                key={`label-${i}`}
                x={v.x}
                y={v.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#594139"
                fontSize={12}
                fontWeight={600}
              >
                {dim.label}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {profiles.map((p, pi) => {
            const color = COLORS[pi % COLORS.length];
            return (
              <div key={p.id} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-on-surface">{p.id.replace(/_/g, ' ')}</span>
                {p.profile.tier >= 3 && (
                  <span className="text-[10px] text-on-surface-variant/60">(参考)</span>
                )}
              </div>
            );
          })}
          {avgProfile && (
            <div className="flex items-center gap-2 pt-1 border-t border-outline-variant">
              <div className="h-0.5 w-3 border-t-2 border-dashed border-primary" />
              <span className="text-sm text-on-surface font-medium">合成均值</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

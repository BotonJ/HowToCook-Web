import { useState, useEffect } from 'react';
import type { ModeResult } from '@/lib/epicure/types';
import { formatName } from '@/lib/epicure/engine';

interface ClusterPanelProps {
  ingredient: string;
  getClosestMode: (ingredient: string, k: number) => ModeResult[];
  modeLabelsZh: Record<string, string>;
  zhMap: Record<string, string>;
}

const MODE_KIND_COLORS: Record<string, string> = {
  taste: '#ab3500',
  aroma: '#006e1c',
  texture: '#00677e',
  function: '#8d7168',
  origin: '#594139',
};

export function ClusterPanel({ ingredient, getClosestMode, modeLabelsZh, zhMap }: ClusterPanelProps) {
  const [modes, setModes] = useState<ModeResult[]>([]);

  useEffect(() => {
    setModes(getClosestMode(ingredient, 5));
  }, [ingredient, getClosestMode]);

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">风味归属</h3>
      {modes.length === 0 ? (
        <p className="text-sm text-on-surface-variant">暂无模式数据</p>
      ) : (
        <div className="space-y-3">
          {modes.map((mode) => {
            const color = MODE_KIND_COLORS[mode.kind] || '#8d7168';
            const label = modeLabelsZh[mode.label] || formatName(mode.label);
            return (
              <div key={mode.modeId} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-on-surface">{label}</span>
                  <span className="ml-auto text-xs text-on-surface-variant">
                    {(mode.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pl-4.5">
                  {mode.members.slice(0, 6).map((m) => (
                    <span
                      key={m}
                      className="inline-block rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] text-on-surface-variant"
                    >
                      {zhMap[m] || formatName(m)}
                    </span>
                  ))}
                  {mode.nMembers > 6 && (
                    <span className="text-[11px] text-on-surface-variant/60">+{mode.nMembers - 6}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

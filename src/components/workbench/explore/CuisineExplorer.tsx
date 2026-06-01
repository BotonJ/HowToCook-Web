import { useState, useEffect, useCallback } from 'react';
import type { PairingResult, CuisinePole } from '@/lib/epicure/types';

interface CuisineExplorerProps {
  ingredient: string;
  slerpToCuisine: (seed: string, cuisineKey: string, angleDeg: number, k: number) => PairingResult[];
  cuisinePoles: CuisinePole[];
  zhMap: Record<string, string>;
  onSelect?: (ingredient: string) => void;
}

export function CuisineExplorer({
  ingredient,
  slerpToCuisine,
  cuisinePoles,
  zhMap: _zhMap,
  onSelect,
}: CuisineExplorerProps) {
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [angle, setAngle] = useState(45);
  const [results, setResults] = useState<PairingResult[]>([]);

  const explore = useCallback(
    (cuisineKey: string, deg: number) => {
      const res = slerpToCuisine(ingredient, cuisineKey, deg, 3);
      setResults(res);
    },
    [ingredient, slerpToCuisine]
  );

  useEffect(() => {
    if (activeCuisine) {
      explore(activeCuisine, angle);
    } else {
      setResults([]);
    }
  }, [activeCuisine, angle, explore]);

  const angleDesc =
    angle < 15
      ? '接近原味'
      : angle < 40
        ? '轻微融合'
        : angle < 65
          ? '风味混搭'
          : angle < 80
            ? '强烈转向'
            : '完全转变';

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">菜系探索（SLERP）</h3>

      {/* Cuisine pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {cuisinePoles.map((pole) => (
          <button
            key={pole.key}
            type="button"
            onClick={() => setActiveCuisine(activeCuisine === pole.key ? null : pole.key)}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeCuisine === pole.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-primary'
            }`}
          >
            {pole.label}
          </button>
        ))}
      </div>

      {activeCuisine && (
        <div className="space-y-4">
          {/* Angle slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface">融合角度</span>
              <span className="text-xs text-on-surface-variant">
                {angle}° — {angleDesc}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>0°</span>
              <span>45°</span>
              <span>90°</span>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {results.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => onSelect?.(r.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface transition hover:border-primary hover:bg-primary-container"
                >
                  <span className="font-medium">{r.nameZh || r.name}</span>
                  <span className="text-xs text-on-surface-variant">{(r.score * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

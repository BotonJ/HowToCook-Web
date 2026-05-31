import { useState, useMemo, useEffect } from 'react';
import type { PairingResult, CuisinePole } from '@/lib/epicure/types';
import { IngredientSearch } from './IngredientSearch';
import { IngredientCard } from './IngredientCard';
import { AngleSlider } from './AngleSlider';

interface SlerpPanelProps {
  slerpToCuisine: (seed: string, cuisineKey: string, angleDeg: number, k: number) => PairingResult[];
  searchVocabulary: (query: string, limit: number) => string[];
  zhMap?: Record<string, string>;
  cuisinePoles: CuisinePole[];
  selectedIngredient: string | null;
}

export function SlerpPanel({
  slerpToCuisine,
  searchVocabulary,
  zhMap,
  cuisinePoles,
  selectedIngredient,
}: SlerpPanelProps) {
  const [seed, setSeed] = useState<string | null>(selectedIngredient);
  const [direction, setDirection] = useState(cuisinePoles[0]?.key ?? '');
  const [angle, setAngle] = useState(30);

  useEffect(() => {
    if (selectedIngredient) setSeed(selectedIngredient);
  }, [selectedIngredient]);

  const results = useMemo(() => {
    if (!seed || !direction) return [];
    return slerpToCuisine(seed, direction, angle, 10);
  }, [seed, direction, angle, slerpToCuisine]);

  function handleSeedSelect(name: string) {
    setSeed(name);
  }

  function handleResultClick(name: string) {
    // No-op for slerp results — just display
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-headline-md text-on-surface">
        菜系探索
      </h3>

      <IngredientSearch
        onSelect={handleSeedSelect}
        searchVocabulary={searchVocabulary}
        zhMap={zhMap}
        placeholder={selectedIngredient ? selectedIngredient.replace(/_/g, ' ') : '选择种子食材...'}
      />

      <div className="space-y-2">
        <label className="text-sm text-on-surface-variant font-body block">
          菜系方向
        </label>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {cuisinePoles.map((pole) => (
            <option key={pole.key} value={pole.key}>
              {pole.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-on-surface-variant font-body block">
          混合角度
        </label>
        <AngleSlider value={angle} onChange={setAngle} />
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {results.map((r) => (
            <IngredientCard
              key={r.name}
              name={r.name}
              nameZh={r.nameZh}
              score={r.score}
              onClick={handleResultClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

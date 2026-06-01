import { useState, useMemo, useEffect } from 'react';
import type { PairingResult, CuisinePole } from '@/lib/epicure/types';
import { generateSlerpInterpretation } from '@/lib/epicure/interpretations';
import { IngredientSearch } from './IngredientSearch';
import { IngredientCard } from './IngredientCard';
import { AngleSlider } from './AngleSlider';

interface SlerpPanelProps {
  slerpToCuisine: (seed: string, cuisineKey: string, angleDeg: number, k: number) => PairingResult[];
  searchVocabulary: (query: string, limit: number) => string[];
  zhMap?: Record<string, string>;
  cuisinePoles: CuisinePole[];
  selectedIngredient: string | null;
  onSlerpTopResult?: (ingredient: string | null) => void;
}

export function SlerpPanel({
  slerpToCuisine,
  searchVocabulary,
  zhMap,
  cuisinePoles,
  selectedIngredient,
  onSlerpTopResult,
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

  const interpretation = useMemo(() => {
    if (!seed || !direction || results.length === 0) return null;
    const pole = cuisinePoles.find((p) => p.key === direction);
    const seedNameZh = zhMap?.[seed] ?? '';
    return generateSlerpInterpretation({
      seedName: seed,
      seedNameZh,
      cuisineKey: direction,
      cuisineLabel: pole?.label ?? direction,
      angle,
      topResults: results.slice(0, 3),
    });
  }, [seed, direction, angle, results, cuisinePoles, zhMap]);

  useEffect(() => {
    if (onSlerpTopResult) {
      onSlerpTopResult(results.length > 0 ? results[0].name : null);
    }
  }, [results, onSlerpTopResult]);

  function handleSeedSelect(name: string) {
    setSeed(name);
  }

  function handleResultClick(name: string) {
    // No-op for slerp results — just display
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-headline-md text-on-surface">
        Cuisine Explorer
      </h3>

      <IngredientSearch
        onSelect={handleSeedSelect}
        searchVocabulary={searchVocabulary}
        zhMap={zhMap}
        placeholder={selectedIngredient ? selectedIngredient.replace(/_/g, ' ') : 'Select seed ingredient...'}
      />

      <div className="space-y-2">
        <label className="text-sm text-on-surface-variant font-body block">
          Cuisine Direction
        </label>
        <p className="text-xs text-on-surface-variant/70 font-body -mt-1">
          Select a target cuisine. The system will shift from the seed ingredient toward the typical flavor profile of that cuisine.
        </p>
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
          Blend Angle: {angle}°
          <span className="text-xs text-on-surface-variant/70 ml-2">
            {angle === 0 ? '(Original ingredient)' : angle <= 30 ? '(Slight shift, flavor close to original)' : angle <= 60 ? '(Medium shift, blending target cuisine traits)' : '(Large shift, close to target cuisine flavor)'}
          </span>
        </label>
        <p className="text-xs text-on-surface-variant/70 font-body -mt-1">
          0° = Keep original ingredient flavor, 90° = Fully shift to target cuisine. Larger angles recommend ingredients more characteristic of the target cuisine.
        </p>
        <AngleSlider value={angle} onChange={setAngle} />
      </div>

      {interpretation && (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 space-y-2">
          <h4 className="font-display text-title-md text-on-surface">
            {interpretation.title}
          </h4>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            {interpretation.description}
          </p>
          <p className="font-body text-xs text-on-surface-variant/70 italic">
            {interpretation.tip}
          </p>
        </div>
      )}

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

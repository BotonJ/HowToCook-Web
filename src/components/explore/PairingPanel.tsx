import { useState, useMemo } from 'react';
import type { PairingResult } from '@/lib/epicure/types';
import { IngredientSearch } from './IngredientSearch';
import { IngredientCard } from './IngredientCard';

interface PairingPanelProps {
  getNearestNeighbors: (ingredient: string, k: number) => PairingResult[];
  searchVocabulary: (query: string, limit: number) => string[];
  zhMap?: Record<string, string>;
  onIngredientSelect: (ingredient: string) => void;
  selectedIngredient: string | null;
}

export function PairingPanel({
  getNearestNeighbors,
  searchVocabulary,
  zhMap,
  onIngredientSelect,
  selectedIngredient,
}: PairingPanelProps) {
  const [ingredient, setIngredient] = useState<string | null>(null);

  const pairings = useMemo(() => {
    if (!ingredient) return [];
    return getNearestNeighbors(ingredient, 10);
  }, [ingredient, getNearestNeighbors]);

  function handleSelect(name: string) {
    setIngredient(name);
    onIngredientSelect(name);
  }

  function handleResultClick(name: string) {
    const rawName = name.replace(/ /g, '_');
    onIngredientSelect(rawName);
  }

  const displayName = ingredient ? ingredient.replace(/_/g, ' ') : '';

  return (
    <div className="space-y-4">
      <IngredientSearch
        onSelect={handleSelect}
        searchVocabulary={searchVocabulary}
        zhMap={zhMap}
        placeholder="搜索食材发现风味搭配..."
      />

      {!ingredient && !selectedIngredient && (
        <p className="text-sm text-on-surface-variant text-center py-8 font-body">
          搜索食材以发现风味搭配
        </p>
      )}

      {displayName && (
        <h3 className="font-display text-headline-sm text-on-surface">
          <span className="text-primary">{displayName}</span> 的搭配
        </h3>
      )}

      {pairings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {pairings.map((p) => (
            <IngredientCard
              key={p.name}
              name={p.name}
              nameZh={p.nameZh}
              score={p.score}
              onClick={handleResultClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

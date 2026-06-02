import { useState, useEffect } from 'react';
import type { UseEpicureResult } from '@/lib/epicure';
import type { CooccurrencePair } from '@/lib/epicure/types';

interface CooccurrencePanelProps {
  ingredient: string;
  epicure: UseEpicureResult;
  onSelect: (ingredient: string) => void;
}

export function CooccurrencePanel({ ingredient, epicure, onSelect }: CooccurrencePanelProps) {
  const [pairs, setPairs] = useState<CooccurrencePair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      await epicure.loadCooccurrenceData();
      if (cancelled) return;

      const zhName = epicure.zhMap[ingredient] ?? '';
      const results = epicure.getCooccurrencePairs(ingredient, zhName, 10);
      if (!cancelled) {
        setPairs(results);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ingredient, epicure]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-4">共现搭配</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface-container rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (pairs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-1">共现搭配</h3>
      <p className="text-xs text-on-surface-variant mb-4">
        基于 54,821 道菜谱的统计共现分析
      </p>
      <div className="flex flex-wrap gap-2">
        {pairs.map((p) => {
          const enName = epicure.getEnName(p.ingredient);
          return (
            <button
              key={p.ingredient}
              onClick={() => {
                if (enName) onSelect(enName);
              }}
              className={`group flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm transition ${
                enName
                  ? 'hover:border-primary hover:bg-primary-container cursor-pointer'
                  : 'opacity-50 cursor-default'
              }`}
            >
              <span className={enName ? 'text-on-surface group-hover:text-primary' : 'text-on-surface'}>
                {p.ingredient}
              </span>
              <span className="text-xs text-on-surface-variant/60">
                PMI {p.pmi.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

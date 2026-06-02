import { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkbench } from './WorkbenchContext';
import { Search, X } from 'lucide-react';
import { formatName } from '@/lib/epicure/engine';

interface IngredientSearchBarProps {
  ready: boolean;
  searchVocabulary: (query: string, limit: number) => string[];
  zhMap: Record<string, string>;
}

// 15 core ingredients as quick-access chips
const CORE_INGREDIENTS = [
  'chicken',
  'pork',
  'beef',
  'egg',
  'tofu',
  'tomato',
  'potato',
  'carrot',
  'cabbage',
  'eggplant',
  'bell_pepper',
  'garlic',
  'ginger',
  'onion',
  'shrimp',
];

export function IngredientSearchBar({
  ready,
  searchVocabulary,
  zhMap,
}: IngredientSearchBarProps) {
  const { state, dispatch } = useWorkbench();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      const matches = searchVocabulary(q.trim(), 20);
      setResults(matches);
      setShowDropdown(matches.length > 0);
      setActiveIndex(-1);
    },
    [searchVocabulary]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function formatDisplayName(ingredient: string): string {
    const zh = zhMap[ingredient];
    return zh ?? formatName(ingredient);
  }

  function handleSelect(ingredient: string) {
    dispatch({ type: 'ADD', ingredient });
    setQuery('');
    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  const selectedList = Array.from(state.selected);

  if (!ready) {
    return (
      <div className="space-y-3 opacity-60">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            disabled
            type="text"
            placeholder="搜索食材..."
            className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2 text-sm text-on-surface outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search box */}
      <div ref={containerRef} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索食材（中文或英文）..."
          aria-label="搜索食材"
          className="w-full rounded-full border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {showDropdown && (
          <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg">
            {results.map((ingredient, i) => (
              <li key={ingredient}>
                <button
                  type="button"
                  onClick={() => handleSelect(ingredient)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    i === activeIndex
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {formatDisplayName(ingredient)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick chips — always visible; already-selected items highlighted */}
      <div className="flex flex-wrap gap-2">
        {CORE_INGREDIENTS.map((ing) => {
          const isSelected = state.selected.has(ing);
          return (
            <button
              key={ing}
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE', ingredient: ing })}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition ${
                isSelected
                  ? 'border-primary bg-primary-container text-primary font-medium'
                  : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:bg-primary-container hover:text-primary'
              }`}
            >
              {isSelected && '✓ '}{formatDisplayName(ing)}
            </button>
          );
        })}
      </div>

      {/* Selected tags */}
      {selectedList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedList.map((ing) => (
            <span
              key={ing}
              className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-primary"
            >
              {formatDisplayName(ing)}
              <button
                type="button"
                onClick={() => dispatch({ type: 'REMOVE', ingredient: ing })}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="text-xs text-on-surface-variant underline hover:text-primary"
          >
            清空
          </button>
        </div>
      )}
    </div>
  );
}

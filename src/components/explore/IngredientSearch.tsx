import { useState, useEffect, useRef } from 'react';

interface IngredientSearchProps {
  onSelect: (ingredient: string) => void;
  searchVocabulary: (query: string, limit: number) => string[];
  zhMap?: Record<string, string>;
  placeholder?: string;
}

export function IngredientSearch({
  onSelect,
  searchVocabulary,
  zhMap,
  placeholder = '搜索食材...',
}: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const matches = searchVocabulary(query.trim(), 20);
      setResults(matches);
      setShowDropdown(matches.length > 0);
      setActiveIndex(-1);
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchVocabulary]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function formatName(raw: string): string {
    return raw.replace(/_/g, ' ');
  }

  function formatDisplayName(ingredient: string): string {
    const zh = zhMap?.[ingredient];
    const en = formatName(ingredient);
    if (zh) {
      return `${zh} (${en})`;
    }
    return en;
  }

  function handleSelect(ingredient: string) {
    onSelect(ingredient);
    setQuery(formatDisplayName(ingredient));
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

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
  );
}

import { useState, useRef, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '../hooks/useClickOutside';

interface CuisineTab {
  id: string;
  label: string;
  count?: number;
  hasDropdown?: boolean;
}

// Primary cuisines shown in main nav
const PRIMARY_CUISINES = [
  'all',
  'chinese',
  'american',
  'italian',
  'french',
  'japanese',
];

// Secondary cuisines in dropdown
const SECONDARY_CUISINES = [
  'mexican',
  'middle eastern',
  'british',
  'thai',
  'korean',
  'indian',
  'african',
  'asian',
  'cajun',
  'eastern european',
  'greek',
  'jewish',
  'latin american',
  'mediterranean',
  'pakistani',
  'southeast asian',
  'spanish',
  'german',
];

// Display labels for cuisines
const CUISINE_LABELS: Record<string, string> = {
  all: 'All',
  chinese: 'Chinese',
  american: 'American',
  italian: 'Italian',
  french: 'French',
  japanese: 'Japanese',
  mexican: 'Mexican',
  'middle eastern': 'Middle Eastern',
  british: 'British',
  thai: 'Thai',
  korean: 'Korean',
  indian: 'Indian',
  african: 'African',
  asian: 'Asian',
  cajun: 'Cajun',
  'eastern european': 'Eastern European',
  greek: 'Greek',
  jewish: 'Jewish',
  'latin american': 'Latin American',
  mediterranean: 'Mediterranean',
  pakistani: 'Pakistani',
  'southeast asian': 'Southeast Asian',
  spanish: 'Spanish',
  german: 'German',
};

// Chinese sub-options
const CHINESE_SUB_OPTIONS = [
  { id: 'chinese-original', label: 'Original' },
  { id: 'chinese-western', label: 'Western' },
];

interface CuisineNavProps {
  activeCuisine: string;
  onCuisineChange: (cuisine: string) => void;
  cuisineCounts?: Record<string, number>;
}

export function CuisineNav({ activeCuisine, onCuisineChange, cuisineCounts }: CuisineNavProps) {
  const [showMore, setShowMore] = useState(false);
  const [showChinese, setShowChinese] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const chineseDropdownRef = useRef<HTMLDivElement>(null);

  const primaryCuisines = useMemo<CuisineTab[]>(() => {
    return PRIMARY_CUISINES.map((id) => ({
      id,
      label: CUISINE_LABELS[id] || id,
      count: id === 'chinese'
        ? (cuisineCounts?.['chinese'] || 0) + (cuisineCounts?.['chinese-original'] || 0)
        : cuisineCounts?.[id],
      hasDropdown: id === 'chinese',
    }));
  }, [cuisineCounts]);

  const secondaryCuisines = useMemo<CuisineTab[]>(() => {
    return SECONDARY_CUISINES
      .filter((id) => cuisineCounts?.[id] && cuisineCounts[id] > 0)
      .map((id) => ({
        id,
        label: CUISINE_LABELS[id] || id,
        count: cuisineCounts?.[id],
      }));
  }, [cuisineCounts]);

  useClickOutside([moreDropdownRef], () => setShowMore(false), showMore);
  useClickOutside([chineseDropdownRef], () => setShowChinese(false), showChinese);

  const isActiveInDropdown = SECONDARY_CUISINES.includes(activeCuisine);
  const isChineseSubOption = activeCuisine.startsWith('chinese-');

  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant sticky top-20 z-30">
      <div className="container mx-auto px-4 py-3 flex gap-2 items-center overflow-visible">
        {primaryCuisines.map((cuisine) => {
          const isActive = cuisine.id === activeCuisine || (cuisine.id === 'chinese' && isChineseSubOption);

          if (cuisine.hasDropdown) {
            return (
              <div key={cuisine.id} className="relative" ref={chineseDropdownRef}>
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={showChinese}
                  onClick={() => setShowChinese(!showChinese)}
                  className={cn(
                    'whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1',
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary'
                  )}
                >
                  {cuisine.label}({cuisine.count})
                  <ChevronDown size={14} className={`transition-transform ${showChinese ? 'rotate-180' : ''}`} />
                </button>
                {showChinese && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl py-1 z-40" style={{ position: 'absolute' }}>
                    {CHINESE_SUB_OPTIONS.map((option) => {
                      const count = option.id === 'chinese-original'
                        ? (cuisineCounts?.['chinese-original'] || 0)
                        : (cuisineCounts?.['chinese'] || 0);
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            onCuisineChange(option.id);
                            setShowChinese(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center justify-between',
                            activeCuisine === option.id ? 'text-primary font-medium' : 'text-on-surface'
                          )}
                        >
                          <span>{option.label}</span>
                          <span className="text-xs text-on-surface-variant">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={cuisine.id}
              onClick={() => onCuisineChange(cuisine.id)}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary'
              )}
            >
              {cuisine.label}
              {cuisine.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">({cuisine.count})</span>
              )}
            </button>
          );
        })}

        {/* More dropdown */}
        {secondaryCuisines.length > 0 && (
          <div className="relative" ref={moreDropdownRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={showMore}
              onClick={() => setShowMore(!showMore)}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1',
                isActiveInDropdown
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary'
              )}
            >
              {isActiveInDropdown ? (CUISINE_LABELS[activeCuisine] || activeCuisine) : 'More'}
              <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            {showMore && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl py-1 z-40 max-h-64 overflow-y-auto" style={{ position: 'absolute' }}>
                {secondaryCuisines.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    onClick={() => {
                      onCuisineChange(cuisine.id);
                      setShowMore(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors flex items-center justify-between',
                      activeCuisine === cuisine.id ? 'text-primary font-medium' : 'text-on-surface'
                    )}
                  >
                    <span>{cuisine.label}</span>
                    {cuisine.count !== undefined && (
                      <span className="text-xs text-on-surface-variant">({cuisine.count})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

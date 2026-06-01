import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CuisineTab {
  id: string;
  label: string;
  count?: number;
}

// Top cuisines to show (most popular first)
const TOP_CUISINES = [
  'all',
  'american',
  'italian',
  'french',
  'japanese',
  'chinese',
  'mexican',
  'middle eastern',
  'british',
  'thai',
  'korean',
  'indian',
];

// Display labels for cuisines
const CUISINE_LABELS: Record<string, string> = {
  all: 'All',
  american: 'American',
  italian: 'Italian',
  french: 'French',
  japanese: 'Japanese',
  chinese: 'Chinese',
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
};

interface CuisineNavProps {
  activeCuisine: string;
  onCuisineChange: (cuisine: string) => void;
  cuisineCounts?: Record<string, number>;
}

export function CuisineNav({ activeCuisine, onCuisineChange, cuisineCounts }: CuisineNavProps) {
  const cuisines = useMemo<CuisineTab[]>(() => {
    return TOP_CUISINES.map((id) => ({
      id,
      label: CUISINE_LABELS[id] || id,
      count: cuisineCounts?.[id],
    }));
  }, [cuisineCounts]);

  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant sticky top-20 z-30">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-2">
        {cuisines.map((cuisine) => {
          const isActive = cuisine.id === activeCuisine;

          return (
            <button
              key={cuisine.id}
              onClick={() => onCuisineChange(cuisine.id)}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface text-on-surface-variant border border-outline-variant rounded-lg hover:border-primary hover:text-primary'
              )}
            >
              {cuisine.label}
              {cuisine.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">({cuisine.count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

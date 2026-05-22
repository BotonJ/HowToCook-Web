import React from 'react';
import { cn } from '@/lib/utils';

interface SourceTab {
  id: string;
  label: string;
  disabled?: boolean;
}

const sources: SourceTab[] = [
  { id: 'howtocook', label: 'HowToCook' },
  { id: '随便做', label: '随便做' },
];

interface SourceNavProps {
  activeSource: string;
  onSourceChange: (source: string) => void;
}

export const SourceNav: React.FC<SourceNavProps> = ({ activeSource, onSourceChange }) => {
  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant sticky top-20 z-30">
      <div className="container mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-2">
        {sources.map((source) => {
          const isActive = source.id === activeSource;
          const isDisabled = source.disabled;

          return (
            <button
              key={source.id}
              onClick={() => !isDisabled && onSourceChange(source.id)}
              disabled={isDisabled}
              className={cn(
                'whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive && !isDisabled
                  ? 'bg-primary text-on-primary shadow-sm'
                  : isDisabled
                    ? 'bg-surface text-on-surface-variant border border-outline-variant rounded-lg opacity-50 cursor-not-allowed'
                    : 'bg-surface text-on-surface-variant border border-outline-variant rounded-lg hover:border-primary hover:text-primary'
              )}
            >
              {source.label}
              {isDisabled && (
                <span className="ml-1.5 text-xs opacity-70">coming soon</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

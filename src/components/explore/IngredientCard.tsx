interface IngredientCardProps {
  name: string;
  nameZh: string;
  score: number;
  onClick: (name: string) => void;
}

export function IngredientCard({ name, nameZh, score, onClick }: IngredientCardProps) {
  const pct = Math.max(0, Math.min(100, score * 100));
  const displayName = name.replace(/_/g, ' ');

  return (
    <button
      type="button"
      onClick={() => onClick(name)}
      className="bg-surface-container-low rounded-xl p-3 border border-outline-variant text-left transition hover:border-primary hover:shadow-sm w-full"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-body text-label-lg text-on-surface truncate">
          {nameZh || displayName}
        </span>
        {nameZh && (
          <span className="font-body text-xs text-on-surface-variant shrink-0">
            {displayName}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-on-surface-variant mt-1 block">
        {pct.toFixed(1)}%
      </span>
    </button>
  );
}

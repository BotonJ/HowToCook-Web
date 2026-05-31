import type { ModeResult } from '@/lib/epicure/types';

interface ModePanelProps {
  modes: ModeResult[];
  loading: boolean;
  targetName?: string | null;
  isSlerpResult?: boolean;
}

function formatName(raw: string): string {
  return raw.replace(/_/g, ' ');
}

export function ModePanel({ modes, loading, targetName, isSlerpResult }: ModePanelProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-display text-headline-md text-on-surface">风味特征</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface-container rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="font-display text-headline-md text-on-surface">风味特征</h3>
        <p className="text-sm text-on-surface-variant font-body">
          选择食材查看其风味特征
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-headline-md text-on-surface">风味特征</h3>
        {targetName && (
          <p className="text-xs text-on-surface-variant/70 font-body mt-0.5">
            {isSlerpResult ? '🔄 探索结果：' : ''}{formatName(targetName)} 的风味归属
          </p>
        )}
      </div>
      {modes.map((mode) => {
        const pct = Math.max(0, Math.min(100, mode.score * 100));
        return (
          <div
            key={mode.modeId}
            className="bg-surface-container-low rounded-xl p-4 border border-outline-variant"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-body text-label-lg text-on-surface">{mode.label}</span>
              <span className="text-xs text-on-surface-variant font-body">
                {mode.property} ({mode.kind})
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant mb-2 block">{pct.toFixed(1)}%</span>
            <div className="flex flex-wrap gap-1">
              {mode.members.map((m) => (
                <span
                  key={m}
                  className="inline-block text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full"
                >
                  {formatName(m)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

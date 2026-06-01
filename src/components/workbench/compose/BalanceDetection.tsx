import { useMemo } from 'react';
import { getFlavorProfile } from '@/lib/flavor-profiles';
import { FLAVOR_DIMS, FLAVOR_LABELS_ZH } from '@/lib/flavor-dims';

interface BalanceDetectionProps {
  ingredients: string[];
}

export function BalanceDetection({ ingredients }: BalanceDetectionProps) {
  const alerts = useMemo(() => {
    const profiles = ingredients
      .map((id) => getFlavorProfile(id))
      .filter((p): p is NonNullable<typeof p> => p !== null && p.tier <= 3);

    if (profiles.length === 0) return [];

    const values: Record<string, number[]> = {};
    for (const dim of FLAVOR_DIMS) {
      values[dim] = profiles.map((p) => p[dim] as number);
    }

    const mean: Record<string, number> = {};
    const std: Record<string, number> = {};
    for (const dim of FLAVOR_DIMS) {
      const arr = values[dim];
      const m = arr.reduce((s, v) => s + v, 0) / arr.length;
      mean[dim] = m;
      const variance = arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
      std[dim] = Math.sqrt(variance);
    }

    const result: Array<{ dim: string; label: string; type: 'high' | 'low'; value: number; mean: number; suggestion: string }> = [];

    for (const dim of FLAVOR_DIMS) {
      const diff = Math.abs(mean[dim] - 5);
      if (diff > 2 && std[dim] < 1.5) {
        const type = mean[dim] > 5 ? 'high' : 'low';
        const suggestion = type === 'high'
          ? `建议减少${FLAVOR_LABELS_ZH[dim]}味食材，或增加对立维度平衡`
          : `建议补充${FLAVOR_LABELS_ZH[dim]}味突出的食材`;
        result.push({ dim, label: FLAVOR_LABELS_ZH[dim], type, value: mean[dim], mean: mean[dim], suggestion });
      }
    }

    return result;
  }, [ingredients]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h3 className="font-display text-headline-sm text-on-surface mb-3">平衡检测</h3>
        <p className="text-sm text-on-surface-variant">风味分布均衡，无明显偏颇 ✓</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">平衡检测</h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.dim}
            className={`flex items-start gap-3 rounded-lg p-3 ${
              alert.type === 'high' ? 'bg-error-container/30' : 'bg-secondary-container/30'
            }`}
          >
            <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              alert.type === 'high' ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'
            }`}>
              {alert.type === 'high' ? '!' : '↓'}
            </span>
            <div>
              <p className="text-sm font-medium text-on-surface">
                {alert.label}味{alert.type === 'high' ? '过高' : '偏低'}（{alert.value.toFixed(1)}）
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">{alert.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

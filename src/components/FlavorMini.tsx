import type { FlavorVector } from '@/lib/epicure/types';
import { useT } from '@/lib/i18n';
import { FLAVOR_DIM_CONFIG } from '@/lib/flavor-dims';

type FlavorProfile = FlavorVector;

interface FlavorMiniProps {
  profile: FlavorProfile;
}

export function FlavorMini({ profile }: FlavorMiniProps) {
  const t = useT();
  return (
    <div className="flex items-center gap-1" style={{ maxWidth: 120 }}>
      {FLAVOR_DIM_CONFIG.map((dim) => {
        const value = Math.min(10, Math.max(0, profile[dim.key]));
        const ratio = value / 10;
        return (
          <div
            key={dim.key}
            className="flex flex-col items-center gap-0.5"
            title={`${t.flavor[dim.key]}: ${value}`}
          >
            <div
              className="rounded-full"
              style={{
                width: 6,
                height: 24 * ratio + 4, // min 4px, max 28px
                backgroundColor: dim.color,
                opacity: 0.3 + ratio * 0.7,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

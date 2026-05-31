interface FlavorProfile {
  sweet: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fatty: number;
}

interface FlavorMiniProps {
  profile: FlavorProfile;
}

const DIMENSIONS = [
  { key: 'sweet' as const, label: '甜', color: '#ff6b9d' },
  { key: 'sour' as const, label: '酸', color: '#ffd166' },
  { key: 'bitter' as const, label: '苦', color: '#06d6a0' },
  { key: 'umami' as const, label: '鲜', color: '#4ecdc4' },
  { key: 'spicy' as const, label: '辣', color: '#ef476f' },
  { key: 'fatty' as const, label: '脂', color: '#e0aaff' },
] as const;

export function FlavorMini({ profile }: FlavorMiniProps) {
  return (
    <div className="flex items-center gap-1" style={{ maxWidth: 120 }}>
      {DIMENSIONS.map((dim) => {
        const value = Math.min(10, Math.max(0, profile[dim.key]));
        const ratio = value / 10;
        return (
          <div
            key={dim.key}
            className="flex flex-col items-center gap-0.5"
            title={`${dim.label}: ${value}`}
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

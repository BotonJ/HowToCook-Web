import { useState } from 'react';

interface FlavorProfile {
  sweet: number;
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fatty: number;
}

interface FlavorRadarProps {
  profile: FlavorProfile;
  size?: number;
  interactive?: boolean;
}

const DIMENSIONS = [
  { key: 'sweet' as const, label: '甜' },
  { key: 'sour' as const, label: '酸' },
  { key: 'bitter' as const, label: '苦' },
  { key: 'umami' as const, label: '鲜' },
  { key: 'spicy' as const, label: '辣' },
  { key: 'fatty' as const, label: '脂' },
] as const;

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function hexagonPoints(cx: number, cy: number, r: number) {
  return DIMENSIONS.map((_, i) => {
    const angle = (360 / 6) * i;
    return polarToCartesian(cx, cy, r, angle);
  });
}

export function FlavorRadar({ profile, size = 240, interactive = false }: FlavorRadarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 32; // padding for labels

  const dataPoints = DIMENSIONS.map((dim, i) => {
    const value = Math.min(10, Math.max(0, profile[dim.key]));
    const ratio = value / 10;
    const angle = (360 / 6) * i;
    return polarToCartesian(cx, cy, maxRadius * ratio, angle);
  });

  const vertexPoints = hexagonPoints(cx, cy, maxRadius);

  return (
    <div className="flex justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="select-none"
      >
        {/* Grid hexagons */}
        {GRID_LEVELS.map((level) => {
          const pts = hexagonPoints(cx, cy, maxRadius * level);
          return (
            <polygon
              key={level}
              points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#2a2a3a"
              strokeWidth={level === 1 ? 1.2 : 0.6}
              opacity={level === 1 ? 0.8 : 0.4}
            />
          );
        })}

        {/* Axis lines */}
        {vertexPoints.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#2a2a3a"
            strokeWidth={0.6}
            opacity={0.4}
          />
        ))}

        {/* Data polygon fill */}
        <polygon
          points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="rgba(78, 205, 196, 0.15)"
          stroke="#4ecdc4"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data vertices (dots) */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={interactive ? 5 : 4}
            fill={hoveredIndex === i ? '#4ecdc4' : '#1a1a2e'}
            stroke="#4ecdc4"
            strokeWidth={2}
            className={interactive ? 'cursor-pointer' : ''}
            onMouseEnter={() => interactive && setHoveredIndex(i)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          />
        ))}

        {/* Labels */}
        {DIMENSIONS.map((dim, i) => {
          const angle = (360 / 6) * i;
          const labelPos = polarToCartesian(cx, cy, maxRadius + 20, angle);
          const value = profile[dim.key];
          const isHovered = hoveredIndex === i;

          return (
            <g key={dim.key}>
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isHovered ? '#4ecdc4' : '#888'}
                fontSize={13}
                fontWeight={isHovered ? 600 : 400}
                className="font-body pointer-events-none"
              >
                {dim.label}
              </text>
              {interactive && isHovered && (
                <text
                  x={labelPos.x}
                  y={labelPos.y + 15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#4ecdc4"
                  fontSize={12}
                  fontWeight={600}
                  className="font-body pointer-events-none"
                >
                  {value}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover hit areas (larger invisible circles for easier interaction) */}
        {interactive &&
          dataPoints.map((p, i) => (
            <circle
              key={`hit-${i}`}
              cx={p.x}
              cy={p.y}
              r={18}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
      </svg>
    </div>
  );
}

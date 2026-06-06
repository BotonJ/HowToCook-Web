import { motion } from 'framer-motion';

export interface RadarDataset {
  label: string;
  data: Record<string, number>; // dimension -> 0-1
  color: string;
  dashed?: boolean;
}

interface RadarChartProps {
  datasets: RadarDataset[];
  size?: number;
}

const DIMENSIONS = ['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fat'];
const DIMENSION_LABELS: Record<string, string> = {
  sour: '酸', sweet: '甜', bitter: '苦', spicy: '辣', umami: '鲜', fat: '脂肪',
};

function polarToCartesian(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function RadarChart({ datasets, size = 280 }: RadarChartProps) {
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.38;
  const rings = [0.33, 0.66, 1.0];
  const angleStep = 360 / DIMENSIONS.length;

  const toPoints = (d: Record<string, number>) =>
    DIMENSIONS.map((dim, i) => {
      const r = (d[dim] ?? 0) * maxR;
      return polarToCartesian(i * angleStep, r, cx, cy);
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map((r, i) => (
        <polygon
          key={i}
          points={DIMENSIONS.map((_, j) => {
            const p = polarToCartesian(j * angleStep, r * maxR, cx, cy);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#e0c0b5"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {DIMENSIONS.map((_, i) => {
        const p = polarToCartesian(i * angleStep, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e0c0b5" strokeWidth={0.5} />;
      })}

      {/* Labels */}
      {DIMENSIONS.map((dim, i) => {
        const p = polarToCartesian(i * angleStep, maxR + 18, cx, cy);
        return (
          <text
            key={dim}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fontWeight={600}
            fill="#58413a"
          >
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}

      {/* Datasets — render dashed first so it sits behind */}
      {datasets.map((ds, di) => {
        const points = toPoints(ds.data);
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        const isDashed = ds.dashed;

        return (
          <g key={ds.label}>
            <motion.path
              d={pathD}
              fill={ds.color}
              fillOpacity={isDashed ? 0.05 : 0.15}
              stroke={ds.color}
              strokeWidth={isDashed ? 2 : 2.5}
              strokeDasharray={isDashed ? '5 4' : undefined}
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: di * 0.1, ease: 'easeOut' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
            {/* Vertices */}
            {!isDashed && points.map((p, pi) => (
              <motion.circle
                key={pi}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#fff8f5"
                stroke={ds.color}
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: di * 0.1 + pi * 0.05, duration: 0.3 }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

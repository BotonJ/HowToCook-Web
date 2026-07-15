import { useEffect, useRef, useState } from 'react';
import { CATEGORY_COLORS } from '@/components/flavor-workbench/theme';

interface Point {
  name: string;
  x: number;
  y: number;
  category: string;
}

interface TsneData {
  points: Point[];
  labels: string[];
}

const LABEL_SET = new Set<string>();

const CATEGORY_LABELS: Record<string, string> = {
  meat: '肉类',
  vegetable: '蔬菜',
  spice: '调味',
  dairy: '乳品',
  grain: '主食',
  seafood: '水产',
  fruit: '水果',
  fermented: '发酵',
  other: '其他',
};

// Simple seeded random for reproducible dot sizes
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function FlavorUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<TsneData | null>(null);

  useEffect(() => {
    fetch('/data/flavor/tsne-coords.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    data.labels.forEach(l => LABEL_SET.add(l));

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD = 60;

    const xs = data.points.map(p => p.x);
    const ys = data.points.map(p => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const toCanvasX = (x: number) => PAD + ((x - xMin) / xRange) * (W - 2 * PAD);
    const toCanvasY = (y: number) => PAD + ((y - yMin) / yRange) * (H - 2 * PAD);

    ctx.clearRect(0, 0, W, H);

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(195, 200, 191, 0.3)';
    ctx.lineWidth = 0.5;
    const gridSteps = 8;
    for (let i = 1; i < gridSteps; i++) {
      const x = PAD + (i / gridSteps) * (W - 2 * PAD);
      const y = PAD + (i / gridSteps) * (H - 2 * PAD);
      ctx.beginPath();
      ctx.moveTo(x, PAD);
      ctx.lineTo(x, H - PAD);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(W - PAD, y);
      ctx.stroke();
    }

    // Pre-generate dot sizes and opacities (reproducible via seed)
    const rng = seededRandom(42);

    // Draw points with varying size and opacity
    for (const p of data.points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const color = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;

      // Vary size: labels get bigger dots, others vary 1.5-4px
      const isLabel = LABEL_SET.has(p.name);
      const baseSize = isLabel ? 5 : 1.5 + rng() * 2.5;
      const opacity = isLabel ? 0.9 : 0.25 + rng() * 0.55;

      ctx.fillStyle = color + Math.round(opacity * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(cx, cy, baseSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw labels with text shadow for readability
    ctx.font = '700 18px "Noto Serif SC", "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Track placed labels to avoid overlap
    const placed: { x: number; y: number; w: number }[] = [];
    const LABEL_PAD = 8;

    for (const p of data.points) {
      if (!LABEL_SET.has(p.name)) continue;
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const color = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;

      // Measure text width
      const metrics = ctx.measureText(p.name);
      const tw = metrics.width;

      // Try multiple offset positions to avoid overlap
      const offsets = [
        { dx: 0, dy: -22 },   // above
        { dx: 0, dy: 22 },    // below
        { dx: tw / 2 + 12, dy: 0 },  // right
        { dx: -(tw / 2 + 12), dy: 0 }, // left
        { dx: tw / 2 + 8, dy: -16 },   // upper-right
        { dx: -(tw / 2 + 8), dy: -16 }, // upper-left
        { dx: tw / 2 + 8, dy: 16 },    // lower-right
        { dx: -(tw / 2 + 8), dy: 16 },  // lower-left
        { dx: 0, dy: -36 },   // far above
        { dx: 0, dy: 36 },    // far below
      ];

      let bestX = cx;
      let bestY = cy - 22;
      let bestScore = Infinity;

      for (const off of offsets) {
        const nx = cx + off.dx;
        const ny = cy + off.dy;
        // Check boundary
        if (nx - tw / 2 < PAD || nx + tw / 2 > W - PAD || ny < PAD || ny > H - PAD) continue;
        // Check overlap with existing labels
        let minDist = Infinity;
        for (const p2 of placed) {
          const dist = Math.max(0, Math.abs(nx - p2.x) - (tw / 2 + p2.w / 2 + LABEL_PAD),
                                Math.abs(ny - p2.y) - 12);
          minDist = Math.min(minDist, dist);
        }
        // Prefer closer to original position, but penalize overlap
        const distFromOrigin = Math.abs(off.dx) + Math.abs(off.dy);
        const score = minDist < 0 ? 10000 : distFromOrigin - minDist * 2;
        if (score < bestScore) {
          bestScore = score;
          bestX = nx;
          bestY = ny;
        }
      }

      placed.push({ x: bestX, y: bestY, w: tw });

      // Multi-layer shadow for readability
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (dx === 0 && dy === 0) continue;
          ctx.fillText(p.name, bestX + dx, bestY + dy);
        }
      }

      // Main text
      ctx.fillStyle = color;
      ctx.fillText(p.name, bestX, bestY);
    }
  }, [data]);

  if (!data) {
    return <div className="text-center py-20 text-on-surface-variant">加载中...</div>;
  }

  const categories = Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'other');

  return (
    <section className="py-24 bg-surface-container-low overflow-hidden relative">
      <div className="max-w-6xl mx-auto px-4 md:px-16">
        {/* Header */}
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <h2 className="font-display text-headline-lg">多维风味映射</h2>
            <p className="text-body-md text-on-surface-variant">基于 t-SNE 算法的食材亲缘性分布</p>
          </div>
          {/* Legend - 3 rows × 3 columns */}
          <div className="hidden md:grid grid-cols-3 gap-x-6 gap-y-2">
            {categories.map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-label-sm text-on-surface-variant">{CATEGORY_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scatter plot container */}
        <div className="relative bg-white rounded-[40px] shadow-[0_20px_50px_rgba(74,93,74,0.08)] overflow-hidden group" style={{ height: '800px' }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Glass card explanation */}
          <div className="absolute top-12 right-12 glass-card p-6 rounded-2xl max-w-[240px] border border-primary/10">
            <p className="text-label-sm font-bold text-primary mb-2">坐标逻辑说明</p>
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              水平轴代表基础味觉倾向（甜/咸），垂直轴代表香气复杂度。越靠近的点代表在 300 维度的余弦相似度越高。
            </p>
          </div>

          {/* Bottom axis labels */}
          <div className="absolute bottom-8 left-12 right-12 flex justify-between text-label-sm text-outline font-medium tracking-widest">
            <span className="flex items-center gap-2">← 甜 / 碳水为主</span>
            <span>咸 / 鲜味为主 →</span>
          </div>
        </div>

        {/* Mobile legend */}
        <div className="md:hidden grid grid-cols-3 gap-x-4 gap-y-2 mt-4 justify-items-center">
          {categories.map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-on-surface-variant">{CATEGORY_LABELS[key] || key}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
    const PAD = 40;

    const xs = data.points.map(p => p.x);
    const ys = data.points.map(p => p.y);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const toCanvasX = (x: number) => PAD + ((x - xMin) / xRange) * (W - 2 * PAD);
    const toCanvasY = (y: number) => PAD + ((y - yMin) / yRange) * (H - 2 * PAD);

    ctx.clearRect(0, 0, W, H);

    // Draw points
    for (const p of data.points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const color = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;
      ctx.fillStyle = color + '80';
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw labels
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of data.points) {
      if (LABEL_SET.has(p.name)) {
        const cx = toCanvasX(p.x);
        const cy = toCanvasY(p.y);
        const color = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;
        ctx.fillStyle = color;
        ctx.fillText(p.name, cx, cy - 8);
      }
    }
  }, [data]);

  if (!data) {
    return <div className="text-center py-20 text-on-surface-variant">加载中...</div>;
  }

  const categories = Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'other');

  return (
    <section className="mb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-display text-headline-lg text-on-surface mb-2">
          风味宇宙
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mb-6 leading-relaxed">
          4,389 个中餐食材，每个是一个 300 维的"风味指纹"。
          <br />
          投影到平面上，中餐的味觉地图浮现——右侧是咸鲜的肉与香料，左侧是碳水与甜品。
          <br />
          每一个点都来自 97 万份菜谱的统计学习。
        </p>

        {/* Scatter plot */}
        <div className="bg-surface-container-low rounded-2xl shadow-ambient overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '480px' }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {categories.map(([key, color]) => (
            <span key={key} className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
              {key}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';

interface Node {
  name: string;
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
  count: number;
  npmi: number;
}

interface NetworkData {
  nodes: Node[];
  edges: Edge[];
}

const NODE_COLORS: Record<string, string> = {
  姜: '#b5651d',
  葱: '#3a7d44',
  蒜: '#856a14',
  盐: '#5f6b6e',
  酱油: '#6b4e8c',
  生抽: '#6b4e8c',
  糖: '#b03b5e',
  料酒: '#2f7a8c',
  味精: '#7d7530',
};

export function CoreFlavorNetwork() {
  const [data, setData] = useState<NetworkData | null>(null);

  useEffect(() => {
    fetch('/data/flavor/core-flavor-network.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-on-surface-variant">加载中...</div>;
  }

  const W = 480;
  const H = 400;
  const PAD = 60;

  // Normalize coords to canvas
  const xs = data.nodes.map(n => n.x);
  const ys = data.nodes.map(n => n.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const toX = (x: number) => PAD + ((x - xMin) / xRange) * (W - 2 * PAD);
  const toY = (y: number) => PAD + ((y - yMin) / yRange) * (H - 2 * PAD);

  const nodeMap = Object.fromEntries(data.nodes.map(n => [n.name, n]));

  // Find max count for line width scaling
  const maxCount = Math.max(...data.edges.map(e => e.count));

  return (
    <section className="mb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-display text-headline-lg text-on-surface mb-2">
          姜葱蒜铁三角
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mb-6 leading-relaxed">
          中餐的"底层操作系统"。
          <br />
          姜和盐共同出现 121,867 次——比任何食材对都多。
          <br />
          但论羁绊强度，姜和葱（0.43）、姜和料酒（0.43）才是铁三角。
        </p>

        <div className="bg-surface-container-low rounded-2xl shadow-ambient p-6 flex justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg" style={{ height: '400px' }}>
            {/* Edges */}
            {data.edges.map((e, i) => {
              const s = nodeMap[e.source];
              const t = nodeMap[e.target];
              if (!s || !t) return null;
              const width = 1 + (e.count / maxCount) * 6;
              const opacity = 0.3 + (e.npmi / 0.5) * 0.5;
              return (
                <line
                  key={i}
                  x1={toX(s.x)} y1={toY(s.y)}
                  x2={toX(t.x)} y2={toY(t.y)}
                  stroke="#737971"
                  strokeWidth={width}
                  strokeOpacity={Math.min(opacity, 0.8)}
                />
              );
            })}

            {/* Nodes */}
            {data.nodes.map((n, i) => {
              const cx = toX(n.x);
              const cy = toY(n.y);
              const color = NODE_COLORS[n.name] || '#5f6b6e';
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={18} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                    fontSize={13} fontWeight={600} fill={color}>
                    {n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Key stat */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="font-display text-headline-md text-primary">121,867</div>
            <div className="text-body-sm text-on-surface-variant">姜↔盐 共现次数</div>
          </div>
          <div className="text-center">
            <div className="font-display text-headline-md text-primary">0.43</div>
            <div className="text-body-sm text-on-surface-variant">姜↔葱 NPMI</div>
          </div>
          <div className="text-center">
            <div className="font-display text-headline-md text-primary">0.43</div>
            <div className="text-body-sm text-on-surface-variant">姜↔料酒 NPMI</div>
          </div>
        </div>
      </div>
    </section>
  );
}

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

  // Only keep top 3 nodes for the triangle (姜/蒜/葱)
  const triangleNames = ['姜', '蒜', '葱'];

  // Triangle layout: fixed positions for clean triangle
  const trianglePositions: Record<string, { x: number; y: number }> = {
    '姜': { x: 200, y: 80 },
    '蒜': { x: 320, y: 280 },
    '葱': { x: 80, y: 280 },
  };

  // Edges between triangle nodes only
  const triangleEdges = data.edges.filter(
    e => triangleNames.includes(e.source) && triangleNames.includes(e.target)
  );

  const maxCount = Math.max(...data.edges.map(e => e.count));

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
        {/* Left: text content */}
        <div className="space-y-8">
          <h2 className="font-display text-headline-xl text-primary leading-tight">
            中式烹饪的<br />黄金三角网格
          </h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            在中式厨艺的长河中，姜、蒜、葱构成了风味的底层逻辑。通过对 180 万道中餐菜谱的 NPMI（归一化逐点互信息）分析，我们发现这三者之间的共现频率远超随机分布。
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-label-sm">01</span>
              <div>
                <h4 className="font-bold text-on-surface text-body-md">强耦合关联</h4>
                <p className="text-label-sm text-on-surface-variant">姜与葱在爆锅环节的共现率高达 89%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary font-bold text-label-sm">02</span>
              <div>
                <h4 className="font-bold text-on-surface text-body-md">风味去腥逻辑</h4>
                <p className="text-label-sm text-on-surface-variant">大蒜在肉类处理中的中和作用具有极高的统计学意义</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: SVG network */}
        <div className="relative bg-white rounded-[40px] p-8 aspect-square flex items-center justify-center overflow-hidden shadow-xl">
          <svg viewBox="0 0 400 400" className="w-full h-full max-w-[400px]">
            {/* Edges */}
            {triangleEdges.map((e, i) => {
              const s = trianglePositions[e.source];
              const t = trianglePositions[e.target];
              if (!s || !t) return null;
              const width = 2 + (e.count / maxCount) * 6;
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y}
                  x2={t.x} y2={t.y}
                  stroke="#4c644e"
                  strokeWidth={width}
                  opacity={0.8}
                  className="network-line"
                />
              );
            })}

            {/* Nodes */}
            {triangleNames.map((name) => {
              const pos = trianglePositions[name];
              if (!pos) return null;
              return (
                <g key={name}>
                  <circle cx={pos.x} cy={pos.y} r={name === '蒜' ? 40 : name === '姜' ? 35 : 30}
                    fill="#f8faf3" stroke="#4c644e" strokeWidth={2} />
                  <text className="font-display" x={pos.x} y={pos.y + 5}
                    textAnchor="middle" fill="#4c644e" fontSize={16} fontWeight={600}>
                    {name}
                  </text>
                </g>
              );
            })}

            {/* Supplementary small dots */}
            <circle cx="250" cy="180" fill="#dfec60" opacity="0.6" r="8" />
            <circle cx="150" cy="180" fill="#dfec60" opacity="0.4" r="10" />
            <circle cx="200" cy="300" fill="#dfec60" opacity="0.7" r="6" />
          </svg>
        </div>
      </div>
    </section>
  );
}

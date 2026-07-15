import { useEffect, useState } from 'react';

interface CaseData {
  tomato: { name: string; neighbors: string[] };
  egg: { name: string; neighbors: string[] };
  cosine: number;
  cooccurrence: number;
}

export function TomatoEggCase() {
  const [data, setData] = useState<CaseData | null>(null);

  useEffect(() => {
    fetch('/data/flavor/tomato-egg-case.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-on-surface-variant">加载中...</div>;
  }

  return (
    <section className="mb-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="font-display text-headline-lg text-on-surface mb-2">
          番茄 → 鸡蛋
        </h2>
        <p className="font-body text-body-md text-on-surface-variant mb-6 leading-relaxed">
          番茄炒蛋，中国人的国民菜。
          <br />
          但在风味空间里，番茄住在"蔬菜社区"，鸡蛋住在"烘焙社区"，相似度只有 {data.cosine}。
          <br />
          可它们在 {data.cooccurrence.toLocaleString()} 份菜谱里同时出现。
          <br />
          有些经典搭配，不是"相似"，而是"互补"。
        </p>

        <div className="bg-surface-container-low rounded-2xl shadow-ambient p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Tomato cluster */}
            <div className="text-center">
              <div className="text-4xl mb-3">🍅</div>
              <h3 className="font-display text-headline-md text-on-surface mb-3">蔬菜社区</h3>
              <div className="space-y-1.5">
                {data.tomato.neighbors.map((n, i) => (
                  <span key={i} className="inline-block bg-vegetable/10 text-vegetable text-body-sm px-3 py-1 rounded-full mr-1.5 mb-1.5">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Arrow + stats */}
            <div className="flex flex-col items-center gap-4">
              <svg width="80" height="40" viewBox="0 0 80 40">
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#737971" />
                  </marker>
                </defs>
                <line x1="0" y1="20" x2="70" y2="20" stroke="#737971" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4 3" />
              </svg>
              <div className="text-center">
                <div className="font-display text-headline-md text-primary">
                  {data.cooccurrence.toLocaleString()}
                </div>
                <div className="text-body-sm text-on-surface-variant">份菜谱同时出现</div>
              </div>
              <div className="text-center">
                <div className="font-display text-headline-sm text-tertiary">
                  cosine {data.cosine}
                </div>
                <div className="text-body-sm text-on-surface-variant">风味相似度</div>
              </div>
            </div>

            {/* Egg cluster */}
            <div className="text-center">
              <div className="text-4xl mb-3">🥚</div>
              <h3 className="font-display text-headline-md text-on-surface mb-3">烘焙社区</h3>
              <div className="space-y-1.5">
                {data.egg.neighbors.map((n, i) => (
                  <span key={i} className="inline-block bg-grain/10 text-grain text-body-sm px-3 py-1 rounded-full mr-1.5 mb-1.5">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

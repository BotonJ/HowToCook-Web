import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import {
  getIngredients,
  getCooccurrencePairs,
  getSurprisePairs,
  CATEGORY_COLORS,
  type Ingredient,
} from '../data/ingredients';
import { getActiveIngredients } from '../data/ingredients-active';
import { RadarChart } from '../ui/RadarChart';
import type { RadarDataset } from '../ui/RadarChart';

const MAX_SELECT = 6;

const DIM_LABELS: Record<string, string> = {
  sour: '酸', sweet: '甜', bitter: '苦', spicy: '辣', umami: '鲜', fatty: '脂肪',
};

const DIM_ORDER = ['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fatty'];

/** Get flavor value, mapping 'fatty' → 'fat' for real data compatibility */
const getFlavor = (ing: Ingredient, dim: string): number => {
  if (dim === 'fatty') {
    const v = ing.flavor.fatty;
    if (v !== undefined) return v;
    return (ing.flavor as Record<string, number>)['fat'] ?? 0;
  }
  return ing.flavor[dim] ?? 0;
};

export function TabPairing() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleIngredient = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_SELECT ? [...prev, id] : prev
    );
  };

  const selectedIngredients = useMemo(
    () => selectedIds.map(id => getIngredients().find(i => i.id === id)!).filter(Boolean),
    [selectedIds]
  );

  // Only show ingredients that have at least 1 cooccurrence pair (sync with TabFlavorOverview)
  const activeIngredients = useMemo(() => getActiveIngredients(), [getIngredients().length]);

  const [search, setSearch] = useState('');
  const filteredIngredients = useMemo(() => {
    if (!search) return activeIngredients;
    const q = search.trim();
    if (!q) return activeIngredients;
    const exact = activeIngredients.filter(i => i.name === q);
    if (exact.length > 0) return exact;
    const prefix = activeIngredients.filter(i => i.name.startsWith(q));
    if (prefix.length > 0) return prefix;
    return activeIngredients.filter(
      i => i.name.includes(q) || i.nameEn.toLowerCase().includes(q.toLowerCase()),
    );
  }, [search, activeIngredients]);

  // ── Synthesis flavor (average) ──
  const synthesisFlavor = useMemo(() => {
    if (selectedIngredients.length === 0) return null;
    const avg: Record<string, number> = {};
    for (const dim of DIM_ORDER) {
      const sum = selectedIngredients.reduce((s, ing) => s + getFlavor(ing, dim), 0);
      avg[dim] = sum / selectedIngredients.length;
    }
    return avg as Ingredient['flavor'];
  }, [selectedIngredients]);

  // ── Radar datasets: synthesis only + tension ring ──
  const radarDatasets: RadarDataset[] = useMemo(() => {
    if (!synthesisFlavor) return [];
    const sets: RadarDataset[] = [];

    // Tension ring (dashed boundary at 0.8)
    const tensionRing: Record<string, number> = {};
    for (const dim of DIM_ORDER) tensionRing[dim] = 0.8;
    sets.push({
      label: '张力环',
      data: tensionRing,
      color: '#8c7168',
      dashed: true,
    });

    // Synthesis profile (solid)
    sets.push({
      label: '合成风味',
      data: synthesisFlavor,
      color: '#ae3a04',
    });

    return sets;
  }, [synthesisFlavor]);

  // ── Tension index ──
  const tensionIndex = useMemo(() => {
    if (selectedIngredients.length < 2) return null;
    const values: Record<string, number[]> = {};
    for (const dim of DIM_ORDER) {
      values[dim] = selectedIngredients.map(ing => getFlavor(ing, dim));
    }
    const mean: Record<string, number> = {};
    const std: Record<string, number> = {};
    for (const dim of DIM_ORDER) {
      const arr = values[dim];
      const m = arr.reduce((s, v) => s + v, 0) / arr.length;
      mean[dim] = m;
      const variance = arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
      std[dim] = Math.sqrt(variance);
    }
    const avgStd = DIM_ORDER.reduce((s, dim) => s + std[dim], 0) / DIM_ORDER.length;
    return Math.min(avgStd * 3, 1);
  }, [selectedIngredients]);

  // ── Dimension changes (增幅分析) ──
  const dimChanges = useMemo(() => {
    if (selectedIngredients.length < 2) return [];
    const avg: Record<string, number> = {};
    for (const dim of DIM_ORDER) {
      const sum = selectedIngredients.reduce((s, ing) => s + getFlavor(ing, dim), 0);
      avg[dim] = sum / selectedIngredients.length;
    }
    return DIM_ORDER.map(dim => {
      const baseVal = getFlavor(selectedIngredients[0], dim);
      const change = avg[dim] - baseVal;
      const pct = baseVal > 0 ? (change / baseVal) * 100 : 0;
      return { dim, label: DIM_LABELS[dim], avg: avg[dim], change, pct };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [selectedIngredients]);

  // ── Analysis text (风味评价 + 平衡检测 + 补充建议 as paragraphs) ──
  const analysisParagraphs = useMemo(() => {
    const paragraphs: string[] = [];

    if (selectedIngredients.length === 0) {
      paragraphs.push('请从上方选择 1-6 种食材，开始探索搭配效果。分析将显示合成风味、经典搭配和风味桥接建议。');
      return paragraphs;
    }

    if (selectedIngredients.length === 1) {
      const ing = selectedIngredients[0];
      const sorted = [...DIM_ORDER].sort((a, b) => getFlavor(ing, b) - getFlavor(ing, a));
      const top = sorted[0];
      const second = sorted[1];
      paragraphs.push(`${ing.name} 以${DIM_LABELS[top]}味为主导（${(getFlavor(ing, top) * 10).toFixed(1)}），${DIM_LABELS[second]}为辅。选择第二种食材以探索搭配效果。`);
      return paragraphs;
    }

    // Flavor evaluation
    const avg: Record<string, number> = {};
    for (const dim of DIM_ORDER) {
      const sum = selectedIngredients.reduce((s, ing) => s + getFlavor(ing, dim), 0);
      avg[dim] = sum / selectedIngredients.length;
    }
    const sorted = [...DIM_ORDER].sort((a, b) => avg[b] - avg[a]);
    const top = sorted[0];
    const second = sorted[1];
    const topVal = avg[top];

    let evalText = '';
    if (topVal > 0.7) evalText = `${DIM_LABELS[top]}味突出（${(topVal * 10).toFixed(1)}），${DIM_LABELS[second]}作为辅助，整体风味鲜明有力。`;
    else if (topVal > 0.5) evalText = `${DIM_LABELS[top]}和${DIM_LABELS[second]}为主导，风味均衡有层次。`;
    else evalText = `各维度相对均衡，整体风味温和内敛。`;
    paragraphs.push(evalText);

    // Balance detection
    const values: Record<string, number[]> = {};
    for (const dim of DIM_ORDER) values[dim] = selectedIngredients.map(ing => getFlavor(ing, dim));
    const mean: Record<string, number> = {};
    const std: Record<string, number> = {};
    for (const dim of DIM_ORDER) {
      const arr = values[dim];
      const m = arr.reduce((s, v) => s + v, 0) / arr.length;
      mean[dim] = m;
      const variance = arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
      std[dim] = Math.sqrt(variance);
    }

    const alerts: string[] = [];
    for (const dim of DIM_ORDER) {
      const diff = Math.abs(mean[dim] - 0.5);
      if (diff > 0.2 && std[dim] < 0.15) {
        const type = mean[dim] > 0.5 ? '过高' : '偏低';
        const suggestion = mean[dim] > 0.5
          ? `建议减少${DIM_LABELS[dim]}味食材，或增加对立维度平衡。`
          : `建议补充${DIM_LABELS[dim]}味突出的食材。`;
        alerts.push(`${DIM_LABELS[dim]}味${type}（${(mean[dim] * 10).toFixed(1)}），${suggestion}`);
      }
    }

    if (alerts.length === 0) {
      paragraphs.push('风味分布均衡，无明显偏颇。');
    } else {
      // Each alert as its own paragraph for readability
      for (const alert of alerts) {
        paragraphs.push(alert);
      }
    }

    // Supplement suggestions
    const weakest = [...DIM_ORDER].sort((a, b) => avg[a] - avg[b])[0];
    const weakestVal = avg[weakest];
    if (weakestVal <= 0.6) {
      const selectedSet = new Set(selectedIds);
      const candidates = getIngredients()
        .filter(ing => !selectedSet.has(ing.id) && getFlavor(ing, weakest) >= 0.7)
        .sort((a, b) => getFlavor(b, weakest) - getFlavor(a, weakest))
        .slice(0, 3);
      if (candidates.length > 0) {
        paragraphs.push(`总结：${DIM_LABELS[weakest]}味偏弱，可尝试添加 ${candidates.map(c => c.name).join('、')} 来增强此维度。`);
      }
    }

    return paragraphs;
  }, [selectedIngredients, selectedIds]);

  // ── Classic pairings ──
  const classicPairs = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const related = getCooccurrencePairs()
      .filter(p => {
        const aSelected = selectedIds.includes(p.a);
        const bSelected = selectedIds.includes(p.b);
        return (aSelected && !bSelected) || (!aSelected && bSelected);
      })
      .map(p => {
        const otherId = selectedIds.includes(p.a) ? p.b : p.a;
        const other = getIngredients().find(i => i.id === otherId);
        return { ...p, otherId, other };
      })
      .filter(p => p.other);

    const aggregated = new Map<string, { pmi: number; recipes: number; other: typeof related[0]['other'] }>();
    for (const p of related) {
      const existing = aggregated.get(p.otherId);
      if (existing) {
        existing.pmi += p.pmi;
        existing.recipes += p.recipes;
      } else {
        aggregated.set(p.otherId, { pmi: p.pmi, recipes: p.recipes, other: p.other });
      }
    }

    return Array.from(aggregated.values())
      .sort((a, b) => b.pmi - a.pmi)
      .slice(0, 5);
  }, [selectedIds]);

  // ── Flavor bridges ──
  const bridges = useMemo(() => {
    if (selectedIds.length === 0) return [];
    const related = getSurprisePairs()
      .filter(p => {
        const aSelected = selectedIds.includes(p.a);
        const bSelected = selectedIds.includes(p.b);
        return (aSelected && !bSelected) || (!aSelected && bSelected);
      })
      .map(p => {
        const otherId = selectedIds.includes(p.a) ? p.b : p.a;
        const other = getIngredients().find(i => i.id === otherId);
        return { ...p, otherId, other };
      })
      .filter(p => p.other && p.semanticSim > 0.55 && p.pmi < 0.5);

    const best = new Map<string, typeof related[0]>();
    for (const p of related) {
      const existing = best.get(p.otherId);
      if (!existing || p.score > existing.score) {
        best.set(p.otherId, p);
      }
    }

    return Array.from(best.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [selectedIds]);

  return (
    <div className="flex flex-col gap-5">
      {/* Ingredient selector */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[#2c2825]">选择食材</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8c7168]">
              {selectedIds.length}/{MAX_SELECT}
              {selectedIds.length >= MAX_SELECT && (
                <span className="text-[#ba1a1a] ml-1">已达上限</span>
              )}
            </span>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#ae3a04] hover:underline"
              >
                清空
              </button>
            )}
          </div>
        </div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c7168]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索食材..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {filteredIngredients.map(i => {
            const active = selectedIds.includes(i.id);
            const disabled = !active && selectedIds.length >= MAX_SELECT;
            return (
              <button
                key={i.id}
                onClick={() => toggleIngredient(i.id)}
                disabled={disabled}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active
                    ? CATEGORY_COLORS[i.category]
                    : CATEGORY_COLORS[i.category] + '15',
                  color: active ? 'white' : disabled ? '#d0c8c3' : CATEGORY_COLORS[i.category],
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {i.name}
                {active && <span className="ml-1">×</span>}
              </button>
            );
          })}
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-2 text-xs text-[#58413a]">
            已选：<span className="font-semibold">{selectedIngredients.map(i => i.name).join('、')}</span>
          </div>
        )}
      </div>

      {/* Synthesis Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-4">
          ⚗️ 合成风味分析
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left: Radar chart */}
          <div>
            {/* Tension Index — prominent badge above radar */}
            {tensionIndex !== null && (
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5ece7] border border-[#e0c0b5]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8c7168]">张力指数</span>
                  <span className="text-lg font-bold text-[#ae3a04]" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                    {(tensionIndex * 10).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[#8c7168]">
                    {tensionIndex < 0.3 ? '和谐' : tensionIndex > 0.6 ? '高张力' : '平衡'}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-center">
              <RadarChart datasets={radarDatasets} size={280} />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ae3a04]" />
                <span className="text-xs text-[#58413a]">合成风味</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0 border-t-2 border-dashed border-[#8c7168]" />
                <span className="text-xs text-[#58413a]">张力环（均衡上限参考线，越界即接近味觉阈值）</span>
              </div>
            </div>
          </div>

          {/* Right: Text analysis */}
          <div className="flex flex-col gap-4">
            {/* Dimension changes */}
            {selectedIngredients.length >= 2 && dimChanges.length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#8c7168] mb-2">
                  维度增幅（相对于 {selectedIngredients[0].name}）
                </h5>
                <div className="flex flex-wrap gap-2">
                  {dimChanges.map(d => {
                    const isUp = d.change > 0;
                    const isSignificant = Math.abs(d.change) > 0.1;
                    return (
                      <span
                        key={d.dim}
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: isUp ? '#ffdbcf' : '#e8f0e9',
                          color: isUp ? '#ae3a04' : '#376847',
                          opacity: isSignificant ? 1 : 0.6,
                        }}
                      >
                        {d.label}{isUp ? '↑' : '↓'} {Math.abs(d.pct).toFixed(0)}%
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analysis paragraphs */}
            <div className="space-y-1.5">
              {analysisParagraphs.map((para, i) => (
                <motion.div
                  key={i}
                  className="text-sm text-[#2c2825] leading-relaxed flex items-start gap-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-[#ae3a04] font-bold mt-0.5">•</span>
                  <span>{para}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Classic pairings + Flavor bridges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-3">
            🤝 经典搭配
          </h4>
          <div className="flex flex-col gap-2">
            {classicPairs.map((p, i) => (
              <motion.div
                key={p.other!.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#f5ece7] hover:bg-[#efe6e2] transition"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: CATEGORY_COLORS[p.other!.category] }}
                  >
                    {p.other!.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#2c2825]">{p.other!.name}</div>
                    <div className="text-[10px] text-[#8c7168]">{p.recipes} 道菜谱</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-[#e0c0b5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ae3a04]"
                      style={{ width: `${Math.min(p.pmi * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#ae3a04]">{(p.pmi * 10).toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {classicPairs.length === 0 && (
            <p className="text-xs text-[#8c7168] mt-2">
              {selectedIds.length === 0
                ? '选择食材后将显示经典搭配推荐'
                : '当前选择的食材暂无经典搭配数据'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-3">
            🌉 风味桥接
          </h4>
          <p className="text-xs text-[#8c7168] mb-3">
            化学成分相似但很少在菜谱中共现的食材——值得尝试的新搭配
          </p>
          {bridges.length === 0 ? (
            <p className="text-xs text-[#8c7168]">
              {selectedIds.length === 0
                ? '选择食材后将显示风味桥接推荐'
                : '当前选择的食材暂无风味桥接数据'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {bridges.map((b, i) => (
                <motion.div
                  key={b.other!.id}
                  className="p-3 rounded-lg border border-[#e0c0b5] bg-white"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: CATEGORY_COLORS[b.other!.category] }}
                    >
                      {b.other!.name[0]}
                    </div>
                    <span className="text-sm font-semibold text-[#2c2825]">{b.other!.name}</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#ffdbcf] text-[#ae3a04] font-medium">
                      相似 {(b.semanticSim * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#58413a]">{b.explanation}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

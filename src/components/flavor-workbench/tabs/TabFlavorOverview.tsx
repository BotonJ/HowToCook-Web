import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import {
  getIngredients,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getIngredientDescription,
} from '../data/ingredients';
// import { getActiveIngredients } from '../data/ingredients-active';
import { FlavorWheel } from '../ui/FlavorWheel';

export function TabFlavorOverview() {
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');

  // Show all dict-filtered ingredients (not just those with co-occurrence)
  const activeIngredients = useMemo(() => getIngredients(), [getIngredients().length]);

  // Set default selectedId to the first active ingredient
  useEffect(() => {
    if (!selectedId && activeIngredients.length > 0) {
      setSelectedId(activeIngredients[0].id);
    } else if (selectedId && !activeIngredients.find(i => i.id === selectedId)) {
      setSelectedId(activeIngredients[0]?.id ?? '');
    }
  }, [activeIngredients.length, selectedId]);

  const selected = useMemo(
    () => activeIngredients.find(i => i.id === selectedId) || activeIngredients[0],
    [selectedId, activeIngredients],
  );

  const description = useMemo(
    () => getIngredientDescription(selectedId),
    [selectedId],
  );

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.trim();
    if (!q) return [];
    // 精确匹配优先：有精确结果时只显示精确项
    const exact = activeIngredients.filter(i => i.name === q);
    if (exact.length > 0) return exact;
    // 前缀匹配
    const prefix = activeIngredients.filter(i => i.name.startsWith(q));
    if (prefix.length > 0) return prefix.slice(0, 8);
    // 子串兜底
    return activeIngredients.filter(
      i => i.name.includes(q) || i.nameEn.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 8);
  }, [search, activeIngredients]);

  const flavorBars = [
    { key: 'sour', label: '酸', color: '#4a7c8c' },
    { key: 'sweet', label: '甜', color: '#e68a4f' },
    { key: 'bitter', label: '苦', color: '#6c5b3e' },
    { key: 'spicy', label: '辣', color: '#c44569' },
    { key: 'umami', label: '鲜', color: '#ae3a04' },
    { key: 'fatty', label: '脂肪', color: '#7c4a7c' },
  ];

  // Guard: don't render until data is loaded and a valid ingredient is selected
  if (!selected) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-112px)] text-[#8c7168]">
        <div className="animate-pulse">加载食材数据中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] gap-3">
      {/* Combined selector + category legend strip */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-3 flex-shrink-0">
        <div className="flex gap-3">
          {/* Left: category legend (multi-column) */}
          <div className="flex-shrink-0 grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[cat] }}
                />
                <span className="text-xs text-[#58413a] font-medium whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>

          {/* Right: search + ingredient chips */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-[#2c2825] text-sm flex-shrink-0">食材选择</h3>

            {/* Always-visible search */}
            <div className="relative flex-shrink-0">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8c7168]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索..."
                className="w-28 pl-7 pr-2 py-1 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8c7168] hover:text-[#2c2825]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Search results (shown when typing) */}
            {search && filtered.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filtered.map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setSelectedId(i.id);
                      setSearch('');
                    }}
                    className="px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: CATEGORY_COLORS[i.category] + '20',
                      color: CATEGORY_COLORS[i.category],
                      border: `1px solid ${CATEGORY_COLORS[i.category]}40`,
                    }}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            )}

            {/* Ingredient chips */}
            <div className="flex flex-wrap gap-1 flex-1 max-h-20 overflow-y-auto">
              {activeIngredients.map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  className="px-2 py-0.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background:
                      i.id === selectedId
                        ? CATEGORY_COLORS[i.category]
                        : CATEGORY_COLORS[i.category] + '15',
                    color: i.id === selectedId ? 'white' : CATEGORY_COLORS[i.category],
                    boxShadow:
                      i.id === selectedId
                        ? `0 2px 0 ${CATEGORY_COLORS[i.category]}80`
                        : 'none',
                  }}
                >
                  {i.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flavor summary card */}
      {description && (
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4 flex-shrink-0">
          <h4 className="text-sm font-semibold text-[#2c2825] mb-2">
            {selected.name} · 风味概要
          </h4>
          <p className="text-sm text-[#58413a] leading-relaxed mb-3">
            {description.summary}
          </p>
          {description.bestPairs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {description.bestPairs.map(pair => (
                <span key={pair} className="px-2 py-0.5 rounded-full text-xs bg-[#f5ece7] text-[#58413a]">
                  {pair}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-[#8c7168] italic">
            💡 {description.tips}
          </p>
        </div>
      )}

      {/* Main content: full-screen flavor wheel */}
      <div className="relative flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 overflow-hidden">
        <FlavorWheel selectedId={selectedId} onSelect={setSelectedId} size={800} />

        {/* Floating left panel: flavor bars + explanations */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {/* 6D flavor bars */}
          <div className="bg-white/85 backdrop-blur rounded-xl p-3 shadow-sm border border-[#e0c0b5]/30 w-44">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-2">
              风味轮廓
            </h4>
            <div className="flex flex-col gap-1.5">
              {flavorBars.map(({ key, label, color }) => {
                const raw = selected.flavor[key as keyof typeof selected.flavor];
                const val = raw !== undefined ? raw : key === 'fatty' ? (selected.flavor as Record<string, number>)['fat'] ?? 0 : 0;
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold w-3 text-right" style={{ color }}>
                      {label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#f5ece7] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${val * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8c7168] w-6">
                      {(val * 10).toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PMI explanation */}
          <div className="bg-white/85 backdrop-blur rounded-xl p-3 shadow-sm border border-[#e0c0b5]/30 w-44">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-1">
              关于 PMI
            </h4>
            <p className="text-xs text-[#58413a] leading-relaxed">
              点互信息，数值越高表示两种食材在真实菜谱中共同出现的频率越高。分数 {'>'} 5.0
              通常意味着经典搭配。
            </p>
          </div>

          {/* Flavor bridge explanation */}
          <div className="bg-white/85 backdrop-blur rounded-xl p-3 shadow-sm border border-[#e0c0b5]/30 w-44">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-1">
              风味桥接
            </h4>
            <p className="text-xs text-[#58413a] leading-relaxed">
              化学成分相似，但在菜谱中很少一起出现的食材。它们可能是被你忽略的创新搭配。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

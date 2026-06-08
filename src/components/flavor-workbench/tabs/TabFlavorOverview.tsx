import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import {
  getIngredients,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getIngredientDescription,
} from '../data/ingredients';
import { FlavorWheel } from '../ui/FlavorWheel';

export function TabFlavorOverview() {
  const [selectedId, setSelectedId] = useState<string>('chicken');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const selected = useMemo(
    () => getIngredients().find(i => i.id === selectedId) || getIngredients()[0],
    [selectedId],
  );

  const description = useMemo(
    () => getIngredientDescription(selectedId),
    [selectedId],
  );

  // Update selectedId if current one doesn't exist after data loads
  useEffect(() => {
    const ingredients = getIngredients();
    if (ingredients.length > 0 && !ingredients.find(i => i.id === selectedId)) {
      setSelectedId(ingredients[0].id);
    }
  }, [getIngredients().length, selectedId]);

  const filtered = useMemo(
    () =>
      search
        ? getIngredients().filter(
            i =>
              i.name.includes(search) ||
              i.nameEn.toLowerCase().includes(search.toLowerCase()),
          ).slice(0, 8)
        : [],
    [search],
  );

  const flavorBars = [
    { key: 'sour', label: '酸', color: '#4a7c8c' },
    { key: 'sweet', label: '甜', color: '#e68a4f' },
    { key: 'bitter', label: '苦', color: '#6c5b3e' },
    { key: 'spicy', label: '辣', color: '#c44569' },
    { key: 'umami', label: '鲜', color: '#ae3a04' },
    { key: 'fat', label: '脂肪', color: '#7c4a7c' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] gap-3">
      {/* Combined selector + category legend strip */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-3 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Search + quick chips */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-semibold text-[#2c2825] text-sm flex-shrink-0">食材选择</h3>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5ece7] transition flex-shrink-0"
            >
              {showSearch ? <X size={16} className="text-[#58413a]" /> : <Search size={16} className="text-[#58413a]" />}
            </button>

            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="搜索..."
                    className="w-32 px-2 py-1 rounded-lg bg-[#f5ece7] border-none outline-none text-xs text-[#2c2825] placeholder:text-[#8c7168]"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {showSearch && filtered.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filtered.map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setSelectedId(i.id);
                      setSearch('');
                      setShowSearch(false);
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all hover:scale-105"
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

            <div className="flex flex-wrap gap-1 flex-1 max-h-20 overflow-y-auto">
              {(showAll ? getIngredients() : getIngredients().slice(0, 24)).map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
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
              {getIngredients().length > 24 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-[10px] text-[#ae3a04] hover:underline self-center"
                >
                  {showAll ? '收起' : `+${getIngredients().length - 24} 更多`}
                </button>
              )}
            </div>
          </div>

          {/* Category legend inline */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
              <div key={cat} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: CATEGORY_COLORS[cat] }}
                />
                <span className="text-[10px] text-[#58413a] font-medium">{label}</span>
              </div>
            ))}
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
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#58413a] mb-2">
              风味轮廓
            </h4>
            <div className="flex flex-col gap-1.5">
              {flavorBars.map(({ key, label, color }) => {
                const val = selected.flavor[key as keyof typeof selected.flavor];
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold w-3 text-right" style={{ color }}>
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
                    <span className="text-[9px] text-[#8c7168] w-5">
                      {(val * 100).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PMI explanation */}
          <div className="bg-white/85 backdrop-blur rounded-xl p-3 shadow-sm border border-[#e0c0b5]/30 w-44">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#58413a] mb-1">
              关于 PMI
            </h4>
            <p className="text-[10px] text-[#58413a] leading-relaxed">
              点互信息，数值越高表示两种食材在真实菜谱中共同出现的频率越高。PMI {'>'} 2.0
              通常意味着经典搭配。
            </p>
          </div>

          {/* Flavor bridge explanation */}
          <div className="bg-white/85 backdrop-blur rounded-xl p-3 shadow-sm border border-[#e0c0b5]/30 w-44">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#58413a] mb-1">
              风味桥接
            </h4>
            <p className="text-[10px] text-[#58413a] leading-relaxed">
              化学成分相似，但在菜谱中很少一起出现的食材。它们可能是被你忽略的创新搭配。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

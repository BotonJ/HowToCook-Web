import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getIngredients, getCooccurrencePairs, CATEGORY_COLORS } from '../data/ingredients';
import { slerp2d, nearestK, arcPath, type Vec2 } from '../lib/slerp';
import { RadarChart } from '../ui/RadarChart';
import { Search, X } from 'lucide-react';

const TIMELINE_STOPS = [0, 0.25, 0.5, 0.75, 1.0];

export function TabSlerp() {
  const [vectorA, setVectorA] = useState('');
  const [vectorB, setVectorB] = useState('');

  // Only show ingredients that have at least 1 cooccurrence pair
  const activeIngredients = useMemo(() => {
    const all = getIngredients();
    if (all.length === 0) return [];
    const pairs = getCooccurrencePairs();
    const connectedIds = new Set<string>();
    for (const p of pairs) {
      connectedIds.add(p.a);
      connectedIds.add(p.b);
    }
    return all.filter(i => connectedIds.has(i.id));
  }, [getIngredients().length]);

  const ingA = useMemo(() => getIngredients().find(i => i.id === vectorA), [vectorA]);
  const ingB = useMemo(() => getIngredients().find(i => i.id === vectorB), [vectorB]);

  // Guard: show empty state when no ingredients selected
  if (!ingA || !ingB) {
    return (
      <div className="flex flex-col gap-4">
        {/* Core concept */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-5">
          <h2 className="text-lg font-bold text-[#2c2825] mb-2">
            SLERP Lab — 风味走廊
          </h2>
          <p className="text-sm text-[#58413a] leading-relaxed mb-2">
            拖动滑块，从食材 A 的风味领地走向食材 B。你会经过一条「风味走廊」，那里住着既像 A、又像 B 的隐藏味道。
          </p>
          <p className="text-xs text-[#8c7168] leading-relaxed">
            如果把每种食材想象成高维空间里的一个「风味指纹」，简单混合就像两种果汁兑在一起——越中间越寡淡、变「水」。SLERP（球面线性插值）不走直线，而是沿着球面表面画一条弧线，始终保持风味的饱满度。你在这条走廊上发现的每一种中介食材，都是弧线上真实存在的风味坐标。
          </p>
        </div>

        {/* Empty state + ingredient selector */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-5">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <h3 className="text-lg font-semibold text-[#2c2825] mb-2">开始探索</h3>
            <p className="text-sm text-[#58413a] mb-4">请选择两种食材开始探索风味走廊</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div>
                <label className="text-xs text-[#8c7168] uppercase tracking-wider font-bold mb-2 block">食材 A（起点）</label>
                <IngredientSelector
                  value={vectorA}
                  onChange={setVectorA}
                  activeIngredients={activeIngredients}
                  placeholder="选择起点食材..."
                />
              </div>
              <div>
                <label className="text-xs text-[#8c7168] uppercase tracking-wider font-bold mb-2 block">食材 B（终点）</label>
                <IngredientSelector
                  value={vectorB}
                  onChange={setVectorB}
                  activeIngredients={activeIngredients}
                  placeholder="选择终点食材..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TabSlerpInner ingA={ingA} ingB={ingB} vectorA={vectorA} vectorB={vectorB} setVectorA={setVectorA} setVectorB={setVectorB} activeIngredients={activeIngredients} />;
}

import type { Ingredient } from '../data/ingredients';

interface TabSlerpInnerProps {
  ingA: Ingredient;
  ingB: Ingredient;
  vectorA: string;
  vectorB: string;
  setVectorA: (v: string) => void;
  setVectorB: (v: string) => void;
  activeIngredients: Ingredient[];
}

function TabSlerpInner({ ingA, ingB, vectorA, vectorB, setVectorA, setVectorB, activeIngredients }: TabSlerpInnerProps) {
  const [t, setT] = useState(0.45);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const currentPos = useMemo((): Vec2 => {
    return slerp2d(
      { x: ingA.pca[0], y: ingA.pca[1] },
      { x: ingB.pca[0], y: ingB.pca[1] },
      t,
    );
  }, [ingA, ingB, t]);

  const arcPoints = useMemo(() => {
    return arcPath(
      { x: ingA.pca[0], y: ingA.pca[1] },
      { x: ingB.pca[0], y: ingB.pca[1] },
      60,
    );
  }, [ingA, ingB]);

  const neighbors = useMemo(() => {
    const allIngredients = getIngredients().map(i => ({
      name: i.name, nameEn: i.nameEn, pos: { x: i.pca[0], y: i.pca[1] } as Vec2, category: i.category,
    }));
    return nearestK(currentPos, allIngredients, 4, [vectorA, vectorB]);
  }, [currentPos, vectorA, vectorB]);

  const corridorPanorama = useMemo(() => {
    const allIngredients = getIngredients().map(i => ({
      id: i.id,
      name: i.name,
      nameEn: i.nameEn,
      pos: { x: i.pca[0], y: i.pca[1] } as Vec2,
      category: i.category,
    }));
    return TIMELINE_STOPS.map(stop => {
      const pos = slerp2d(
        { x: ingA.pca[0], y: ingA.pca[1] },
        { x: ingB.pca[0], y: ingB.pca[1] },
        stop,
      );
      const near = nearestK(pos, allIngredients, 1, [vectorA, vectorB])[0];
      return { stop, label: stop === 0 ? ingA.name : stop === 1 ? ingB.name : `${Math.round(stop * 100)}%`, neighbor: near };
    });
  }, [ingA, ingB, vectorA, vectorB]);

  const currentFlavor = useMemo(() => {
    const dims = ['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fat'] as const;
    const result: Record<string, number> = {};
    for (const dim of dims) {
      result[dim] = ingA.flavor[dim] * (1 - t) + ingB.flavor[dim] * t;
    }
    return result;
  }, [ingA, ingB, t]);

  const mapX = useCallback((x: number) => {
    const centerX = (ingA.pca[0] + ingB.pca[0]) / 2;
    const base = 300 + ((x - centerX) / 160) * 250;
    return 300 + (base - 300) * zoom + pan.x;
  }, [ingA, ingB, zoom, pan.x]);

  const mapY = useCallback((y: number) => {
    const centerY = (ingA.pca[1] + ingB.pca[1]) / 2;
    const base = 210 - ((y - centerY) / 130) * 170;
    return 210 + (base - 210) * zoom + pan.y;
  }, [ingA, ingB, zoom, pan.y]);

  const arcD = useMemo(() => {
    return arcPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)}`).join(' ');
  }, [arcPoints, mapX, mapY]);

  const handleSelectIngredient = useCallback((id: string) => {
    if (id === vectorA || id === vectorB) {
      setVectorA(vectorB);
      setVectorB(vectorA);
    } else {
      setVectorB(id);
    }
  }, [vectorA, vectorB]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  return (
    <div className="flex flex-col gap-4">
      {/* Core concept */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-5">
        <h2 className="text-lg font-bold text-[#2c2825] mb-2">
          SLERP Lab — 风味走廊
        </h2>
        <p className="text-sm text-[#58413a] leading-relaxed mb-2">
          拖动滑块，从食材 A 的风味领地走向食材 B。你会经过一条「风味走廊」，那里住着既像 A、又像 B 的隐藏味道。
        </p>
        <p className="text-xs text-[#8c7168] leading-relaxed">
          如果把每种食材想象成高维空间里的一个「风味指纹」，简单混合就像两种果汁兑在一起——越中间越寡淡、变「水」。SLERP（球面线性插值）不走直线，而是沿着球面表面画一条弧线，始终保持风味的饱满度。你在这条走廊上发现的每一种中介食材，都是弧线上真实存在的风味坐标。
        </p>
      </div>

      {/* Upper section: scatter + controls aligned */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Left: Scatter plot */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a]">风味空间</h4>
              <p className="text-[10px] text-[#8c7168] mt-0.5">
                点击任意食材设为终点，点击端点可交换起点与终点。拖拽空白处可平移。
              </p>
              <div className="text-sm text-[#8c7168] mt-1.5">
                <span className="font-semibold text-[#ae3a04]">{ingA.name}</span>
                <span className="mx-2">→</span>
                <span className="font-semibold text-[#4a7c8c]">{ingB.name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
                className="w-8 h-8 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-sm font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                title="放大"
              >
                +
              </button>
              <button
                onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
                className="w-8 h-8 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-sm font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                title="缩小"
              >
                −
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="w-8 h-8 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-[10px] font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                title="重置"
              >
                ⌂
              </button>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden bg-white" style={{ height: 380 }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 600 380"
              preserveAspectRatio="xMidYMid meet"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <defs>
                <pattern id="slerp-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e0c0b5" strokeWidth="0.3" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#slerp-grid)" />

              {activeIngredients.map(ing => {
                const x = mapX(ing.pca[0]);
                const y = mapY(ing.pca[1]);
                if (ing.id === vectorA || ing.id === vectorB) return null;
                return (
                  <g
                    key={ing.id}
                    onClick={(e) => { e.stopPropagation(); handleSelectIngredient(ing.id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={x} cy={y} r={7} fill={CATEGORY_COLORS[ing.category]} fillOpacity={0.6} stroke="white" strokeWidth={1.5} />
                    <text x={x + 10} y={y + 4} fontSize={11} fill="#58413a" fontFamily="Quicksand, sans-serif" opacity={0.9}>
                      {ing.name}
                    </text>
                  </g>
                );
              })}

              <path d={arcD} fill="none" stroke="#ae3a04" strokeWidth={3} strokeDasharray="6 4" opacity={0.5} strokeLinecap="round" />

              <g onClick={(e) => { e.stopPropagation(); handleSelectIngredient(vectorA); }} style={{ cursor: 'pointer' }}>
                <circle cx={mapX(ingA.pca[0])} cy={mapY(ingA.pca[1])} r={11} fill="#ae3a04" stroke="white" strokeWidth={2.5} />
                <text x={mapX(ingA.pca[0])} y={mapY(ingA.pca[1]) - 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#2c2825" fontFamily="Quicksand, sans-serif">
                  {ingA.name}
                </text>
              </g>

              <g onClick={(e) => { e.stopPropagation(); handleSelectIngredient(vectorB); }} style={{ cursor: 'pointer' }}>
                <circle cx={mapX(ingB.pca[0])} cy={mapY(ingB.pca[1])} r={11} fill="#4a7c8c" stroke="white" strokeWidth={2.5} />
                <text x={mapX(ingB.pca[0])} y={mapY(ingB.pca[1]) - 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#2c2825" fontFamily="Quicksand, sans-serif">
                  {ingB.name}
                </text>
              </g>

              <circle cx={mapX(currentPos.x)} cy={mapY(currentPos.y)} r={18} fill="#ae3a04" opacity="0.18" className="pulse-dot" />
              <circle cx={mapX(currentPos.x)} cy={mapY(currentPos.y)} r={11} fill="white" stroke="#ae3a04" strokeWidth={3.5} />
            </svg>
          </div>
        </div>

        {/* Right: Controls + flavor profile */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-1">
              实验控制
            </h4>
            <p className="text-[10px] text-[#8c7168] mb-3">
              越靠左，味道越像起点食材；越往右，终点食材的特征越突出。
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] text-[#8c7168] uppercase tracking-wider font-bold mb-1 block">起点</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8c7168]" />
                  <input
                    type="text"
                    value={searchA}
                    onChange={e => setSearchA(e.target.value)}
                    placeholder={ingA.name}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-[#f5ece7] border-none text-xs text-[#2c2825] outline-none placeholder:text-[#8c7168]"
                  />
                  {searchA && (
                    <button
                      onClick={() => setSearchA('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c7168] hover:text-[#2c2825]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {searchA && (
                  <div className="mt-1 max-h-24 overflow-y-auto rounded-lg bg-white border border-[#e0c0b5]/30">
                    {activeIngredients
                      .filter(i => i.name.includes(searchA) || i.nameEn.toLowerCase().includes(searchA.toLowerCase()))
                      .slice(0, 10)
                      .map(i => (
                        <button
                          key={i.id}
                          onClick={() => { setVectorA(i.id); setSearchA(''); }}
                          className="w-full px-2 py-1 text-left text-xs hover:bg-[#f5ece7] transition"
                        >
                          {i.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] text-[#8c7168] uppercase tracking-wider font-bold mb-1 block">终点</label>
                <div className="relative">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8c7168]" />
                  <input
                    type="text"
                    value={searchB}
                    onChange={e => setSearchB(e.target.value)}
                    placeholder={ingB.name}
                    className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-[#f5ece7] border-none text-xs text-[#2c2825] outline-none placeholder:text-[#8c7168]"
                  />
                  {searchB && (
                    <button
                      onClick={() => setSearchB('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c7168] hover:text-[#2c2825]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {searchB && (
                  <div className="mt-1 max-h-24 overflow-y-auto rounded-lg bg-white border border-[#e0c0b5]/30">
                    {activeIngredients
                      .filter(i => i.name.includes(searchB) || i.nameEn.toLowerCase().includes(searchB.toLowerCase()))
                      .slice(0, 10)
                      .map(i => (
                        <button
                          key={i.id}
                          onClick={() => { setVectorB(i.id); setSearchB(''); }}
                          className="w-full px-2 py-1 text-left text-xs hover:bg-[#f5ece7] transition"
                        >
                          {i.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#8c7168] uppercase tracking-wider font-bold">混合比例</span>
                <span className="text-lg font-bold text-[#ae3a04]">{Math.round(t * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(t * 100)}
                onChange={e => setT(Number(e.target.value) / 100)}
              />
              <p className="text-[10px] text-[#8c7168] mt-1">
                {Math.round(t * 100) === 0
                  ? `完全是 ${ingA.name} 的风味`
                  : Math.round(t * 100) === 100
                    ? `完全是 ${ingB.name} 的风味`
                    : `当前位置的风味最接近 ${neighbors[0]?.name || '—'}`
                }
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-[#f5ece7] text-center">
              <span className="text-xs text-[#58413a]">
                <span className="font-semibold text-[#ae3a04]">{ingA.name} {Math.round((1 - t) * 100)}%</span>
                {' + '}
                <span className="font-semibold text-[#4a7c8c]">{ingB.name} {Math.round(t * 100)}%</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-3">
              当前风味轮廓
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <RadarChart datasets={[{ label: '当前', data: currentFlavor, color: '#ae3a04' }, { label: ingA.name, data: ingA.flavor, color: '#8c7168', dashed: true }]} size={180} />
              <div className="flex-1 w-full flex flex-col gap-2">
                {(['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fat'] as const).map(dim => {
                  const val = currentFlavor[dim];
                  const labels: Record<string, string> = { sour: '酸', sweet: '甜', bitter: '苦', spicy: '辣', umami: '鲜', fat: '脂肪' };
                  const colors: Record<string, string> = { sour: '#4a7c8c', sweet: '#e68a4f', bitter: '#6c5b3e', spicy: '#c44569', umami: '#ae3a04', fat: '#7c4a7c' };
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="text-xs font-semibold w-4" style={{ color: colors[dim] }}>{labels[dim]}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#f5ece7] overflow-hidden">
                        <div className="h-full rounded-full" style={{ background: colors[dim], width: `${val * 100}%` }} />
                      </div>
                      <span className="text-xs text-[#8c7168] w-6">{(val * 10).toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Corridor Panorama spans full width */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e0c0b5]/30 p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a] mb-1">
          走廊全景
        </h4>
        <p className="text-[10px] text-[#8c7168] mb-3">
          从起点到终点，每个位置风味指纹最接近的真实食材。高亮项为你当前所在位置。
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {corridorPanorama.map((stop, i) => {
            const isCurrent = Math.abs(stop.stop - t) < 0.125;
            return (
              <motion.div
                key={stop.stop}
                className="flex-shrink-0 flex flex-col items-center p-4 rounded-lg transition-colors min-w-[100px]"
                style={{
                  background: isCurrent ? '#ffdbcf' : '#f5ece7',
                  border: isCurrent ? '2px solid #ae3a04' : '2px solid transparent',
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-[10px] font-bold text-[#8c7168] mb-2">{stop.label}</span>
                {stop.neighbor ? (
                  <>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-1.5"
                      style={{ background: CATEGORY_COLORS[stop.neighbor.category] }}
                    >
                      {stop.neighbor.name[0]}
                    </div>
                    <div className="text-sm font-semibold text-[#2c2825] text-center leading-tight">{stop.neighbor.name}</div>
                    <div className="text-[10px] text-[#8c7168] text-center">{stop.neighbor.nameEn}</div>
                  </>
                ) : (
                  <span className="text-xs text-[#8c7168]">—</span>
                )}
                {isCurrent && (
                  <span className="text-[10px] font-bold text-[#ae3a04] mt-1.5">当前</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Ingredient selector component
interface IngredientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  activeIngredients: Ingredient[];
  placeholder: string;
}

function IngredientSelector({ value, onChange, activeIngredients, placeholder }: IngredientSelectorProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const selected = activeIngredients.find(i => i.id === value);

  const filtered = useMemo(() => {
    if (!search) return activeIngredients.slice(0, 50);
    return activeIngredients.filter(i =>
      i.name.includes(search) || i.nameEn.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20);
  }, [search, activeIngredients]);

  return (
    <div className="relative">
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-3 py-2 rounded-lg bg-[#f5ece7] border border-[#e0c0b5]/30 cursor-pointer text-sm text-[#2c2825] min-h-[40px] flex items-center"
      >
        {selected ? (
          <span className="font-medium">{selected.name}</span>
        ) : (
          <span className="text-[#8c7168]">{placeholder}</span>
        )}
      </div>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-[#e0c0b5]/30 max-h-60 overflow-hidden">
            <div className="p-2 border-b border-[#e0c0b5]/20">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索食材..."
                className="w-full px-2 py-1.5 rounded bg-[#f5ece7] border-none text-xs text-[#2c2825] outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map(i => (
                <button
                  key={i.id}
                  onClick={() => { onChange(i.id); setShowDropdown(false); setSearch(''); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#f5ece7] transition flex items-center gap-2"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0"
                    style={{ background: CATEGORY_COLORS[i.category] }}
                  >
                    {i.name[0]}
                  </div>
                  <span>{i.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-[#8c7168]">
                  没有找到匹配的食材
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

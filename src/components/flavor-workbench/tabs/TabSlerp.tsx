import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getIngredients, CATEGORY_COLORS, type Ingredient } from '../data/ingredients';
import { getActiveIngredients } from '../data/ingredients-active';
import { slerp2d, nearestK, arcPath, type Vec2 } from '../lib/slerp';
import { RadarChart } from '../ui/RadarChart';
import { Search, X } from 'lucide-react';

const TIMELINE_STOPS = [0, 0.25, 0.5, 0.75, 1.0];

export function TabSlerp() {
  const [vectorA, setVectorA] = useState('');
  const [vectorB, setVectorB] = useState('');

  const activeIngredients = useMemo(() => getActiveIngredients(), [getIngredients().length]);

  const ingA = useMemo(() => getIngredients().find(i => i.id === vectorA), [vectorA]);
  const ingB = useMemo(() => getIngredients().find(i => i.id === vectorB), [vectorB]);

  if (!ingA || !ingB) {
    return (
      <div className="flex flex-col gap-4">
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
  const [autoFitEnabled, setAutoFitEnabled] = useState(true);
  const [highlightSearch, setHighlightSearch] = useState('');
  const [recentPicks, setRecentPicks] = useState<string[]>([]);

  const MAX_ZOOM = 2;

  const trackPick = useCallback((id: string) => {
    setRecentPicks(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 8);
      return next;
    });
  }, []);

  const handlePickA = useCallback((id: string) => { trackPick(id); setVectorA(id); setSearchA(''); }, [trackPick, setVectorA]);
  const handlePickB = useCallback((id: string) => { trackPick(id); setVectorB(id); setSearchB(''); }, [trackPick, setVectorB]);

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
      id: i.id,
      name: i.name, nameEn: i.nameEn, pos: { x: i.pca[0], y: i.pca[1] } as Vec2, category: i.category,
    }));
    return nearestK(currentPos, allIngredients, 6, [vectorA, vectorB]);
  }, [currentPos, vectorA, vectorB]);

  // Corridor stop neighbors (for Level 0 waypoints)
  const corridorNeighbors = useMemo(() => {
    const allIngredients = getIngredients().map(i => ({
      id: i.id,
      name: i.name, nameEn: i.nameEn, pos: { x: i.pca[0], y: i.pca[1] } as Vec2, category: i.category,
    }));
    return TIMELINE_STOPS.map(stop => {
      const pos = slerp2d(
        { x: ingA.pca[0], y: ingA.pca[1] },
        { x: ingB.pca[0], y: ingB.pca[1] },
        stop,
      );
      return nearestK(pos, allIngredients, 1, [vectorA, vectorB])[0];
    });
  }, [ingA, ingB, vectorA, vectorB]);

  // ── Level-based node visibility ──────────────────────────────
  // Level 0 (zoom ≤ 1): A/B + 5 corridor waypoints only (~12 nodes)
  // Level 1 (zoom 1-2): expand to corridor neighborhood, max ~40

  const visibleIngredients = useMemo(() => {
    const all = activeIngredients.length > 0 ? activeIngredients : getIngredients();
    const excludeSet = new Set([vectorA, vectorB]);

    const waypointIds = new Set(
      corridorNeighbors.filter(Boolean).map(n => 'id' in n ? n.id : n.name)
    );
    const neighborIds = new Set(
      neighbors.filter(Boolean).map(n => 'id' in n ? n.id : n.name)
    );

    if (zoom <= 1) {
      return all.filter(ing =>
        excludeSet.has(ing.id) || waypointIds.has(ing.id) || neighborIds.has(ing.id)
      ).slice(0, 15);
    }

    // Level 1: expand with distance scoring
    const maxVisible = Math.floor(15 + (zoom - 1) * 25); // 15→40

    const scored = all
      .filter(ing => !excludeSet.has(ing.id))
      .map(ing => {
        const ingPos = { x: ing.pca[0], y: ing.pca[1] };
        let minDist = Infinity;
        for (let i = 0; i < arcPoints.length; i += 3) {
          const dist = Math.sqrt((ingPos.x - arcPoints[i].x) ** 2 + (ingPos.y - arcPoints[i].y) ** 2);
          if (dist < minDist) minDist = dist;
        }
        let score = -minDist;
        if (waypointIds.has(ing.id)) score += 200;
        if (neighborIds.has(ing.id)) score += 100;
        return { ing, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxVisible)
      .map(s => s.ing);

    return scored;
  }, [activeIngredients, zoom, arcPoints, corridorNeighbors, neighbors, vectorA, vectorB]);

  // Deterministic label visibility — only show for important nodes
  const shouldShowLabel = useCallback((ing: Ingredient): boolean => {
    if ([vectorA, vectorB].includes(ing.id)) return true;

    const waypointIdList = corridorNeighbors.filter(Boolean).map(n => 'id' in n ? n.id : n.name);
    if (waypointIdList.includes(ing.id)) return true;

    const neighborIdList = neighbors.map(n => 'id' in n ? n.id : n.name);
    const nIdx = neighborIdList.indexOf(ing.id);
    if (nIdx >= 0 && nIdx < 3) return true;

    // Search highlight
    if (highlightSearch && (
      ing.name.includes(highlightSearch) ||
      ing.nameEn.toLowerCase().includes(highlightSearch.toLowerCase())
    )) return true;

    return false;
  }, [vectorA, vectorB, neighbors, corridorNeighbors, highlightSearch]);

  // Auto-fit to A, B + neighbors
  const autoFitView = useCallback(() => {
    if (!autoFitEnabled) return;

    const relevantNodes = [ingA, ingB];
    const positions = relevantNodes.map(n => ({ x: n.pca[0], y: n.pca[1] }));
    neighbors.slice(0, 8).forEach(n => positions.push(n.pos));

    const bounds = {
      minX: Math.min(...positions.map(p => p.x)),
      maxX: Math.max(...positions.map(p => p.x)),
      minY: Math.min(...positions.map(p => p.y)),
      maxY: Math.max(...positions.map(p => p.y)),
    };

    const padding = 1.3;
    const contentWidth = (bounds.maxX - bounds.minX) * padding;
    const contentHeight = (bounds.maxY - bounds.minY) * padding;

    const viewWidth = 600;
    const viewHeight = 380;

    const newZoom = Math.min(
      viewWidth / contentWidth,
      viewHeight / contentHeight
    );

    setZoom(Math.max(0.6, Math.min(newZoom, MAX_ZOOM)));
  }, [autoFitEnabled, ingA, ingB, neighbors]);

  useEffect(() => {
    autoFitView();
  }, [vectorA, vectorB, autoFitView]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setAutoFitEnabled(false);
    setZoom(Math.min(newZoom, MAX_ZOOM));
  }, []);

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
    const dims = ['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fatty'] as const;
    const result: Record<string, number> = {};
    for (const dim of dims) {
      result[dim] = ingA.flavor[dim] * (1 - t) + ingB.flavor[dim] * t;
    }
    return result;
  }, [ingA, ingB, t]);

  // Adaptive PCA→SVG mapping: short corridors get stretched so nodes spread out
  const pcaRange = Math.max(
    Math.abs(ingA.pca[0] - ingB.pca[0]),
    Math.abs(ingA.pca[1] - ingB.pca[1]),
    1, // minimum range to avoid division by zero
  );
  // Scale factor: corridors shorter than 80 PCA units get stretched
  const stretchFactor = Math.max(80 / pcaRange, 1);

  const mapX = useCallback((x: number) => {
    const centerX = (ingA.pca[0] + ingB.pca[0]) / 2;
    const scale = 250 / 80; // 80 PCA units = 250 SVG pixels at zoom=1
    const base = 300 + ((x - centerX) * stretchFactor * scale);
    return 300 + (base - 300) * zoom + pan.x;
  }, [ingA, ingB, zoom, pan.x, stretchFactor]);

  const mapY = useCallback((y: number) => {
    const centerY = (ingA.pca[1] + ingB.pca[1]) / 2;
    const scale = 170 / 80;
    const base = 210 - ((y - centerY) * stretchFactor * scale);
    return 210 + (base - 210) * zoom + pan.y;
  }, [ingA, ingB, zoom, pan.y, stretchFactor]);

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

  // Zoom level indicator label
  const zoomLevelLabel = zoom <= 1 ? '概览' : '深入';
  const visibleCount = visibleIngredients.length;
  const totalCount = activeIngredients.length || getIngredients().length;

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
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#58413a]">
                风味空间
                <span className="ml-2 text-[10px] font-normal text-[#8c7168]">
                  [{zoomLevelLabel}] {visibleCount}/{totalCount}
                </span>
              </h4>
              <p className="text-[10px] text-[#8c7168] mt-0.5">
                放大可查看更多食材。点击食材设为终点，点击端点交换 A↔B。拖拽平移。
              </p>
              <div className="text-sm text-[#8c7168] mt-1.5">
                <span className="font-semibold text-[#ae3a04]">{ingA.name}</span>
                <span className="mx-2">→</span>
                <span className="font-semibold text-[#4a7c8c]">{ingB.name}</span>
              </div>
            </div>

            {/* Highlight search: find a specific ingredient on the map */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#8c7168]" />
                <input
                  type="text"
                  value={highlightSearch}
                  onChange={e => setHighlightSearch(e.target.value)}
                  placeholder="定位食材..."
                  className="w-20 pl-6 pr-1.5 py-1 rounded-lg bg-[#f5ece7] border-none text-[10px] outline-none placeholder:text-[#8c7168]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleZoomChange(Math.min(zoom * 1.3, MAX_ZOOM))}
                  className="w-7 h-7 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-xs font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                  title="放大"
                >
                  +
                </button>
                <button
                  onClick={() => handleZoomChange(Math.max(zoom / 1.3, 0.5))}
                  className="w-7 h-7 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-xs font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                  title="缩小"
                >
                  −
                </button>
                <button
                  onClick={() => {
                    setAutoFitEnabled(true);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="w-7 h-7 rounded-lg bg-white shadow-md border border-[#e0c0b5]/40 flex items-center justify-center text-[9px] font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
                  title="重置"
                >
                  ⌂
                </button>
              </div>
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

              {/* Corridor scatter nodes */}
              {visibleIngredients.map(ing => {
                const x = mapX(ing.pca[0]);
                const y = mapY(ing.pca[1]);
                if (ing.id === vectorA || ing.id === vectorB) return null;

                const showLabel = shouldShowLabel(ing);
                const isNeighbor = neighbors.some(n => ('id' in n ? n.id : n.name) === ing.id);
                const isWaypoint = corridorNeighbors.some(n => n && ('id' in n ? n.id : n.name) === ing.id);
                const isHighlighted = highlightSearch && (
                  ing.name.includes(highlightSearch) ||
                  ing.nameEn.toLowerCase().includes(highlightSearch.toLowerCase())
                );

                const nodeSize = isHighlighted ? 10 : isWaypoint ? 8 : isNeighbor ? 7 : 5;
                const nodeOpacity = isHighlighted ? 1 : isWaypoint ? 0.9 : isNeighbor ? 0.75 : 0.4;
                const strokeW = isHighlighted ? 3 : isWaypoint ? 2 : 1.5;

                return (
                  <g
                    key={ing.id}
                    onClick={(e) => { e.stopPropagation(); handleSelectIngredient(ing.id); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={nodeSize}
                      fill={isHighlighted ? '#ae3a04' : CATEGORY_COLORS[ing.category]}
                      fillOpacity={nodeOpacity}
                      stroke={isHighlighted ? '#ae3a04' : 'white'}
                      strokeWidth={strokeW}
                    />
                    {showLabel && (
                      <text
                        x={x + nodeSize + 3}
                        y={y + 4}
                        fontSize={isHighlighted ? 12 : isWaypoint || isNeighbor ? 11 : 10}
                        fontWeight={isHighlighted ? 700 : isWaypoint || isNeighbor ? 600 : 400}
                        fill={isHighlighted ? '#ae3a04' : '#58413a'}
                        fontFamily="Quicksand, sans-serif"
                      >
                        {ing.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Arc path */}
              <path d={arcD} fill="none" stroke="#ae3a04" strokeWidth={3} strokeDasharray="6 4" opacity={0.5} strokeLinecap="round" />

              {/* Endpoint A */}
              <g onClick={(e) => { e.stopPropagation(); handleSelectIngredient(vectorA); }} style={{ cursor: 'pointer' }}>
                <circle cx={mapX(ingA.pca[0])} cy={mapY(ingA.pca[1])} r={11} fill="#ae3a04" stroke="white" strokeWidth={2.5} />
                <text x={mapX(ingA.pca[0])} y={mapY(ingA.pca[1]) - 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#2c2825" fontFamily="Quicksand, sans-serif">
                  {ingA.name}
                </text>
              </g>

              {/* Endpoint B */}
              <g onClick={(e) => { e.stopPropagation(); handleSelectIngredient(vectorB); }} style={{ cursor: 'pointer' }}>
                <circle cx={mapX(ingB.pca[0])} cy={mapY(ingB.pca[1])} r={11} fill="#4a7c8c" stroke="white" strokeWidth={2.5} />
                <text x={mapX(ingB.pca[0])} y={mapY(ingB.pca[1]) - 18} textAnchor="middle" fontSize={14} fontWeight={700} fill="#2c2825" fontFamily="Quicksand, sans-serif">
                  {ingB.name}
                </text>
              </g>

              {/* Current position marker */}
              <circle cx={mapX(currentPos.x)} cy={mapY(currentPos.y)} r={18} fill="#ae3a04" opacity="0.18" />
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

            {/* Endpoint selectors with preset chips + search */}
            <EndpointPicker
              label="起点"
              currentId={vectorA}
              search={searchA}
              onSearchChange={setSearchA}
              onPick={handlePickA}
              activeIngredients={activeIngredients}
              recentPicks={recentPicks}
            />
            <EndpointPicker
              label="终点"
              currentId={vectorB}
              search={searchB}
              onSearchChange={setSearchB}
              onPick={handlePickB}
              activeIngredients={activeIngredients}
              recentPicks={recentPicks}
            />

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
                aria-label="Mix ratio"
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
                {(['sour', 'sweet', 'bitter', 'spicy', 'umami', 'fatty'] as const).map(dim => {
                  const val = currentFlavor[dim];
                  const labels: Record<string, string> = { sour: '酸', sweet: '甜', bitter: '苦', spicy: '辣', umami: '鲜', fatty: '脂肪' };
                  const colors: Record<string, string> = { sour: '#4a7c8c', sweet: '#e68a4f', bitter: '#6c5b3e', spicy: '#c44569', umami: '#ae3a04', fatty: '#7c4a7c' };
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

      {/* Bottom: Corridor Panorama */}
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

// ── Endpoint picker with preset chips + search + recent history ──

const PRESET_IDS = ['chicken', 'pork', 'beef', 'shrimp', 'tofu', 'garlic', 'chili', 'tomato', 'mushroom', 'coconut-milk'];

interface EndpointPickerProps {
  label: string;
  currentId: string;
  search: string;
  onSearchChange: (v: string) => void;
  onPick: (id: string) => void;
  activeIngredients: Ingredient[];
  recentPicks: string[];
}

function EndpointPicker({ label, currentId, search, onSearchChange, onPick, activeIngredients, recentPicks }: EndpointPickerProps) {
  const current = activeIngredients.find(i => i.id === currentId);

  // Chips: presets + recent picks (deduplicated, excluding current)
  const chips = useMemo(() => {
    const seen = new Set([currentId]);
    const result: Ingredient[] = [];
    // Recent picks first
    for (const id of recentPicks) {
      if (seen.has(id)) continue;
      const ing = activeIngredients.find(i => i.id === id);
      if (ing) { result.push(ing); seen.add(id); }
    }
    // Then presets
    for (const id of PRESET_IDS) {
      if (seen.has(id)) continue;
      const ing = activeIngredients.find(i => i.id === id);
      if (ing) { result.push(ing); seen.add(id); }
    }
    return result.slice(0, 12);
  }, [currentId, recentPicks, activeIngredients]);

  // Search results
  const searchResults = useMemo(() => {
    if (!search) return [];
    return activeIngredients
      .filter(i => i.name.includes(search) || i.nameEn.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 8);
  }, [search, activeIngredients]);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] text-[#8c7168] uppercase tracking-wider font-bold">{label}</label>
        {current && (
          <span className="text-xs font-semibold text-[#2c2825]">{current.name}</span>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-1.5">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8c7168]" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜索食材..."
          className="w-full pl-7 pr-6 py-1.5 rounded-lg bg-[#f5ece7] border-none text-xs text-[#2c2825] outline-none placeholder:text-[#8c7168]"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8c7168] hover:text-[#2c2825]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {search && searchResults.length > 0 && (
        <div className="mb-1.5 max-h-28 overflow-y-auto rounded-lg bg-white border border-[#e0c0b5]/30">
          {searchResults.map(i => (
            <button
              key={i.id}
              onClick={() => onPick(i.id)}
              className="w-full px-2.5 py-1.5 text-left text-xs hover:bg-[#f5ece7] transition flex items-center gap-2"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                style={{ background: CATEGORY_COLORS[i.category] }}
              >
                {i.name[0]}
              </div>
              <span>{i.name}</span>
              <span className="text-[#8c7168] ml-auto text-[10px]">{i.nameEn}</span>
            </button>
          ))}
        </div>
      )}

      {/* Preset + recent chips */}
      <div className="flex flex-wrap gap-1">
        {chips.map(ing => {
          const isCurrent = ing.id === currentId;
          return (
            <button
              key={ing.id}
              onClick={() => onPick(ing.id)}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
              style={{
                background: isCurrent ? CATEGORY_COLORS[ing.category] : CATEGORY_COLORS[ing.category] + '15',
                color: isCurrent ? 'white' : CATEGORY_COLORS[ing.category],
                boxShadow: isCurrent ? `0 2px 0 ${CATEGORY_COLORS[ing.category]}80` : 'none',
              }}
            >
              {ing.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Ingredient selector dropdown component
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

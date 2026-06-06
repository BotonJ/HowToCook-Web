import { useState, useMemo, useCallback, useEffect } from 'react';
import { INGREDIENTS, COOCCURRENCE_PAIRS, SURPRISE_PAIRS, CATEGORY_COLORS, type Ingredient } from '../data/ingredients';

interface FlavorWheelProps {
  selectedId?: string;
  onSelect?: (id: string) => void;
  size?: number;
}

interface NodePosition extends Ingredient {
  x: number;
  y: number;
  radius: number;
  isCenter: boolean;
  isConnected: boolean;
  isBridge: boolean;
  pmi?: number;
  bridgeExplanation?: string;
}

/**
 * Focus-mode flavor wheel:
 * - Selected ingredient is centered and enlarged
 * - Direct pairing partners orbit in inner ring
 * - Flavor bridges orbit in outer ring
 * - Unrelated ingredients are hidden
 * - Supports zoom and pan
 */
export function FlavorWheel({ selectedId, onSelect, size = 600 }: FlavorWheelProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    explanation: string;
  }>({ visible: false, x: 0, y: 0, title: '', explanation: '' });

  const cx = size / 2;
  const cy = size / 2;
  const baseOrbitR = size * 0.32;
  const bridgeOrbitR = size * 0.52;
  const centerRadius = 32;

  // Find related pairs for selected ingredient
  const relatedPairs = useMemo(() => {
    if (!selectedId) return [];
    return COOCCURRENCE_PAIRS
      .filter(p => p.a === selectedId || p.b === selectedId)
      .sort((a, b) => b.pmi - a.pmi)
      .slice(0, 10);
  }, [selectedId]);

  const connectedIds = useMemo(() => {
    return new Set(relatedPairs.map(p => p.a === selectedId ? p.b : p.a));
  }, [relatedPairs, selectedId]);

  // Find flavor bridges
  const bridgePairs = useMemo(() => {
    if (!selectedId) return [];
    return SURPRISE_PAIRS
      .filter(p => (p.a === selectedId || p.b === selectedId) && p.semanticSim > 0.55 && p.pmi < 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [selectedId]);


  const positions = useMemo((): NodePosition[] => {
    if (!selectedId) return [];

    const selected = INGREDIENTS.find(i => i.id === selectedId);
    if (!selected) return [];

    const result: NodePosition[] = [];

    // Center node
    result.push({
      ...selected,
      x: cx + pan.x,
      y: cy + pan.y,
      radius: centerRadius * Math.min(zoom, 1.4),
      isCenter: true,
      isConnected: false,
      isBridge: false,
    });

    // Connected nodes arranged by PMI (strongest at top, clockwise)
    const orbitR = baseOrbitR * zoom;
    relatedPairs.forEach((pair, i) => {
      const otherId = pair.a === selectedId ? pair.b : pair.a;
      const other = INGREDIENTS.find(ing => ing.id === otherId);
      if (!other) return;

      const intensity = Object.values(other.flavor).reduce((s, v) => s + v, 0) / 6;
      const angle = (-Math.PI / 2) + (i * 0.55);
      const r = orbitR * (0.9 + intensity * 0.15);

      result.push({
        ...other,
        x: cx + pan.x + r * Math.cos(angle),
        y: cy + pan.y + r * Math.sin(angle),
        radius: (10 + intensity * 10) * Math.min(zoom, 1.3),
        isCenter: false,
        isConnected: true,
        isBridge: false,
        pmi: pair.pmi,
      });
    });

    // Bridge nodes on outer ring
    const bOrbitR = bridgeOrbitR * zoom;
    bridgePairs.forEach((pair, i) => {
      const otherId = pair.a === selectedId ? pair.b : pair.a;
      const other = INGREDIENTS.find(ing => ing.id === otherId);
      if (!other || connectedIds.has(otherId)) return;

      const intensity = Object.values(other.flavor).reduce((s, v) => s + v, 0) / 6;
      const angle = (Math.PI / 6) + (i * 1.1); // lower-right quadrant spread
      const r = bOrbitR * (0.85 + intensity * 0.2);

      result.push({
        ...other,
        x: cx + pan.x + r * Math.cos(angle),
        y: cy + pan.y + r * Math.sin(angle),
        radius: (8 + intensity * 8) * Math.min(zoom, 1.2),
        isCenter: false,
        isConnected: false,
        isBridge: true,
        bridgeExplanation: pair.explanation,
      });
    });

    return result;
  }, [selectedId, cx, cy, pan.x, pan.y, zoom, relatedPairs, bridgePairs, connectedIds]);

  const centerNode = positions.find(p => p.isCenter);

  // Auto-fit: when selected ingredient changes, compute zoom/pan so all nodes fit in view
  useEffect(() => {
    if (positions.length === 0 || !selectedId) return;

    const padding = 60; // margin from viewport edge
    const availableW = size - padding * 2;
    const availableH = size - padding * 2;

    // Compute bounding box of all nodes (including their radii and labels)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of positions) {
      const r = p.radius + (p.isCenter ? 24 : 18);
      minX = Math.min(minX, p.x - r);
      maxX = Math.max(maxX, p.x + r);
      minY = Math.min(minY, p.y - r);
      maxY = Math.max(maxY, p.y + r);
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) return;

    const scaleX = availableW / contentW;
    const scaleY = availableH / contentH;
    const newZoom = Math.min(scaleX, scaleY, 1.2) * 0.7; // default 70% to avoid oversized center node

    // Center the content
    const contentCx = (minX + maxX) / 2;
    const contentCy = (minY + maxY) / 2;
    const newPanX = cx - contentCx * newZoom;
    const newPanY = cy - contentCy * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [selectedId, size, cx, cy]);

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z * 1.2, 3)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z / 1.2, 0.5)), []);
  const handleReset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

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
    <div className="relative w-full h-full" style={{ minHeight: size }}>
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-sm font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
          title="放大"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-sm font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
          title="缩小"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-[10px] font-bold text-[#58413a] hover:bg-[#f5ece7] transition"
          title="重置"
        >
          ⌂
        </button>
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Subtle radial background */}
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8f5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff8f5" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx + pan.x} cy={cy + pan.y} r={baseOrbitR * zoom * 1.4} fill="url(#centerGlow)" />

        {/* Inner orbit ring */}
        <circle
          cx={cx + pan.x}
          cy={cy + pan.y}
          r={baseOrbitR * zoom}
          fill="none"
          stroke="#e0c0b5"
          strokeWidth={0.5}
          strokeDasharray="4 6"
          opacity={0.35}
        />

        {/* Outer orbit ring for bridges */}
        {bridgePairs.length > 0 && (
          <circle
            cx={cx + pan.x}
            cy={cy + pan.y}
            r={bridgeOrbitR * zoom}
            fill="none"
            stroke="#e0c0b5"
            strokeWidth={0.5}
            strokeDasharray="2 8"
            opacity={0.25}
          />
        )}

        {/* Connection lines from center to connected nodes */}
        {centerNode && positions.filter(p => p.isConnected).map(p => (
          <line
            key={`line-${p.id}`}
            x1={centerNode.x}
            y1={centerNode.y}
            x2={p.x}
            y2={p.y}
            stroke={CATEGORY_COLORS[p.category]}
            strokeWidth={Math.max(1.5, (p.pmi || 1) * 1.2 * Math.min(zoom, 1.5))}
            strokeOpacity={0.4}
            strokeLinecap="round"
          />
        ))}

        {/* Bridge dashed lines */}
        {centerNode && positions.filter(p => p.isBridge).map(p => (
          <line
            key={`bridge-${p.id}`}
            x1={centerNode.x}
            y1={centerNode.y}
            x2={p.x}
            y2={p.y}
            stroke="#8c7168"
            strokeWidth={1.5}
            strokeOpacity={0.25}
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        ))}

        {/* Nodes */}
        {positions.map(p => {
          const isCenter = p.isCenter;
          const isConnected = p.isConnected;
          const isBridge = p.isBridge;
          const isHovered = hoveredId === p.id;

          return (
            <g
              key={p.id}
              onClick={() => onSelect?.(p.id)}
              onMouseEnter={(e) => {
                setHoveredId(p.id);
                if (p.isBridge && p.bridgeExplanation) {
                  const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      visible: true,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      title: `${centerNode?.name ?? ''} × ${p.name}`,
                      explanation: p.bridgeExplanation,
                    });
                  }
                }
              }}
              onMouseMove={(e) => {
                if (p.isBridge && p.bridgeExplanation) {
                  const rect = (e.target as SVGElement).ownerSVGElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltip(prev => ({
                      ...prev,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    }));
                  }
                }
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setTooltip(prev => ({ ...prev, visible: false }));
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Center glow ring */}
              {isCenter && (
                <>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.radius + 20}
                    fill={CATEGORY_COLORS[p.category]}
                    fillOpacity={0.1}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.radius + 10}
                    fill="none"
                    stroke={CATEGORY_COLORS[p.category]}
                    strokeWidth={2.5}
                    strokeOpacity={0.35}
                  />
                </>
              )}

              {/* Connected node ring */}
              {isConnected && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.radius + 5}
                  fill="none"
                  stroke={CATEGORY_COLORS[p.category]}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeOpacity={isHovered ? 0.8 : 0.45}
                />
              )}

              {/* Bridge node ring */}
              {isBridge && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.radius + 4}
                  fill="none"
                  stroke="#8c7168"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  strokeOpacity={0.4}
                />
              )}

              {/* Main dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? p.radius * 1.15 : p.radius}
                fill={CATEGORY_COLORS[p.category]}
                stroke="white"
                strokeWidth={isCenter ? 3.5 : 2}
                opacity={isBridge ? 0.85 : 1}
              />

              {/* Label */}
              <text
                x={p.x}
                y={p.y + p.radius + (isCenter ? 24 : 16)}
                textAnchor="middle"
                fontSize={isCenter ? 18 : isConnected ? 13 : 11}
                fontWeight={isCenter ? 700 : isConnected ? 600 : 500}
                fill={isCenter ? '#2c2825' : isConnected ? '#58413a' : '#8c7168'}
                fontFamily="Quicksand, 'PingFang SC', sans-serif"
              >
                {p.name}
              </text>

              {/* PMI label for connected nodes */}
              {isConnected && p.pmi && (
                <text
                  x={p.x}
                  y={p.y - p.radius - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={CATEGORY_COLORS[p.category]}
                  opacity={0.85}
                >
                  PMI {p.pmi.toFixed(1)}
                </text>
              )}

              {/* Bridge label */}
              {isBridge && (
                <text
                  x={p.x}
                  y={p.y - p.radius - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={500}
                  fill="#8c7168"
                  opacity={0.7}
                >
                  风味桥接
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip for bridge nodes */}
      {tooltip.visible && (
        <div
          className="absolute z-30 max-w-[220px] bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg border border-[#e0c0b5]/40 pointer-events-none"
          style={{
            left: Math.min(tooltip.x + 16, size - 236),
            top: Math.min(tooltip.y + 16, size - 120),
          }}
        >
          <div className="text-xs font-bold text-[#58413a] mb-1">{tooltip.title}</div>
          <div className="text-[11px] text-[#58413a] leading-relaxed">{tooltip.explanation}</div>
          <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white/95 rotate-45 border-t border-l border-[#e0c0b5]/40" />
        </div>
      )}
    </div>
  );
}

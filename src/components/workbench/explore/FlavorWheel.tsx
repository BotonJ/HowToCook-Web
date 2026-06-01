import { useState, useMemo, useCallback } from 'react';
import type { PairingResult } from '@/lib/epicure/types';

interface FlavorWheelProps {
  ingredient: string;
  getNearestNeighbors: (ingredient: string, k: number) => PairingResult[];
  zhMap: Record<string, string>;
  onSelect?: (ingredient: string) => void;
}

const CX = 300;
const CY = 300;
const R = 240;
const CENTER_R = 48;
const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);

function getEmoji(name: string): string {
  const map: Record<string, string> = {
    chicken: '🐔', pork: '🐷', beef: '🥩', egg: '🥚', tofu: '🧈',
    tomato: '🍅', potato: '🥔', carrot: '🥕', cabbage: '🥬', eggplant: '🍆',
    bell_pepper: '🫑', shrimp: '🦐', garlic: '🧄', ginger: '🫚', onion: '🧅',
    fish: '🐟', salmon: '🐟', tuna: '🐟', rice: '🍚', noodle: '🍜',
    mushroom: '🍄', shiitake_mushroom: '🍄', corn: '🌽', cucumber: '🥒',
    lemon: '🍋', lime: '🍋', orange: '🍊', apple: '🍎', banana: '🍌',
    cheese: '🧀', butter: '🧈', milk: '🥛', cream: '🥛', yogurt: '🥛',
    honey: '🍯', sugar: '🍬', salt: '🧂', pepper: '🌶️', chili_pepper: '🌶️',
    wine: '🍷', vinegar: '🍶', soy_sauce: '🍶', sesame_oil: '🍶',
  };
  return map[name] || '•';
}

export function FlavorWheel({ ingredient, getNearestNeighbors, zhMap, onSelect }: FlavorWheelProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const pairings = useMemo(() => {
    return getNearestNeighbors(ingredient, 9);
  }, [ingredient, getNearestNeighbors]);

  const centerZh = zhMap[ingredient] || ingredient.replace(/_/g, ' ');
  const centerEmoji = getEmoji(ingredient);

  const nodes = useMemo(() => {
    return pairings.map((p, i) => {
      const angle = GOLDEN_ANGLE * i - Math.PI / 2;
      const nodeR = 6 + p.score * 10;
      const innerLimit = CENTER_R + nodeR + 20;
      const outerLimit = R - nodeR - 20;
      const rankT = pairings.length > 1 ? i / (pairings.length - 1) : 0.5;
      const baseDist = outerLimit - rankT * (outerLimit - innerLimit) * 0.85;
      const dist = Math.max(innerLimit, Math.min(outerLimit, baseDist));
      return {
        ...p,
        x: CX + dist * Math.cos(angle),
        y: CY + dist * Math.sin(angle),
        r: nodeR,
        angle,
      };
    });
  }, [pairings]);

  const handleNodeEnter = useCallback((name: string) => setHovered(name), []);
  const handleNodeLeave = useCallback(() => setHovered(null), []);

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <h3 className="font-display text-headline-sm text-on-surface mb-4">
        {centerEmoji} {centerZh} 的风味圈
      </h3>
      <div className="relative mx-auto" style={{ maxWidth: 600 }}>
        <svg viewBox="0 0 600 600" className="w-full h-auto">
          <defs>
            <filter id="wheelShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Outer rings */}
          <circle cx={CX} cy={CY} r={R + 5} fill="none" stroke="#e1bfb5" strokeWidth={0.4} opacity={0.25} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e1bfb5" strokeWidth={0.8} opacity={0.5} />

          {/* Connection lines */}
          {nodes.map((n, idx) => {
            const isDimmed = hovered && hovered !== n.name;
            const isHighlighted = hovered === n.name;
            const w = 1.1 + n.score * 1.5;
            const opacity = isHighlighted ? 0.6 : isDimmed ? 0.03 : 0.15 + n.score * 0.22;
            const dx = n.x - CX;
            const dy = n.y - CY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const t1 = 0.28;
            const p1x = CX + dx * t1;
            const p1y = CY + dy * t1;
            const off1 = dist * 0.15;
            const cp1x = p1x + (-dy / dist) * off1;
            const cp1y = p1y + (dx / dist) * off1;
            const t2 = 0.72;
            const p2x = CX + dx * t2;
            const p2y = CY + dy * t2;
            const off2 = dist * 0.10;
            const cp2x = p2x + (dy / dist) * off2;
            const cp2y = p2y + (-dx / dist) * off2;

            return (
              <path
                key={`conn-${idx}`}
                d={`M${CX},${CY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${n.x},${n.y}`}
                fill="none"
                stroke="#ab3500"
                strokeWidth={w}
                opacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((n, idx) => {
            const isDimmed = hovered && hovered !== n.name;
            const isHighlighted = hovered === n.name;
            const fillOpacity = isHighlighted ? 0.7 : isDimmed ? 0.05 : 0.45;
            const strokeOpacity = isHighlighted ? 1 : isDimmed ? 0.3 : 0.6;
            const labelOpacity = isHighlighted ? 1 : isDimmed ? 0.2 : 1;

            // Label position: radially outward
            const dx = n.x - CX;
            const dy = n.y - CY;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const labelDist = n.r + 20;
            const lx = n.x + (dx / len) * labelDist;
            const ly = n.y + (dy / len) * labelDist;
            const anchor = Math.abs(dx) > Math.abs(dy) * 0.6 ? (dx > 0 ? 'start' : 'end') : 'middle';

            return (
              <g key={`node-${idx}`}>
                {/* Shadow */}
                <circle
                  cx={n.x}
                  cy={n.y + 2}
                  r={n.r * 1.2}
                  fill="#ab3500"
                  opacity={0.1}
                  style={{ pointerEvents: 'none', filter: 'url(#wheelShadow)' }}
                />
                {/* Glass node */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill="rgba(255,255,255,0.45)"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1.5}
                  fillOpacity={fillOpacity}
                  strokeOpacity={strokeOpacity}
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s, stroke-opacity 0.15s' }}
                  onMouseEnter={() => handleNodeEnter(n.name)}
                  onMouseLeave={handleNodeLeave}
                  onClick={() => onSelect?.(n.name)}
                />
                {/* Identity dot */}
                <circle cx={n.x} cy={n.y} r={3} fill="#ab3500" style={{ pointerEvents: 'none' }} />
                {/* Label */}
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="#ab3500"
                  fontSize={14}
                  fontWeight={700}
                  letterSpacing="0.02em"
                  opacity={labelOpacity}
                  style={{ pointerEvents: 'none', transition: 'opacity 0.15s' }}
                >
                  {n.nameZh || n.name.replace(/_/g, ' ')}
                </text>
                {/* Score */}
                <text
                  x={lx}
                  y={ly + 17}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="#8d7168"
                  fontSize={11}
                  fontWeight={600}
                  opacity={labelOpacity}
                  style={{ pointerEvents: 'none', transition: 'opacity 0.15s' }}
                >
                  {(n.score * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Center */}
          <circle
            cx={CX}
            cy={CY}
            r={CENTER_R + 4}
            fill="#fbf9f8"
            stroke="#e1bfb5"
            strokeWidth={1}
            style={{ pointerEvents: 'none' }}
          />
          <circle
            cx={CX}
            cy={CY}
            r={CENTER_R}
            fill="#fbf9f8"
            stroke="#ab3500"
            strokeWidth={2.5}
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={CX}
            y={CY - 8}
            textAnchor="middle"
            fill="#ab3500"
            fontSize={28}
            style={{ pointerEvents: 'none' }}
          >
            {centerEmoji}
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            fill="#ab3500"
            fontSize={14}
            fontWeight={700}
            style={{ pointerEvents: 'none' }}
          >
            {centerZh}
          </text>
        </svg>
      </div>
    </div>
  );
}

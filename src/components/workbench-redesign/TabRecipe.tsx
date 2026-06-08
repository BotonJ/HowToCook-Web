import { useState, useEffect } from 'react';
import {
  MOCK_RECIPES,
  MOCK_SYNTHESIS_DATA,
  MOCK_EVALUATION_TEXT,
  type Recipe,
} from './mockData';
import { T } from './designTokens';

// ─── Radar Chart (SVG) ───────────────────────────────────────────────────────

const AXES = [
  { key: 'umami', label: '鲜', angle: -90 },
  { key: 'sweet', label: '甜', angle: -30 },
  { key: 'sour', label: '酸', angle: 30 },
  { key: 'fatty', label: '脂肪', angle: 90 },
  { key: 'bitter', label: '苦', angle: 150 },
  { key: 'spicy', label: '辣', angle: 210 },
] as const;

const CX = 200;
const CY = 200;
const R_MAX = 150;

function polarToCartesian(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function FlavorRadar({ data }: { data: typeof MOCK_SYNTHESIS_DATA }) {
  const points = AXES.map(({ key, angle }) => {
    const value = data[key] / 10;
    return polarToCartesian(angle, value * R_MAX);
  });
  const pointsStr = points.map(([x, y]) => `${x},${y}`).join(' ');

  const gridPolygons = [0.33, 0.66, 1.0].map((level) => {
    const pts = AXES.map(({ angle }) => {
      const [x, y] = polarToCartesian(angle, level * R_MAX);
      return `${x},${y}`;
    }).join(' ');
    return pts;
  });

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto">
      <svg className="w-full h-full" viewBox={`0 0 ${CX * 2} ${CY * 2}`} role="img" aria-label="风味协同雷达图">
        {/* Grid polygons */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={i}
            fill="none"
            points={pts}
            stroke={T.border}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        ))}

        {/* Spokes */}
        {AXES.map(({ angle, key }) => {
          const [x, y] = polarToCartesian(angle, R_MAX);
          return (
            <line
              key={key}
              stroke={T.border}
              strokeOpacity={0.3}
              strokeWidth={1}
              x1={CX}
              x2={x}
              y1={CY}
              y2={y}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          fill={T.primary}
          fillOpacity={0.15}
          points={pointsStr}
          stroke={T.primary}
          strokeLinejoin="round"
          strokeWidth={2}
        />

        {/* Axis labels */}
        {AXES.map(({ angle, label, key }) => {
          const [x, y] = polarToCartesian(angle, R_MAX + 24);
          return (
            <text
              key={key}
              fill={T.text}
              fontSize={12}
              fontWeight={700}
              textAnchor="middle"
              x={x}
              y={y + 4}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <button
      aria-label={`菜谱: ${recipe.title}`}
      className="bg-white rounded-lg cursor-pointer flex flex-col overflow-hidden border-2 text-left"
      style={{
        borderColor: T.border,
        boxShadow: `0 4px 0 ${T.border}`,
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div
        className="h-48 w-full flex items-center justify-center"
        style={{ background: T.bg }}
      >
        <span className="text-5xl">🍗</span>
      </div>
      <div className="p-6 flex flex-col grow">
        <h3 className="text-xl font-bold mb-2" style={{ color: T.text }}>
          {recipe.title}
        </h3>
        <div className="flex gap-4 text-sm mb-4" style={{ color: T.muted }}>
          <span>鲜 {recipe.鲜}</span>
          <span>脂 {recipe.脂}</span>
        </div>
        <div className="flex gap-2 mt-auto flex-wrap">
          {recipe.ingredients.map((ing) => (
            <span
              key={ing}
              className="px-3 py-1 rounded-full text-xs font-bold border"
              style={{
                background: T.bg,
                borderColor: T.border,
                color: T.primary,
              }}
            >
              {ing}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ─── Typewriter Effect ──────────────────────────────────────────────────────

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');

  // Simple character-by-character reveal
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="text-lg leading-relaxed" style={{ color: T.text }}>
      {displayed}
      <span className="inline-block w-0.5 h-5 ml-1 animate-pulse" style={{ background: T.primary }} />
    </p>
  );
}

// ─── TabRecipe ───────────────────────────────────────────────────────────────

export function TabRecipe() {
  const [synthesisMode, setSynthesisMode] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: T.text }}>
            {synthesisMode ? '风味合成' : '菜谱发现'}
          </h1>
          <p style={{ color: T.muted }}>
            {synthesisMode
              ? '分析多维协同效应'
              : '选择更多食材以发现合成模式'}
          </p>
        </div>
        {synthesisMode && (
          <button
            onClick={() => setSynthesisMode(false)}
            className="px-6 py-2 rounded-full border-2 font-bold flex items-center gap-2 transition-all"
            style={{
              borderColor: T.border,
              color: T.text,
              boxShadow: `0 4px 0 ${T.muted}`,
            }}
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
            重置
          </button>
        )}
      </div>

      {!synthesisMode ? (
        /* Recipe Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_RECIPES.map((r) => (
            <RecipeCard key={r.title} recipe={r} />
          ))}
          {/* Add card to trigger synthesis */}
          <button
            onClick={() => setSynthesisMode(true)}
            className="rounded-lg flex flex-col items-center justify-center p-8 border-2 border-dashed min-h-[300px] transition-all hover:border-primary"
            style={{ borderColor: T.border, background: T.bg }}
          >
            <span className="material-symbols-outlined text-4xl mb-4" style={{ color: T.muted }} aria-hidden="true">experiment</span>
            <p className="text-center font-bold" style={{ color: T.muted }}>
              添加食材进入合成模式
            </p>
          </button>
        </div>
      ) : (
        /* Synthesis Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Radar */}
          <div
            className="bg-white rounded-xl p-8 border-2 flex flex-col items-center justify-center min-h-[500px]"
            style={{ borderColor: T.border, boxShadow: `0 12px 32px rgba(44,40,37,0.08)` }}
          >
            <h3 className="font-bold text-xl mb-6 w-full text-left" style={{ color: T.text }}>
              协同图谱
            </h3>
            <FlavorRadar data={MOCK_SYNTHESIS_DATA} />
          </div>

          {/* Right: AI Evaluation */}
          <div
            className="bg-white rounded-xl p-8 border-2 flex flex-col"
            style={{ borderColor: T.border, boxShadow: `0 12px 32px rgba(44,40,37,0.08)` }}
          >
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2" style={{ borderColor: T.border }}>
              <div
                className="size-10 rounded-full flex items-center justify-center"
                style={{ background: `${T.primary}10`, color: T.primary }}
              >
                <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
              </div>
              <h3 className="font-bold text-xl" style={{ color: T.text }}>
                AI 风味评价
              </h3>
            </div>
            <div className="flex-grow">
              <TypewriterText text={MOCK_EVALUATION_TEXT} />
            </div>
            <div className="mt-8 pt-6 border-t-2 flex justify-end" style={{ borderColor: T.border }}>
              <button
                className="px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 text-white"
                style={{
                  background: T.primary,
                  boxShadow: `0 4px 0 ${T.muted}`,
                }}
              >
                保存画像
                <span className="material-symbols-outlined text-base" aria-hidden="true">bookmark_add</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useWorkbenchV2 } from './WorkbenchV2Context';
import { useWorkbenchV2Data } from './useWorkbenchV2Data';
import type { FlavorProfile } from '@/lib/epicure/types';
import type { FlavorVector } from '@/lib/epicure/types';
import type { Neighbor } from './mockData';
import { T } from './designTokens';

// ─── Flavor Bar ─────────────────────────────────────────────────────────────

const FLAVOR_LABELS: (keyof FlavorVector)[] = ['sweet', 'sour', 'bitter', 'umami', 'spicy', 'fatty'];
const FLAVOR_LABELS_ZH: Record<keyof FlavorVector, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  umami: '鲜',
  spicy: '辣',
  fatty: '脂肪',
};

function FlavorBars({ profile }: { profile: FlavorProfile | null }) {
  if (!profile) {
    return (
      <div className="space-y-4 opacity-50">
        {FLAVOR_LABELS.map((dim) => (
          <div key={dim}>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span>{FLAVOR_LABELS_ZH[dim]}</span>
              <span style={{ color: T.primary, opacity: 0.8 }}>—</span>
            </div>
            <div className="w-full rounded-full h-3" style={{ background: T.border }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {FLAVOR_LABELS.map((dim) => (
        <div key={dim}>
          <div className="flex justify-between text-sm font-semibold mb-1">
            <span>{FLAVOR_LABELS_ZH[dim]}</span>
            <span style={{ color: T.primary, opacity: 0.8 }}>{profile[dim]}</span>
          </div>
          <div className="w-full rounded-full h-3" style={{ background: T.border }}>
            <div
              className="h-3 rounded-full"
              style={{
                background: T.primary,
                width: `${(profile[dim] / 10) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Flavor Wheel SVG ────────────────────────────────────────────────────────

const WHEEL_SIZE = 400;
const CX = WHEEL_SIZE / 2;
const CY = WHEEL_SIZE / 2;
const R_CENTER = 32;
const R_OUTER_BASE = 150;

function goldenAngle(i: number, total: number): number {
  return (i * 137.508) * (Math.PI / 180);
}

function FlavorWheel({ neighbors, selectedZh }: { neighbors: Neighbor[]; selectedZh: string }) {
  return (
    <svg
      role="img"
      aria-label={`${selectedZh} 的风味关系轮图，显示最相似的食材`}
      overflow="visible"
      height={WHEEL_SIZE}
      viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
      width={WHEEL_SIZE}
    >
      {/* Guide circles */}
      {[50, 100, 150].map((r) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          fill="none"
          r={r}
          stroke={T.border}
          strokeDasharray="4 4"
          strokeOpacity={0.5}
          strokeWidth={2}
        />
      ))}

      {/* Center node */}
      <g>
        <circle cx={CX} cy={CY} fill={T.primary} r={R_CENTER} />
        <text
          dominantBaseline="middle"
          fill="#fff"
          fontSize={12}
          fontWeight={700}
          textAnchor="middle"
          x={CX}
          y={CY}
        >
          {selectedZh}
        </text>
      </g>

      {/* Satellite nodes */}
      {neighbors.map((n, i) => {
        const angle = goldenAngle(i, neighbors.length);
        const r = R_OUTER_BASE;
        const x = CX + r * Math.cos(angle - Math.PI / 2);
        const y = CY + r * Math.sin(angle - Math.PI / 2);
        const nodeR = 14 + n.score * 12;

        return (
          <g key={n.name}>
            {/* Connecting line */}
            <line stroke={T.primary} strokeOpacity={0.3} strokeWidth={2} x1={CX} x2={x} y1={CY} y2={y} />
            {/* Node */}
            <g>
              <circle
                cx={x}
                cy={y}
                fill={T.bg}
                r={nodeR}
                stroke={T.primary}
                strokeWidth={3}
              />
              <text
                fill={T.text}
                fontSize={10}
                fontWeight={600}
                textAnchor="middle"
                x={x}
                y={y + nodeR + 14}
              >
                {n.name}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SLERP Lab ───────────────────────────────────────────────────────────────

function SlerpLab({
  expanded,
  onToggle,
  slerpResults,
  selectedZh,
}: {
  expanded: boolean;
  onToggle: () => void;
  slerpResults: ReturnType<typeof useWorkbenchV2Data>['slerpResults'];
  selectedZh: string;
}) {
  const [t, setT] = useState(80); // 0–100

  const tInt = ([0, 30, 60, 90] as const)[Math.min(Math.round(t / 25), 3)];
  const key = `${tInt}°`;
  const current = slerpResults.find((r) => r.angle === key) ?? slerpResults[0];

  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{
        boxShadow: `0 12px 32px rgba(44,40,37,0.08)`,
        borderTop: `8px solid ${T.primary}`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: T.primary }} aria-hidden="true">science</span>
          SLERP Lab
        </h3>
        <button
          onClick={onToggle}
          className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>
      </div>

      {expanded && (
        <>
          <p className="text-sm opacity-70 mb-6 leading-relaxed">
            在风味向量空间中插值，找到两种食材之间的桥梁。
          </p>

          <div
            className="rounded-lg p-5 mb-4"
            style={{ background: T.bg, border: `1px solid ${T.border}` }}
          >
            <div className="flex justify-between items-end mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold opacity-50 uppercase">向量 A</span>
                <span className="font-bold" style={{ color: T.primary }}>{selectedZh}</span>
              </div>
              <div
                className="text-lg font-bold px-3 py-1 rounded-full bg-white"
                style={{ boxShadow: `0 4px 0 ${T.border}` }}
              >
                {t}% <span className="opacity-30">|</span> {100 - t}%
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold opacity-50 uppercase">向量 B</span>
                <span className="font-bold">草莓</span>
              </div>
            </div>
            <input
              max={100}
              min={0}
              type="range"
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold opacity-50 uppercase mb-2">合成结果</p>
            {current?.items.map((item) => (
              <div
                key={item}
                className="px-4 py-2 rounded-lg bg-white text-sm font-semibold"
                style={{ boxShadow: `0 4px 0 ${T.border}` }}
              >
                {item}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quick Substitutes (no scenario needed — "买不到" quick swap) ──────────

function QuickSubstitutes() {
  const subs = [
    ['鸡胸', '鸡腿'],
    ['新鲜鸡肉', '冷冻鸡肉'],
  ];

  return (
    <div>
      <h3 className="text-sm font-bold opacity-60 uppercase tracking-wide mb-3 pl-2">买不到？试试</h3>
      <div className="flex flex-wrap gap-2">
        {subs.map(([from, to]) => (
          <button
            key={from}
            className="bg-white px-4 py-2 rounded-full text-sm font-semibold border border-transparent hover:border-primary transition-colors"
            style={{ boxShadow: `0 4px 0 ${T.muted}` }}
          >
            {from} → {to}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TabOverview ─────────────────────────────────────────────────────────────

export function TabOverview() {
  const { slerpExpanded, toggleSlerp, selectedIngredient } = useWorkbenchV2();
  const { flavorProfile, neighbors, slerpResults } = useWorkbenchV2Data(selectedIngredient);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: 6D profile + quick substitutes */}
      <div className="lg:col-span-3 space-y-8">
        <div
          className="bg-white rounded-xl p-6"
          style={{ boxShadow: `0 12px 32px rgba(44,40,37,0.08)` }}
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: T.primary }} aria-hidden="true">bar_chart</span>
            6D 风味画像
          </h3>
          <FlavorBars profile={flavorProfile} />
        </div>
        <QuickSubstitutes />
      </div>

      {/* Center: Flavor wheel */}
      <div
        className="lg:col-span-6 bg-white rounded-xl p-8 flex flex-col items-center justify-center min-h-[500px] relative"
        style={{ boxShadow: `0 12px 32px rgba(44,40,37,0.08)` }}
      >
        <div className="absolute top-6 left-6 text-sm font-bold opacity-50 flex items-center gap-1">
          <span className="material-symbols-outlined text-base" aria-hidden="true">info</span>
          节点大小 = PMI 相似度
        </div>
        <FlavorWheel neighbors={neighbors} selectedZh={selectedIngredient} />
      </div>

      {/* Right: SLERP Lab */}
      <div className="lg:col-span-3">
        <SlerpLab
          expanded={slerpExpanded}
          onToggle={toggleSlerp}
          slerpResults={slerpResults}
          selectedZh={selectedIngredient}
        />
      </div>
    </div>
  );
}

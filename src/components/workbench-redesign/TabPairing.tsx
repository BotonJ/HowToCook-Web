import { useState } from 'react';
import { useWorkbenchV2 } from './WorkbenchV2Context';
import { useWorkbenchV2Data } from './useWorkbenchV2Data';
import {
  MOCK_FLAVOR_BRIDGES,
  MOCK_SUBSTITUTES,
  type Scenario,
  type FlavorBridge,
} from './mockData';
import { T } from './designTokens';

const SCENARIO_LABELS: Record<Scenario, { label: string; emoji: string }> = {
  vegan: { label: '素食', emoji: '🌱' },
  keto: { label: '生酮', emoji: '🥩' },
  raw: { label: '生食', emoji:'🥬' },
  'low-fat': { label: '减脂', emoji:'🏃' },
};

// ─── Classic Pairing Item ─────────────────────────────────────────────────────

interface Pairing {
  emoji: string;
  name: string;
  pmi: number;
  compound: string;
}

function PairingItem({ pairing, selectedIngredient }: { pairing: Pairing; selectedIngredient: string }) {
  return (
    <div
      className="group flex items-center justify-between p-4 rounded-md cursor-pointer border border-transparent hover:border-primary/30 transition-all"
      style={{ background: T.bg }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform bg-white"
        >
          {pairing.emoji}
        </div>
        <div>
          <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>
            {selectedIngredient} + {pairing.name}
          </h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: T.muted }}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">science</span>
            {pairing.compound}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-2xl" style={{ color: T.primary }}>
          {pairing.pmi}
        </div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: T.muted }}>
          PMI Score
        </div>
      </div>
    </div>
  );
}

// ─── 3D Flip Card ────────────────────────────────────────────────────────────

function FlipCard({ bridge }: { bridge: FlavorBridge }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      className="perspective-container w-full h-full cursor-pointer"
      aria-label={`风味桥梁: ${bridge.pair}`}
      aria-pressed={flipped}
      onClick={() => setFlipped(!flipped)}
      style={{ textAlign: 'left' }}
    >
      <div
        className="flip-card-inner"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'none',
        }}
      >
        {/* Front */}
        <div
          className="flip-card-front"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            borderRadius: '1rem',
            background: 'white',
            boxShadow: `0 12px 32px rgba(44,40,37,0.08)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div className="text-5xl mb-4 drop-shadow-md">{bridge.emoji}</div>
          <h3 className="text-lg font-bold" style={{ color: T.text }}>
            {bridge.pair}
          </h3>
          <div className="mt-4 flex gap-1">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: T.primary, opacity: i * 0.2 }}
              />
            ))}
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '1rem',
            background: T.bg,
            border: `2px solid ${T.primary}`,
            boxShadow: `0 12px 32px rgba(44,40,37,0.08)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <span className="material-symbols-outlined text-4xl mb-3" style={{ color: T.primary }} aria-hidden="true">
            science
          </span>
          <h4 className="text-lg font-bold mb-2" style={{ color: T.text }}>
            {bridge.compound}
          </h4>
          <p className="text-sm mb-4" style={{ color: T.muted }}>
            {bridge.description}
          </p>
          <div
            className="px-4 py-2 rounded-full text-xs font-bold"
            style={{
              background: `${T.primary}10`,
              color: T.primary,
            }}
          >
            桥接强度: {bridge.strength}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Scenario Footer ─────────────────────────────────────────────────────────

function ScenarioFooter({ activeScenarios }: { activeScenarios: Set<Scenario> }) {
  if (activeScenarios.size === 0) return null;

  const activeList = Array.from(activeScenarios);
  const allSubs = activeList.flatMap((s) => MOCK_SUBSTITUTES[s] ?? []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t flex items-center justify-center"
      style={{ borderColor: T.border, boxShadow: `0 -4px 20px rgba(44,40,37,0.05)` }}
    >
      <div className="max-w-[1200px] w-full px-6 flex items-center gap-4">
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: T.muted }}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
          基于{' '}
          {activeList.map((s) => (
            <span key={s} style={{ color: SCENARIO_LABELS[s]?.label === '素食' ? T.vegan : T.keto }}>
              {SCENARIO_LABELS[s]?.emoji}
            </span>
          ))}
          {' '}标签的智能替代：
        </span>
        <div className="flex gap-3">
          {allSubs.slice(0, 4).map((sub) => (
            <div
              key={sub.replaces}
              className="px-4 py-2 rounded-full text-sm font-medium border"
              style={{
                background: T.bg,
                borderColor: T.border,
              }}
            >
              <span className="font-bold" style={{ color: T.keto }}>替代{sub.replaces}</span>
              <span className="material-symbols-outlined text-[14px] mx-1" style={{ color: T.muted }} aria-hidden="true">
                arrow_forward
              </span>
              <span>{sub.with}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TabPairing ───────────────────────────────────────────────────────────────

export function TabPairing() {
  const { activeScenarios, selectedIngredient } = useWorkbenchV2();
  const { cooccurrencePairs } = useWorkbenchV2Data(selectedIngredient);

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
        {/* Left: Classic Pairings */}
        <div
          className="bg-white rounded-lg overflow-hidden flex flex-col"
          style={{ boxShadow: `0 12px 32px rgba(44,40,37,0.08)`, border: `1px solid ${T.border}20` }}
        >
          <div
            className="p-6 border-b flex items-center justify-between"
            style={{ background: `${T.bg}80`, borderColor: `${T.muted}20` }}
          >
            <div>
              <h2 className="text-2xl font-bold" style={{ color: T.text }}>
                经典绝配
              </h2>
              <p className="text-sm mt-1" style={{ color: T.muted }}>基于风味数据挖掘出的高契合度经典搭配。</p>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: `${T.muted}10`, color: T.muted }}
            >
              高 PMI 组合
            </span>
          </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cooccurrencePairs.map((p) => (
              <PairingItem key={p.name} pairing={p} selectedIngredient={selectedIngredient} />
            ))}
          </div>
        </div>

        {/* Right: Flavor Bridges */}
        <div className="flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold" style={{ color: T.text }}>
                风味桥梁
              </h2>
              <span className="material-symbols-outlined animate-pulse" style={{ color: T.primary, fontSize: '24px' }} aria-hidden="true">
                hub
              </span>
            </div>
            <p className="text-sm" style={{ color: T.muted }}>令人意外的搭配。悬停卡片查看隐藏的化学联系。</p>
          </div>
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6">
            {MOCK_FLAVOR_BRIDGES.map((bridge) => (
              <div key={bridge.pair} style={{ minHeight: '200px' }}>
                <FlipCard bridge={bridge} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScenarioFooter activeScenarios={activeScenarios} />
    </div>
  );
}

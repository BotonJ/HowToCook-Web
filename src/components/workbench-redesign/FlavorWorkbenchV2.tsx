import { useState, useRef, useEffect } from 'react';
import { WorkbenchV2Provider, useWorkbenchV2, type TabId } from './WorkbenchV2Context';
import { TabOverview } from './TabOverview';
import { TabPairing } from './TabPairing';
import { TabRecipe } from './TabRecipe';
import { T } from './designTokens';

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: 'overview', label: '风味概览', emoji: '🎯' },
  { id: 'pairing', label: '搭配推荐', emoji: '🔗' },
  { id: 'recipe', label: '找菜谱', emoji: '📖' },
];

const SCENARIOS = [
  { id: 'vegan' as const, label: '素食', emoji: '🌱' },
  { id: 'keto' as const, label: '生酮', emoji: '🥩' },
  { id: 'raw' as const, label: 'Raw', emoji: '🥬' },
  { id: 'low-fat' as const, label: '减脂', emoji: '🏃' },
];

// ─── Scenario Toggle Button ───────────────────────────────────────────────────

function ScenarioChip({
  id,
  label,
  emoji,
  active,
  onClick,
}: {
  id: 'vegan' | 'keto' | 'raw' | 'low-fat';
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  const color = id === 'vegan' ? T.vegan : T.keto;
  return (
    <button
      onClick={onClick}
      className="h-8 px-4 rounded-full border-2 text-sm font-medium flex items-center gap-2 transition-all"
      style={{
        borderColor: active ? color : T.border,
        color: active ? color : T.muted,
        background: active ? `${color}10` : 'white',
        boxShadow: active ? 'none' : `0 4px 0 ${T.muted}`,
      }}
    >
      <span>{emoji}</span>
      <span className="font-bold">{label}</span>
    </button>
  );
}

// ─── Ingredient Search ────────────────────────────────────────────────────────

const QUICK_INGREDIENTS = [
  '鸡肉', '猪肉', '牛肉', '虾', '鱼', '豆腐', '鸡蛋', '蘑菇',
  '番茄', '大蒜', '洋葱', '生姜', '葱', '酱油', '柠檬',
  '草莓', '咖啡', '羊肉', '花椰菜', '土豆', '胡萝卜',
];

function IngredientSearch() {
  const { selectedIngredient, selectIngredient } = useWorkbenchV2();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = QUICK_INGREDIENTS.filter(
    (i) => !query || i.includes(query) || i.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white transition-all hover:border-primary"
        style={{ borderColor: T.border }}
      >
        <span className="text-xl">🍽️</span>
        <span className="font-bold" style={{ color: T.text }}>{selectedIngredient}</span>
        <span className="material-symbols-outlined text-sm" style={{ color: T.muted }} aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-lg border z-50"
          style={{ borderColor: T.border }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        >
          <div className="p-3 border-b" style={{ borderColor: T.border }}>
            <input
              autoFocus
              aria-label="搜索食材"
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: T.border, outline: 'none' }}
              placeholder="搜索食材..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div role="listbox" aria-label="食材列表" className="max-h-64 overflow-y-auto p-2 space-y-1">
            {filtered.map((name) => (
              <button
                key={name}
                role="option"
                aria-selected={name === selectedIngredient}
                onClick={() => {
                  selectIngredient(name);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/10 transition-colors"
                style={{
                  background: name === selectedIngredient ? `${T.primary}15` : 'transparent',
                  color: T.text,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Nav ─────────────────────────────────────────────────────────────────

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TABS[nextIndex];
    onTabChange(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  };

  return (
    <div role="tablist" aria-label="风味工作台标签页" className="flex gap-8 h-full items-end pb-4" onKeyDown={handleKeyDown}>
      {TABS.map(({ id, label, emoji }) => (
        <button
          key={id}
          id={`tab-${id}`}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`panel-${id}`}
          tabIndex={activeTab === id ? 0 : -1}
          onClick={() => onTabChange(id)}
          className="text-xl font-bold pb-2 transition-colors relative"
          style={{
            color: activeTab === id ? T.text : T.muted,
            borderBottom: activeTab === id ? `4px solid ${T.primary}` : '4px solid transparent',
            top: activeTab === id ? '2px' : '0',
          }}
        >
          <span className="mr-1">{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Inner Layout ────────────────────────────────────────────────────────────

function WorkbenchV2Inner() {
  const { activeTab, setTab, activeScenarios, toggleScenario } = useWorkbenchV2();

  return (
    <div className="min-h-screen" style={{ background: T.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b"
        style={{ borderColor: `${T.muted}20` }}
      >
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Left: Brand + Search + Scenarios */}
          <div className="flex items-center gap-6">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: T.text }}
            >
              主厨控制台
            </h1>
            <IngredientSearch />
            <div className="flex gap-2">
              {SCENARIOS.map(({ id, label, emoji }) => (
                <ScenarioChip
                  key={id}
                  id={id}
                  label={label}
                  emoji={emoji}
                  active={activeScenarios.has(id)}
                  onClick={() => toggleScenario(id)}
                />
              ))}
            </div>
          </div>

          {/* Right: Tab Nav */}
          <TabNav activeTab={activeTab} onTabChange={setTab} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <TabOverview />
          </div>
        )}
        {activeTab === 'pairing' && (
          <div role="tabpanel" id="panel-pairing" aria-labelledby="tab-pairing">
            <TabPairing />
          </div>
        )}
        {activeTab === 'recipe' && (
          <div role="tabpanel" id="panel-recipe" aria-labelledby="tab-recipe">
            <TabRecipe />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Exported Component ─────────────────────────────────────────────────────

export function FlavorWorkbenchV2() {
  return (
    <WorkbenchV2Provider>
      <WorkbenchV2Inner />
    </WorkbenchV2Provider>
  );
}

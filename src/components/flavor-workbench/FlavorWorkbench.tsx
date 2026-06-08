import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Handshake, UtensilsCrossed, TestTube } from 'lucide-react';
import { TabFlavorOverview } from './tabs/TabFlavorOverview';
import { TabPairing } from './tabs/TabPairing';
import { TabRecipes } from './tabs/TabRecipes';
import { TabSlerp } from './tabs/TabSlerp';
import { loadWorkbenchData, isWorkbenchDataLoaded } from './data/ingredients';
import { loadHowToCookRecipes, isHowToCookRecipesLoaded } from './data/recipe-loader';
// c3v2 loader — kept for future tab use (currently ~11MB, skipped in loadAll)
import { loadC3V2Data, isC3V2Loaded } from './data/c3v2-loader';
void loadC3V2Data; void isC3V2Loaded;

type Tab = 'overview' | 'pairing' | 'recipes' | 'slerp';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '概览', icon: <FlaskConical size={16} /> },
  { key: 'pairing', label: '搭配', icon: <Handshake size={16} /> },
  { key: 'recipes', label: '菜谱', icon: <UtensilsCrossed size={16} /> },
  { key: 'slerp', label: '实验室', icon: <TestTube size={16} /> },
];

export function FlavorWorkbench() {
  const [tab, setTab] = useState<Tab>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadAll() {
      if (!isWorkbenchDataLoaded()) {
        await loadWorkbenchData();
      }
      if (!isHowToCookRecipesLoaded()) {
        await loadHowToCookRecipes();
      }
      // c3v2 embeddings: not yet used by any tab, skip loading to save ~11MB bandwidth
      // if (!isC3V2Loaded()) {
      //   try { await loadC3V2Data(); } catch { /* optional */ }
      // }
      setReady(true);
    }
    loadAll();
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20 text-[#8c7168]">
        <div className="animate-pulse flex items-center gap-3">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#ae3a04] border-t-transparent" />
          加载风味数据中...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff8f5' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fff8f5]/80 backdrop-blur-sm border-b border-[#e0c0b5]">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-xs text-[#8c7168] hover:text-[#ae3a04] transition-colors">
            ← 返回首页
          </a>
          <h1 className="text-base font-bold text-[#ae3a04] flex items-center gap-2">
            <span>🔥</span> 风味工作台
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Tab bar */}
      <div className="sticky top-14 z-40 bg-[#fff8f5]/80 backdrop-blur-sm border-b border-[#e0c0b5]">
        <div className="max-w-[1200px] mx-auto px-4 flex">
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: active ? '#ae3a04' : '#8c7168' }}
              >
                {t.icon}
                {t.label}
                {active && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ae3a04] rounded-full"
                    layoutId="tab-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <main className="max-w-[1200px] mx-auto px-4 py-5 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'overview' && <TabFlavorOverview />}
            {tab === 'pairing' && <TabPairing />}
            {tab === 'recipes' && <TabRecipes />}
            {tab === 'slerp' && <TabSlerp />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

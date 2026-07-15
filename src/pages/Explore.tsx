import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { Layout } from '@/components/Layout';
import { FlavorUniverse } from '@/components/explore/FlavorUniverse';
import { CoreFlavorNetwork } from '@/components/explore/CoreFlavorNetwork';
import { TomatoEggCase } from '@/components/explore/TomatoEggCase';

export function Explore() {
  useMeta({
    title: '风味宇宙',
    description: '4,389 个中餐食材的风味地图，来自 180 万份菜谱的统计学习。',
    ogUrl: `${SITE_URL}/explore`,
  });

  return (
    <Layout>
      <div className="py-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 md:px-16 relative">
          <div className="max-w-4xl space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed/30 text-on-secondary-fixed text-label-sm uppercase tracking-widest border border-secondary-fixed">
              Experimental Lab
            </div>

            {/* Title */}
            <h1 className="font-display text-headline-xl text-primary leading-tight">
              风味宇宙
              <span className="block text-on-surface-variant/40 mt-2" style={{ fontWeight: 500 }}>Flavor Universe</span>
            </h1>

            {/* Description */}
            <p className="font-body text-body-md text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              基于 1,800,000 份真实食谱构建的宏大坐标系。我们解析了 4,389 种独特食材，并为每项成分定义了 300 维度的"风味指纹"，揭示跨越地域与文化的味觉深层联系。
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-16 pt-8">
              <div className="text-center min-w-[140px]">
                <span className="block font-display text-headline-lg text-secondary">4,389</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">食材条目</span>
              </div>
              <div className="h-12 w-px bg-outline-variant/50" />
              <div className="text-center min-w-[140px]">
                <span className="block font-display text-headline-lg text-secondary">300-Dim</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">风味指纹</span>
              </div>
              <div className="h-12 w-px bg-outline-variant/50" />
              <div className="text-center min-w-[140px]">
                <span className="block font-display text-headline-lg text-secondary">180万</span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">分析样本量</span>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-12 animate-bounce">
            <span className="material-symbols-outlined text-outline">expand_more</span>
          </div>
        </section>

        {/* ── Section 1: 风味宇宙 ──────────────────────────────── */}
        <FlavorUniverse />

        {/* ── Section 2: 姜葱蒜铁三角 ──────────────────────────── */}
        <CoreFlavorNetwork />

        {/* ── Section 3: 番茄鸡蛋 ──────────────────────────────── */}
        <TomatoEggCase />

        {/* ── CTA: 味觉坐标（预留）────────────────────────────── */}
        <section className="py-32 text-center">
          <h2 className="font-display text-headline-xl">你的味觉坐标在哪里？</h2>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="text-center py-12 border-t border-outline-variant mt-8">
          <p className="font-body text-body-sm text-on-surface-variant">
            数据来自自训练 zhongcan_v4e 模型 · 4,389 食材 · 597,670 搭配关系 · 180 万份菜谱
          </p>
        </footer>
      </div>
    </Layout>
  );
}

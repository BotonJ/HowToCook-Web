import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { Layout } from '@/components/Layout';
import { FlavorUniverse } from '@/components/explore/FlavorUniverse';
import { CoreFlavorNetwork } from '@/components/explore/CoreFlavorNetwork';
import { TomatoEggCase } from '@/components/explore/TomatoEggCase';

export function Explore() {
  useMeta({
    title: '风味宇宙',
    description: '4,389 个中餐食材的风味地图，来自 97 万份菜谱的统计学习。',
    ogUrl: `${SITE_URL}/explore`,
  });

  return (
    <Layout>
      <div className="py-8">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="text-center mb-16 px-4">
          <h1 className="font-display text-headline-xl text-on-surface tracking-tight mb-3">
            4,389 个中餐食材的风味宇宙
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            来自 97 万份菜谱的统计学习
          </p>
        </section>

        {/* ── Section 1: 风味宇宙 ──────────────────────────────── */}
        <FlavorUniverse />

        {/* ── Section 2: 姜葱蒜铁三角 ──────────────────────────── */}
        <CoreFlavorNetwork />

        {/* ── Section 3: 番茄鸡蛋 ──────────────────────────────── */}
        <TomatoEggCase />

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="text-center py-12 border-t border-outline-variant mt-8">
          <p className="font-body text-body-sm text-on-surface-variant">
            数据来自 zhongcan_v4e 模型 · 4,389 食材 · 597,670 搭配关系 · 97 万份菜谱
          </p>
        </footer>
      </div>
    </Layout>
  );
}

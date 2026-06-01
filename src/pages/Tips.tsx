import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import { BookOpen, Layers } from 'lucide-react';

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  overview: '概述',
  technique: '技法',
  equipment: '工具',
  ingredient: '食材',
  safety: '安全',
};

// Module-level cache — shared with TipDetail
let cachedAcademy: TipMeta[] | undefined;
let cachedTips: TipMeta[] | undefined;

async function loadAcademy(): Promise<TipMeta[]> {
  if (cachedAcademy) return cachedAcademy;
  const data: TipMeta[] = await fetch('/data/cooking-academy.json').then(r => r.json());
  cachedAcademy = data;
  return data;
}

async function loadTips(): Promise<TipMeta[]> {
  if (cachedTips) return cachedTips;
  const data: TipMeta[] = await fetch('/data/tips.json').then(r => r.json());
  cachedTips = data;
  return data;
}

// ── Academy Series Grid ───────────────────────────────────────────

function AcademySeries({ modules }: { modules: TipMeta[] }) {
  if (modules.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">最小厨房 MVK</h2>
        <span className="text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
          {modules.length} 模块
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        从零开始的厨房搭建指南 — 按顺序阅读，逐步构建你的最小厨房。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((mod, index) => (
          <motion.div
            key={mod.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
          >
            <Link
              to={`/academy/${mod.slug}`}
              className="block bg-surface-container-low rounded-xl p-5 hover:bg-surface-container transition-colors group h-full"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-display text-label-lg">
                  {index}
                </span>
                <span className="text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[mod.category] || mod.category}
                </span>
              </div>
              <h3 className="font-display text-headline-md text-on-surface mb-1 group-hover:text-primary transition-colors">
                {mod.title}
              </h3>
              <p className="font-body text-body-sm text-on-surface-variant line-clamp-2">
                {mod.summary}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Tips Articles Grid ────────────────────────────────────────────

function TipsArticles({ articles }: { articles: TipMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-tertiary" />
        <h2 className="font-display text-headline-lg text-on-surface">基础技法</h2>
        <span className="text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
          {articles.length} 篇
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        实用烹饪技巧与食品安全知识，随时查阅。
      </p>
      <div className="grid gap-3">
        {articles.map((tip, index) => (
          <motion.div
            key={tip.slug}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
          >
            <Link
              to={`/academy/${tip.slug}`}
              className="block bg-surface-container-low rounded-xl p-5 hover:bg-surface-container transition-colors group"
            >
              <div className="flex items-center gap-3 mb-1">
                <span className="text-label-sm text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[tip.category] || tip.category}
                </span>
              </div>
              <h3 className="font-display text-headline-md text-on-surface mb-1 group-hover:text-primary transition-colors">
                {tip.title}
              </h3>
              <p className="font-body text-body-sm text-on-surface-variant">
                {tip.summary}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export function Tips() {
  const t = useT();
  const [academyModules, setAcademyModules] = useState<TipMeta[]>([]);
  const [tipsArticles, setTipsArticles] = useState<TipMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useMeta({
    title: t.tips.metaTitle,
    description: t.tips.metaDesc,
    ogUrl: `${SITE_URL}/academy`,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadAcademy(), loadTips()])
      .then(([academy, tips]) => {
        if (!cancelled) {
          setAcademyModules(academy);
          setTipsArticles(tips);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="py-8 space-y-10 max-w-3xl">
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 space-y-10 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            {t.tips.title}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            {t.tips.subtitle}
          </p>
        </div>

        {/* MVK Series */}
        <AcademySeries modules={academyModules} />

        {/* Tips Articles */}
        <TipsArticles articles={tipsArticles} />
      </div>
    </Layout>
  );
}

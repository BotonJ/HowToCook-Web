import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import { Layers, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';

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

// ── Hero Section ─────────────────────────────────────────────────

function AcademyHero({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <section className="relative rounded-2xl overflow-hidden bg-surface-container-low min-h-[320px] md:min-h-[400px] flex flex-col items-center justify-center p-8 md:p-16 text-center shadow-ambient mb-16 md:mb-24">
      {/* Decorative gradient layers */}
      <div className="absolute inset-0 -z-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary-container/20 to-secondary-container/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-container/25 rounded-full blur-[100px]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent z-0" />

      <motion.div
        className="relative z-10 max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-block py-1 px-4 rounded-full bg-primary-container/50 text-on-primary-container text-label-sm mb-6 backdrop-blur-sm border border-primary-container/50">
          {t.tips.heroBadge}
        </span>
        <h1 className="font-display text-headline-xl text-primary mb-4 tracking-tight">
          {t.tips.title}
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
          {t.tips.heroSubtitle}
        </p>
      </motion.div>
    </section>
  );
}

// ── Featured Series: MVK ─────────────────────────────────────────

function FeaturedMVK({
  modules,
  t,
}: {
  modules: TipMeta[];
  t: ReturnType<typeof useT>;
}) {
  if (modules.length === 0) return null;

  return (
    <section className="mb-16 md:mb-24">
      <div className="mb-8">
        <h2 className="font-display text-headline-lg text-on-surface">
          {t.tips.featuredTitle}
        </h2>
        <p className="text-on-surface-variant text-body-lg mt-1">
          {t.tips.featuredSubtitle}
        </p>
      </div>

      <motion.div
        className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient border border-surface-container-low group"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col md:flex-row gap-0">
          {/* Gradient card — acts as cover image */}
          <div className="w-full md:w-1/2 relative overflow-hidden aspect-video md:aspect-auto md:min-h-[360px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-container/30 to-secondary-container/20 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/60 to-transparent" />
            {/* Decorative orb */}
            <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary-container/30 rounded-full blur-3xl" />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap size={64} className="text-primary/30" strokeWidth={1.5} />
            </div>
            {/* Badge */}
            <div className="absolute top-4 left-4 bg-secondary-container text-on-secondary-container text-label-sm py-1 px-3 rounded-full shadow-sm">
              Course
            </div>
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
            <div className="flex gap-2 mb-4">
              <Tag>{t.tips.beginner}</Tag>
              <Tag>{t.tips.modules(modules.length)}</Tag>
            </div>
            <h3 className="font-display text-headline-lg text-on-surface mb-3">
              最小厨房 MVK
            </h3>
            <p className="text-on-surface-variant text-body-lg mb-8 line-clamp-3">
              从零开始的厨房搭建指南 — 按顺序阅读，逐步构建你的最小厨房。
            </p>
            <Link to={`/academy/${modules[0].slug}`}>
              <Button variant="primary" size="md" className="self-start">
                {t.tips.startSeries}
                <ArrowRight size={18} className="ml-2 inline-block" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ── Bento Grid: 2 Categories ─────────────────────────────────────

function CategoryBento({
  modules,
  articles,
  t,
}: {
  modules: TipMeta[];
  articles: TipMeta[];
  t: ReturnType<typeof useT>;
}) {
  return (
    <section>
      <h2 className="font-display text-headline-lg text-on-surface mb-8">
        {t.tips.exploreTitle}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Category 1: MVK — Large (7 cols) */}
        <motion.div
          className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 shadow-ambient border border-surface-container-low flex flex-col h-full min-h-[320px] relative overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="font-display text-headline-md text-on-surface">最小厨房 MVK</h3>
              <span className="text-label-sm text-on-surface-variant">
                {t.tips.modules(modules.length)}
              </span>
            </div>
          </div>

          <p className="text-on-surface-variant text-body-md mb-6 relative z-10 max-w-md">
            从零开始的厨房搭建指南 — 按顺序阅读，逐步构建你的最小厨房。
          </p>

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
            {modules.slice(0, 4).map((mod, index) => (
              <Link
                key={mod.slug}
                to={`/academy/${mod.slug}`}
                className="bg-surface hover:bg-surface-container-low p-4 rounded-xl transition-colors border border-surface-container-low flex items-start gap-3 group"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-label-sm font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="text-label-sm text-on-surface font-bold mb-0.5 group-hover:text-primary transition-colors truncate">
                    {mod.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">
                    {mod.summary.replace(/\*\*/g, '').slice(0, 60)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {modules.length > 4 && (
            <p className="text-label-sm text-primary mt-4 relative z-10">
              +{modules.length - 4} more
            </p>
          )}
        </motion.div>

        {/* Category 2: Basics — Tall (5 cols) */}
        <motion.div
          className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-8 shadow-ambient border border-surface-container-low flex flex-col h-full min-h-[320px] relative overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-display text-headline-md text-on-surface">基础技法</h3>
              <span className="text-label-sm text-on-surface-variant">
                {t.tips.articles(articles.length)}
              </span>
            </div>
          </div>

          <p className="text-on-surface-variant text-body-md mb-6 relative z-10">
            实用烹饪技巧与食品安全知识，随时查阅。
          </p>

          <div className="flex flex-col gap-2 flex-grow relative z-10">
            {articles.map((tip) => (
              <Link
                key={tip.slug}
                to={`/academy/${tip.slug}`}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary-container transition-colors text-on-surface-variant group-hover:text-on-primary-container flex-shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-label-sm text-on-surface font-bold group-hover:text-primary transition-colors truncate">
                    {tip.title}
                  </h4>
                  <span className="text-[11px] text-on-surface-variant">
                    {CATEGORY_LABELS[tip.category] || tip.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
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
        <div className="py-8 space-y-10">
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Section 1: Hero ─────────────────────────────────────── */}
      <AcademyHero t={t} />

      {/* ── Section 2: Featured Series (MVK) ───────────────────── */}
      <FeaturedMVK modules={academyModules} t={t} />

      {/* ── Section 3: Bento Grid — 2 Categories ───────────────── */}
      <CategoryBento
        modules={academyModules}
        articles={tipsArticles}
        t={t}
      />
    </Layout>
  );
}

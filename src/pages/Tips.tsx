import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { BookOpen, Layers } from 'lucide-react';

import tipsData from '@/data/tips.json';
import cookingAcademyData from '@/data/cooking-academy.json';

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

const academyModules = cookingAcademyData as TipMeta[];
const tipsArticles = tipsData as TipMeta[];

const CATEGORY_LABELS: Record<string, string> = {
  overview: '概述',
  technique: '技法',
  equipment: '工具',
  ingredient: '食材',
  safety: '安全',
};

// ── Stats Dashboard (moved to About page) ────────────────────────

// ── Academy Series Grid ───────────────────────────────────────────

function AcademySeries() {
  if (academyModules.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">最小厨房 MVP</h2>
        <span className="text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
          {academyModules.length} 模块
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        从零开始的厨房搭建指南 — 按顺序阅读，逐步构建你的最小厨房。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {academyModules.map((mod, index) => (
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

function TipsArticles() {
  if (tipsArticles.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-tertiary" />
        <h2 className="font-display text-headline-lg text-on-surface">基础技法</h2>
        <span className="text-label-sm text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded-full">
          {tipsArticles.length} 篇
        </span>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        实用烹饪技巧与食品安全知识，随时查阅。
      </p>
      <div className="grid gap-3">
        {tipsArticles.map((tip, index) => (
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
  useMeta({
    title: 'Cooking Academy',
    description: 'Cooking basics, technique tutorials, kitchen tips — minimal kitchen MVP series and essential cooking techniques.',
    ogUrl: `${SITE_URL}/academy`,
  });

  return (
    <Layout>
      <div className="py-8 space-y-10 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Cooking Academy
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            厨房从零开始 — 系列教程 + 实用技法，持续建设中。
          </p>
        </div>

        {/* MVP Series */}
        <AcademySeries />

        {/* Tips Articles */}
        <TipsArticles />
      </div>
    </Layout>
  );
}

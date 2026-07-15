import { motion, useInView } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChefHat,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Animated Counter ──────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// ── About Stats Hook ──────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.howtocook.cn';

function useAboutStats() {
  const [recipeCount, setRecipeCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`${API_BASE}/categories`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setCategoryCount(data.total ?? data.categories?.length ?? 0)),
      fetch(`${API_BASE}/recipes?page=1&limit=1`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => setRecipeCount(data.pagination?.total ?? data.total ?? 0)),
    ]).catch(() => {});

    return () => controller.abort();
  }, []);

  return { recipeCount, categoryCount };
}

// ── Statistics ────────────────────────────────────────────────────

function StatsSection() {
  const t = useT();
  const { recipeCount, categoryCount } = useAboutStats();

  const STATS = [
    { label: t.about.stats.recipes, value: recipeCount, icon: ChefHat, color: 'text-primary' },
    { label: t.about.stats.categories, value: categoryCount, icon: Layers, color: 'text-tertiary' },
  ];

  return (
    <section className="mb-16">
      <h2 className="font-display text-headline-lg text-on-surface text-center mb-8">
        {t.about.statsTitle}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-lg mx-auto">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-surface-container-low rounded-2xl shadow-ambient p-6 text-center"
            >
              <Icon size={24} className={`mx-auto mb-3 ${stat.color}`} />
              <div className={`font-display text-headline-xl ${stat.color}`}>
                <AnimatedCounter target={stat.value} />
              </div>
              <p className="font-body text-body-sm text-on-surface-variant mt-1">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Content Roadmap ───────────────────────────────────────────────

type RoadmapStatus = 'ready' | 'building' | 'planned';

const ROADMAP_KEYS = ['techniqueTutorials', 'glossary', 'recipeLibrary', 'kitchenGuide', 'videoTutorials'] as const;
const ROADMAP_STATUS: RoadmapStatus[] = ['ready', 'building', 'building', 'planned', 'planned'];
const ROADMAP_PROGRESS = [100, 60, 30, 0, 0];

const STATUS_ICONS = {
  ready: CheckCircle2,
  building: Loader2,
  planned: Sparkles,
};

const STATUS_CLASSES = {
  ready: 'bg-primary/10 text-primary',
  building: 'bg-tertiary/10 text-tertiary',
  planned: 'bg-surface-container-highest text-on-surface-variant',
};

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const t = useT();
  const Icon = STATUS_ICONS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full ${STATUS_CLASSES[status]}`}>
      <Icon size={12} className={status === 'building' ? 'animate-spin' : ''} />
      {t.tips.status[status]}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
      <motion.div
        ref={ref}
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

function ContentRoadmap() {
  const t = useT();
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">{t.tips.contentRoadmap}</h2>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        {t.tips.roadmapIntro}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROADMAP_KEYS.map((key, i) => {
          const item = t.tips.roadmap[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-surface-container-low rounded-2xl shadow-ambient p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-headline-md text-on-surface">
                  {item.title}
                </h3>
                <StatusBadge status={ROADMAP_STATUS[i]} />
              </div>
              <p className="font-body text-body-sm text-on-surface-variant mb-3">
                {item.description}
              </p>
              <ProgressBar value={ROADMAP_PROGRESS[i]} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Changelog ─────────────────────────────────────────────────────

const CHANGELOG_KEYS = ['seoOptimization', 'academyFramework', 'mcpBanner', 'multiSource', 'searchFeature'] as const;
const CHANGELOG_DATES = ['2026-05-28', '2026-05-27', '2026-05-25', '2026-05-20', '2026-05-15'];

function Changelog() {
  const t = useT();
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">{t.tips.changelog}</h2>
      </div>
      <div className="space-y-4">
        {CHANGELOG_KEYS.map((key, i) => {
          const entry = t.tips.changelogEntries[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-surface-container-low rounded-2xl shadow-ambient p-5"
            >
              <time className="font-body text-label-sm text-primary">
                {CHANGELOG_DATES[i]}
              </time>
              <h3 className="font-display text-headline-md text-on-surface mt-1">
                {entry.title}
              </h3>
              <p className="font-body text-body-sm text-on-surface-variant mt-1">
                {entry.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export function About() {
  const t = useT();
  useMeta({
    title: t.about.metaTitle,
    description: t.about.metaDesc,
    ogUrl: `${SITE_URL}/about`,
  });

  return (
    <Layout>
      <div className="py-8">
        {/* ── Hero Section ───────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center mb-16">
          {/* Left: text content */}
          <div className="md:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-headline-xl text-on-surface tracking-tight mb-4"
            >
              {t.about.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-body text-body-lg text-on-surface-variant leading-relaxed mb-8"
            >
              {t.about.heroSubtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full text-label-lg font-semibold hover:brightness-95 shadow-sm active:scale-90 transition-all"
              >
                探索风味宇宙
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>

          {/* Right: decorative gradient card */}
          <motion.div
            className="md:col-span-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-ambient h-[320px] md:h-[440px]">
              {/* Multi-layer gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/40 via-surface-container to-secondary-container/20" />
              <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-1/3 left-1/4 w-32 h-32 bg-tertiary-container/30 rounded-full blur-2xl" />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                  <ChefHat size={40} className="text-primary/70" />
                </div>
              </div>

              {/* Bottom text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface/80 to-transparent">
                <p className="font-body text-body-sm text-on-surface-variant leading-relaxed">
                  {t.about.intro}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Statistics ──────────────────────────────────────────── */}
        <StatsSection />

        {/* ── Roadmap & Changelog Bento ───────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ContentRoadmap />
          </div>
          <div className="lg:col-span-1">
            <Changelog />
          </div>
        </section>
      </div>
    </Layout>
  );
}

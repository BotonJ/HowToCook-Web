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
  BookOpen,
  Layers,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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

// ── Stats Dashboard ───────────────────────────────────────────────

function StatsDashboard() {
  const t = useT();
  const STATS = [
    { label: t.tips.stats.recipes, value: 481, icon: ChefHat, color: 'text-primary' },
    { label: t.tips.stats.terms, value: 84, icon: BookOpen, color: 'text-tertiary' },
    { label: t.tips.stats.tutorials, value: 18, icon: Layers, color: 'text-secondary' },
    { label: t.tips.stats.upcoming, value: 15000, suffix: '', icon: TrendingUp, color: 'text-on-surface-variant' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-surface-container-low rounded-2xl p-5 text-center"
          >
            <Icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <div className={`font-display text-headline-lg ${stat.color}`}>
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            </div>
            <p className="font-body text-body-sm text-on-surface-variant mt-1">
              {stat.label}
            </p>
          </div>
        );
      })}
    </motion.div>
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">{t.tips.contentRoadmap}</h2>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        {t.tips.roadmapIntro}
      </p>
      <div className="grid gap-3">
        {ROADMAP_KEYS.map((key, i) => {
          const item = t.tips.roadmap[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-surface-container-low rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-1">
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">{t.tips.changelog}</h2>
      </div>
      <div className="relative pl-6 border-l-2 border-outline-variant space-y-6">
        {CHANGELOG_KEYS.map((key, i) => {
          const entry = t.tips.changelogEntries[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative"
            >
              {/* timeline dot */}
              <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-surface" />
              <div>
                <time className="font-body text-label-sm text-on-surface-variant">
                  {CHANGELOG_DATES[i]}
                </time>
                <h3 className="font-display text-headline-md text-on-surface mt-0.5">
                  {entry.title}
                </h3>
                <p className="font-body text-body-sm text-on-surface-variant mt-0.5">
                  {entry.description}
                </p>
              </div>
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
      <div className="py-8 space-y-10 max-w-3xl">
        <h1 className="font-display text-headline-xl text-on-surface">{t.about.title}</h1>

        <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
          {t.about.intro}
        </p>

        <div className="space-y-6 font-body text-body-md text-on-surface-variant leading-relaxed">
          <p>{t.about.description1}</p>
          <p>{t.about.description2}</p>
        </div>

        {/* Stats */}
        <StatsDashboard />

        {/* Roadmap */}
        <ContentRoadmap />

        {/* Changelog */}
        <Changelog />
      </div>
    </Layout>
  );
}

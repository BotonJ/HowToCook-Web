import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useRef } from 'react';

// ── Content Roadmap ───────────────────────────────────────────────

type RoadmapStatus = 'ready' | 'building' | 'planned';

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  progress: number;
  link?: string;
}

const ROADMAP: RoadmapItem[] = [
  {
    title: 'Technique Tutorials',
    description: 'Stir-fry, steam, boil, marinate, blanch... 18 basic technique articles are ready',
    status: 'ready',
    progress: 100,
  },
  {
    title: 'Terminology Dictionary',
    description: '84 bilingual cooking terms covering knife skills, heat control, and seasoning',
    status: 'building',
    progress: 60,
  },
  {
    title: '15K Recipe Library',
    description: 'Full integration of HowToCook open-source recipes, covering 17 major cuisines',
    status: 'building',
    progress: 30,
  },
  {
    title: 'Minimal Kitchen Guide',
    description: 'From pots and knives to food safety, a 14-module beginner\'s handbook',
    status: 'planned',
    progress: 0,
  },
  {
    title: 'Video Tutorials',
    description: 'Short video demos for key techniques, intuitive and easy to learn',
    status: 'planned',
    progress: 0,
  },
];

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ready: { label: 'Ready', icon: CheckCircle2, className: 'bg-primary/10 text-primary' },
  building: { label: 'Building', icon: Loader2, className: 'bg-tertiary/10 text-tertiary' },
  planned: { label: 'Planned', icon: Sparkles, className: 'bg-surface-container-highest text-on-surface-variant' },
};

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full ${config.className}`}>
      <Icon size={12} className={status === 'building' ? 'animate-spin' : ''} />
      {config.label}
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
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">Content Roadmap</h2>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        We are continuously building the content library. Here is the progress across all areas.
      </p>
      <div className="grid gap-3">
        {ROADMAP.map((item, i) => (
          <motion.div
            key={item.title}
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
              <StatusBadge status={item.status} />
            </div>
            <p className="font-body text-body-sm text-on-surface-variant mb-3">
              {item.description}
            </p>
            <ProgressBar value={item.progress} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Changelog ─────────────────────────────────────────────────────

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
}

const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-05-28',
    title: 'SEO Optimization Launched',
    description: 'Site-wide JSON-LD structured data, breadcrumb navigation, Open Graph tags complete.',
  },
  {
    date: '2026-05-27',
    title: 'Cooking Academy Framework Built',
    description: 'Added /tips route, TipDetail page, generate-tips data generation script.',
  },
  {
    date: '2026-05-25',
    title: 'MCP Banner Launched',
    description: 'Homepage added Claude Code Skill install guide with one-click copy.',
  },
  {
    date: '2026-05-20',
    title: 'Multi-Source Recipe Integration',
    description: 'Integrated Sui Bian Zuo and Jin Gu Yuan recipe data with source switching.',
  },
  {
    date: '2026-05-15',
    title: 'Search Feature Launched',
    description: 'API search + local fallback, supporting real-time keyword search.',
  },
];

function Changelog() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">Changelog</h2>
      </div>
      <div className="relative pl-6 border-l-2 border-outline-variant space-y-6">
        {CHANGELOG.map((entry, i) => (
          <motion.div
            key={entry.date}
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
                {entry.date}
              </time>
              <h3 className="font-display text-headline-md text-on-surface mt-0.5">
                {entry.title}
              </h3>
              <p className="font-body text-body-sm text-on-surface-variant mt-0.5">
                {entry.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export function About() {
  useMeta({
    title: 'About',
    description: 'HowToCook — AI-powered recipe platform with 500+ recipes across 17 cuisines, with MCP protocol support.',
    ogUrl: `${SITE_URL}/about`,
  });
  return (
    <Layout>
      <div className="py-8 space-y-10 max-w-3xl">
        <h1 className="font-display text-headline-xl text-on-surface">About HowToCook</h1>

        <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
          HowToCook is an AI-powered recipe platform providing precise, actionable cooking guides for everyone.
        </p>

        <div className="space-y-6 font-body text-body-md text-on-surface-variant leading-relaxed">
          <p>
            496 recipes across 17 major cuisines including Sichuan, Cantonese, Shandong, Hunan and more. Filter by difficulty, time, ingredients, and spice level. The preference learning system adapts to your taste over time.
          </p>
          <p>
            This site also provides MCP protocol interface, supporting AI assistants like Claude Code to directly access the recipe engine for smart recommendations and shopping list generation.
          </p>
        </div>

        {/* Roadmap */}
        <ContentRoadmap />

        {/* Changelog */}
        <Changelog />
      </div>
    </Layout>
  );
}

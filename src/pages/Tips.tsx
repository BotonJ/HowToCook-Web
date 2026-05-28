import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import {
  BookOpen,
  ChefHat,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

import tipsData from '@/data/tips.json';

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

const tips = tipsData as TipMeta[];

const CATEGORY_LABELS: Record<string, string> = {
  technique: '技法',
  equipment: '工具',
  ingredient: '食材',
  safety: '安全',
};

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
      // ease-out cubic
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

const STATS = [
  { label: '道菜谱', value: 481, icon: ChefHat, color: 'text-primary' },
  { label: '个术语', value: 84, icon: BookOpen, color: 'text-tertiary' },
  { label: '篇教程', value: 18, icon: Layers, color: 'text-secondary' },
  { label: '待上线', value: 15000, suffix: '', icon: TrendingUp, color: 'text-on-surface-variant' },
];

function StatsDashboard() {
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

interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  progress: number; // 0-100
  link?: string;
}

const ROADMAP: RoadmapItem[] = [
  {
    title: '技法教程',
    description: '炒、蒸、煮、腌、焯水… 18 篇基础技法文章已就绪',
    status: 'ready',
    progress: 100,
  },
  {
    title: '术语词典',
    description: '84 个中英对照烹饪术语，涵盖刀工、火候、调味',
    status: 'building',
    progress: 60,
  },
  {
    title: '15K 菜谱库',
    description: 'HowToCook 开源菜谱全量接入，覆盖 17 大菜系',
    status: 'building',
    progress: 30,
  },
  {
    title: '最小厨房指南',
    description: '从锅具刀具到食品安全，14 模块入门手册',
    status: 'planned',
    progress: 0,
  },
  {
    title: '视频教程',
    description: '关键技法配短视频演示，直观易学',
    status: 'planned',
    progress: 0,
  },
];

const STATUS_CONFIG: Record<RoadmapStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ready: { label: '已就绪', icon: CheckCircle2, className: 'bg-primary/10 text-primary' },
  building: { label: '建设中', icon: Loader2, className: 'bg-tertiary/10 text-tertiary' },
  planned: { label: '规划中', icon: Sparkles, className: 'bg-surface-container-highest text-on-surface-variant' },
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
  return (
    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
      <motion.div
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
        <h2 className="font-display text-headline-lg text-on-surface">内容路线图</h2>
      </div>
      <p className="font-body text-body-md text-on-surface-variant">
        我们正在持续建设内容库，以下是各方向的进展。
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
    title: 'SEO 优化上线',
    description: '全站 JSON-LD 结构化数据、面包屑导航、Open Graph 标签完善。',
  },
  {
    date: '2026-05-27',
    title: '烹饪学院框架搭建',
    description: '新增 /tips 路由、TipDetail 详情页、generate-tips 数据生成脚本。',
  },
  {
    date: '2026-05-25',
    title: 'MCP Banner 上线',
    description: '首页新增 Claude Code Skill 安装引导，一键复制安装命令。',
  },
  {
    date: '2026-05-20',
    title: '多源菜谱接入',
    description: '接入「随便做」和「金谷园」菜谱数据，支持来源切换。',
  },
  {
    date: '2026-05-15',
    title: '搜索功能上线',
    description: 'API 搜索 + 本地 fallback，支持关键词实时搜索。',
  },
];

function Changelog() {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">更新日志</h2>
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

// ── Tips Grid (existing) ──────────────────────────────────────────

function TipsGrid() {
  if (tips.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-primary" />
        <h2 className="font-display text-headline-lg text-on-surface">技法教程</h2>
      </div>
      <div className="grid gap-3">
        {tips.map((tip) => (
          <Link
            key={tip.slug}
            to={`/academy/${tip.slug}`}
            className="bg-surface-container-low rounded-xl p-5 hover:bg-surface-container transition-colors group"
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full">
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
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export function Tips() {
  useMeta({
    title: '烹饪学院',
    description: '烹饪基础知识、技法教程、厨房技巧 — 数据仪表盘、内容路线图、更新日志，一站式了解建设进展。',
    ogUrl: `${SITE_URL}/academy`,
  });

  return (
    <Layout>
      <div className="py-8 space-y-10 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            烹饪学院
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            从零开始的厨房指南 — 菜谱、技法、术语，持续建设中。
          </p>
        </div>

        {/* Stats */}
        <StatsDashboard />

        {/* Tips articles (only rendered when data exists) */}
        <TipsGrid />

        {/* Roadmap */}
        <ContentRoadmap />

        {/* Changelog */}
        <Changelog />
      </div>
    </Layout>
  );
}

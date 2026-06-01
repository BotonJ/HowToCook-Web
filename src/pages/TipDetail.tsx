import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBasePath } from '@/lib/i18n';

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

// Build unified list with series info
type SeriesType = 'academy' | 'tips';

interface SeriesItem {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  series: SeriesType;
  index: number;
}

const allItems: SeriesItem[] = [
  ...academyModules.map((item, i) => ({ ...item, series: 'academy' as SeriesType, index: i })),
  ...tipsArticles.map((item, i) => ({ ...item, series: 'tips' as SeriesType, index: i })),
];

const SERIES_META: Record<SeriesType, { label: string; total: number }> = {
  academy: { label: '最小厨房 MVP', total: academyModules.length },
  tips: { label: '基础技法', total: tipsArticles.length },
};

export function TipDetail() {
  const { slug } = useParams<{ slug: string }>();
  const tip = allItems.find(t => t.slug === slug);
  const base = useBasePath();

  useMeta({
    title: tip?.title || 'Not Found',
    description: tip?.summary || 'Cooking Knowledge Article',
    ogUrl: `${SITE_URL}/academy/${slug}`,
  });

  if (!tip) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="font-display text-headline-xl text-on-surface mb-4">Article Not Found</h1>
          <p className="font-body text-body-lg text-on-surface-variant mb-6">
            This article is not yet published. Please return to the list to view published content.
          </p>
          <Link
            to={`${base}/academy`}
            className="inline-flex items-center gap-2 text-primary hover:underline font-label-lg"
          >
            <ArrowLeft size={16} />
            Back to Cooking Academy
          </Link>
        </div>
      </Layout>
    );
  }

  // Series navigation
  const seriesItems = allItems.filter(item => item.series === tip.series);
  const currentIndex = seriesItems.findIndex(item => item.slug === slug);
  const prevItem = currentIndex > 0 ? seriesItems[currentIndex - 1] : null;
  const nextItem = currentIndex < seriesItems.length - 1 ? seriesItems[currentIndex + 1] : null;
  const seriesMeta = SERIES_META[tip.series];

  return (
    <Layout>
      <div className="py-8 max-w-3xl">
        <Link
          to={`${base}/academy`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-lg mb-6"
        >
          <ArrowLeft size={16} />
          Cooking Academy
        </Link>

        <article className="tip-content max-w-none">
          {/* Series breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-label-sm text-on-surface-variant">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {seriesMeta.label}
            </span>
            {tip.series === 'academy' && (
              <span className="text-on-surface-variant">
                {currentIndex + 1} / {seriesMeta.total}
              </span>
            )}
          </div>

          <h1 className="font-display text-headline-xl text-on-surface mb-4">{tip.title}</h1>
          <div
            className="font-body text-body-md text-on-surface-variant leading-relaxed"
            dangerouslySetInnerHTML={{ __html: tip.content }}
          />
        </article>

        {/* Series navigation */}
        <nav className="mt-12 pt-6 border-t border-outline-variant flex items-center justify-between gap-4">
          {prevItem ? (
            <Link
              to={`${base}/academy/${prevItem.slug}`}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <div className="text-left">
                <div className="text-label-sm text-on-surface-variant">上一篇</div>
                <div className="font-display text-label-lg text-on-surface group-hover:text-primary transition-colors">
                  {prevItem.title}
                </div>
              </div>
            </Link>
          ) : <div />}

          {nextItem ? (
            <Link
              to={`${base}/academy/${nextItem.slug}`}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group text-right"
            >
              <div>
                <div className="text-label-sm text-on-surface-variant">下一篇</div>
                <div className="font-display text-label-lg text-on-surface group-hover:text-primary transition-colors">
                  {nextItem.title}
                </div>
              </div>
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : <div />}
        </nav>
      </div>
    </Layout>
  );
}

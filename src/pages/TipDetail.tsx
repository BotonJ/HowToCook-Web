import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useT, useBasePath } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

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

// Module-level cache — fetched once, shared across mounts
let cachedItems: SeriesItem[] | null = null;
let cachedAcademyCount = 0;
let cachedTipsCount = 0;

async function loadAllItems(): Promise<SeriesItem[]> {
  if (cachedItems) return cachedItems;
  const [academyModules, tipsArticles] = await Promise.all([
    fetch('/data/cooking-academy.json').then(r => r.json()) as Promise<TipMeta[]>,
    fetch('/data/tips.json').then(r => r.json()) as Promise<TipMeta[]>,
  ]);
  cachedAcademyCount = academyModules.length;
  cachedTipsCount = tipsArticles.length;
  cachedItems = [
    ...academyModules.map((item, i) => ({ ...item, series: 'academy' as SeriesType, index: i })),
    ...tipsArticles.map((item, i) => ({ ...item, series: 'tips' as SeriesType, index: i })),
  ];
  return cachedItems;
}

const SERIES_LABELS: Record<SeriesType, string> = {
  academy: '最小厨房 MVK',
  tips: '基础技法',
};

const TIP_COVER_IMAGES: Record<string, string> = {
  'removing-fishy-smell': '/images/tips/去腥.webp',
  'oil-temperature': '/images/tips/油温判断技巧.webp',
  'food-safety': '/images/tips/食品安全.webp',
  'food-compatibility': '/images/tips/食材相克与禁忌.webp',
};

export function TipDetail() {
  const { slug } = useParams<{ slug: string }>();
  const base = useBasePath();
  const t = useT();

  const [allItems, setAllItems] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadAllItems().then(items => {
      if (!cancelled) {
        setAllItems(items);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const tip = useMemo(() => allItems.find(item => item.slug === slug), [allItems, slug]);

  const renderedContent = useMemo(() => {
    if (!tip) return '';
    const raw = marked.parse(tip.content, { async: false });
    return DOMPurify.sanitize(typeof raw === 'string' ? raw : '');
  }, [tip]);

  useMeta({
    title: tip?.title || t.tipDetail.defaultMetaTitle,
    description: tip?.summary || t.tipDetail.defaultMetaDesc,
    ogUrl: `${SITE_URL}/academy/${slug}`,
  });

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!tip) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="font-display text-headline-xl text-on-surface mb-4">{t.tipDetail.notFoundTitle}</h1>
          <p className="font-body text-body-lg text-on-surface-variant mb-6">
            {t.tipDetail.notFoundDesc}
          </p>
          <Link
            to={`${base}/academy`}
            className="inline-flex items-center gap-2 text-primary hover:underline font-label-lg"
          >
            <ArrowLeft size={16} />
            {t.tipDetail.backToAcademy}
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
  const seriesTotal = tip.series === 'academy' ? cachedAcademyCount : cachedTipsCount;

  const coverImage = TIP_COVER_IMAGES[slug ?? ''];

  return (
    <Layout>
      <div className="py-8">
        <Link
          to={`${base}/academy`}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-lg mb-6"
        >
          <ArrowLeft size={16} />
          {t.tipDetail.backToAcademy}
        </Link>

        <div className={`flex gap-12 ${coverImage ? '' : 'max-w-3xl'}`}>
          {/* Left: article content */}
          <article className={`tip-content flex-1 min-w-0 ${coverImage ? 'max-w-3xl' : ''}`}>
            {/* Series breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-label-sm text-on-surface-variant">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {SERIES_LABELS[tip.series]}
              </span>
              {tip.series === 'academy' && (
                <span className="text-on-surface-variant">
                  {currentIndex + 1} / {seriesTotal}
                </span>
              )}
            </div>

             <h1 className="font-display text-headline-lg md:text-headline-xl text-on-surface mb-4">{tip.title}</h1>
            <div
              className="font-body text-body-md text-on-surface-variant leading-relaxed tip-content"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </article>

          {/* Right: cover image (sticky sidebar) */}
          {coverImage && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-28">
                <img src={coverImage} alt={tip.title} className="w-full rounded-2xl shadow-ambient object-cover" />
              </div>
            </aside>
          )}
        </div>

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

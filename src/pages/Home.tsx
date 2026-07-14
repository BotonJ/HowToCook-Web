import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CategoryNav } from '@/components/CategoryNav';
import { CuisineNav } from '@/components/CuisineNav';
import { SourceNav } from '@/components/SourceNav';
import { McpBanner } from '@/components/McpBanner';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { WebsiteJsonLd } from '@/components/WebsiteJsonLd';
import { useRecipes } from '@/hooks/useRecipes';
import { useMeta } from '@/hooks/useMeta';
import { useI18n } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';
import { COLLECTIONS, COLLECTION_IDS } from '@/lib/collections';

const SOURCE_LABELS: Record<string, string> = {
  all: '全部',
  howtocook: 'HowToCook',
  '随便做': '随便做',
  '面食之神': '面食之神',
};

export function Home() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [activeCuisine, setActiveCuisine] = useState<string>('all');
  const [activeSource, setActiveSource] = useState('all');
  const { categories, loading, error, retry } = useRecipes();
  const { lang, t } = useI18n();

  useMeta({
    title: categoryId
      ? (categories.find(c => c.id === categoryId)?.displayName || t.home.category)
      : undefined,
    description: t.home.metaDesc,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: categoryId ? `${SITE_URL}/category/${categoryId}` : SITE_URL,
  });

  // Flat recipe list — computed once, shared by all downstream memos
  const flatRecipes = useMemo(() => categories.flatMap(c => c.recipes), [categories]);

  // Filter recipes based on language and cuisine
  const allRecipes = useMemo(() => {
    // Chinese mode: show all Chinese recipes, filtered by source
    if (lang === 'zh') {
      const zhRecipes = flatRecipes.filter(r => (r.language || 'zh') !== 'en');
      if (activeSource === 'all') return zhRecipes;
      return zhRecipes.filter(r => r.source === activeSource);
    }

    // English mode: filter by cuisine
    if (activeCuisine === 'all') {
      return flatRecipes.filter(r => (r.language || 'zh') === 'en');
    }

    // Chinese sub-options
    if (activeCuisine === 'chinese-original') {
      return flatRecipes.filter(r => r.cuisine === 'chinese' && (r.language || 'zh') !== 'en');
    }
    if (activeCuisine === 'chinese-western') {
      return flatRecipes.filter(r => r.cuisine === 'chinese' && r.language === 'en');
    }

    // Other cuisines
    return flatRecipes
      .filter(r => (r.language || 'zh') === 'en')
      .filter(r => r.cuisine === activeCuisine);
  }, [flatRecipes, lang, activeCuisine, activeSource]);

  // Calculate cuisine counts for English mode
  const cuisineCounts = useMemo(() => {
    if (lang !== 'en') return {};
    const enRecipes = flatRecipes.filter(r => (r.language || 'zh') === 'en');
    const counts: Record<string, number> = { all: enRecipes.length };

    enRecipes.forEach(r => {
      if (r.cuisine) {
        counts[r.cuisine] = (counts[r.cuisine] || 0) + 1;
      }
    });

    const zhRecipes = flatRecipes.filter(r => r.cuisine === 'chinese' && (r.language || 'zh') !== 'en');
    counts['chinese-original'] = zhRecipes.length;
    counts['chinese'] = (counts['chinese'] || 0) + zhRecipes.length;

    return counts;
  }, [flatRecipes, lang]);

  // Calculate source counts for Chinese mode
  const sourceCounts = useMemo(() => {
    if (lang !== 'zh') return {};
    const zhRecipes = flatRecipes.filter(r => (r.language || 'zh') !== 'en');
    const counts: Record<string, number> = { all: zhRecipes.length };
    zhRecipes.forEach(r => {
      if (r.source) {
        counts[r.source] = (counts[r.source] || 0) + 1;
      }
    });
    return counts;
  }, [flatRecipes, lang]);

  const displayedRecipes = useMemo(() => {
    const list = categoryId
      ? allRecipes.filter(recipe => recipe.category === categoryId)
      : allRecipes;
    return [...list].sort((a, b) => (a.imagePath ? 0 : 1) - (b.imagePath ? 0 : 1));
  }, [categoryId, allRecipes]);

  // Curated collections with recipe counts (from real data)
  const curatedCollections = useMemo(() => {
    return COLLECTION_IDS.map(id => {
      const def = COLLECTIONS[id];
      if (!def) return null;
      const count = flatRecipes.filter(def.filter).length;
      return { ...def, count };
    }).filter(Boolean) as { id: string; title: string; description: string; emoji: string; count: number }[];
  }, [flatRecipes]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-lg font-body mt-4">{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body mb-4">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-body hover:opacity-90 transition"
          >
            {t.common.retry}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!categoryId && <WebsiteJsonLd />}

      {/* ── Section 1: Hero ───────────────────────────────────────── */}
      {!categoryId && (
        <section className="relative pt-12 pb-10 md:pt-20 md:pb-16 text-center">
          {/* Decorative background glow */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container/15 rounded-full blur-[120px]" />
          </div>

          <h1 className="font-display text-headline-xl text-on-surface tracking-tight mb-4">
            {lang === 'en' ? 'HowToCook AI' : '做饭指北'}
          </h1>
        </section>
      )}

      {/* ── Section 2: Brand Tagline ──────────────────────────────── */}
      {!categoryId && (
        <p className="text-body-lg text-on-surface-variant text-center mb-8 max-w-xl mx-auto px-4">
          {t.home.tagline}
        </p>
      )}

      {/* ── Section 3: AI Flavor Seam (placeholder, no render) ──── */}
      {/* AI_FLAVOR_SEAM: 未来 AI 风味雷达区块接入点。
          本轮不渲染——依赖 5 维公式数据清洗（见 flavor 决策"数据先行"铁律）。
          数据干净后在此 drop 雷达 + 特性卡片。 */}

      {/* ── MCP Banner ────────────────────────────────────────────── */}
      <div className="mb-8 px-2">
        <McpBanner />
      </div>

      {/* ── Section 5: Curated Collections (bento) ───────────────── */}
      {!categoryId && curatedCollections.length > 0 && (
        <section className="mb-16 px-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-headline-lg text-on-surface">
                {t.home.curatedTitle}
              </h2>
              <p className="text-on-surface-variant text-body-md mt-1">
                {t.home.curatedSubtitle}
              </p>
            </div>
            <Link
              to="/collection/air-fryer"
              className="text-primary text-label-lg flex items-center gap-1 hover:gap-2 transition-all group"
            >
              {t.home.viewAllCollections}
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[240px] md:auto-rows-[280px]">
            {curatedCollections.map((col, idx) => (
              <Link
                key={col.id}
                to={`/collection/${col.id}`}
                className={`
                  group relative rounded-2xl overflow-hidden shadow-ambient
                  hover:-translate-y-1 transition-transform duration-300
                  ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                `}
              >
                {/* Gradient background with collection color tint */}
                <div className={`
                  absolute inset-0
                  ${idx === 0
                    ? 'bg-gradient-to-br from-primary/20 via-surface-container to-secondary-container/30'
                    : idx % 2 === 0
                      ? 'bg-gradient-to-br from-primary-container/30 via-surface-container-low to-surface-container'
                      : 'bg-gradient-to-br from-secondary-container/30 via-surface-container-low to-surface-container'
                  }
                `} />

                {/* Content */}
                <div className="relative h-full p-6 md:p-8 flex flex-col justify-end">
                  <span className={`
                    text-4xl md:text-5xl mb-3 select-none
                    ${idx === 0 ? 'md:text-6xl md:mb-4' : ''}
                  `} role="img" aria-hidden="true">
                    {col.emoji}
                  </span>
                  <h3 className={`
                    font-display text-on-surface tracking-tight
                    ${idx === 0 ? 'text-headline-md md:text-headline-lg' : 'text-headline-sm'}
                  `}>
                    {col.title}
                  </h3>
                  <p className="text-on-surface-variant text-body-md mt-1 line-clamp-2">
                    {col.description}
                  </p>
                  <span className="text-primary text-label-lg mt-2">
                    {t.home.recipeCount(col.count)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Navigation: SourceNav + CategoryNav for Chinese, CuisineNav for English */}
      <div className="mb-8">
        {lang === 'en' ? (
          <CuisineNav
            activeCuisine={activeCuisine}
            onCuisineChange={setActiveCuisine}
            cuisineCounts={cuisineCounts}
          />
        ) : (
          <>
            <SourceNav
              activeSource={activeSource}
              onSourceChange={setActiveSource}
              sourceCounts={sourceCounts}
            />
            <CategoryNav categories={categories} />
          </>
        )}
      </div>

      {/* ── Section 4: Discovery Grid ────────────────────────────── */}
      <section className="px-2 mb-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-headline-lg text-on-surface">
              {categoryId
                ? categories.find(c => c.id === categoryId)?.displayName || t.home.category
                : lang === 'en'
                  ? (activeCuisine === 'all' ? 'All Recipes' : activeCuisine === 'chinese-original' ? 'Original Chinese' : activeCuisine === 'chinese-western' ? 'Western Chinese' : activeCuisine)
                  : (activeSource === 'all' ? t.home.discoveryTitle : SOURCE_LABELS[activeSource] || activeSource)}
              <span className="text-on-surface-variant text-body-lg font-normal ml-2">
                ({t.home.recipeCount(displayedRecipes.length)})
              </span>
            </h2>
            {!categoryId && (
              <p className="text-on-surface-variant text-body-md mt-1">
                {t.home.discoverySubtitle}
              </p>
            )}
          </div>
        </div>

        <RecipeGrid
          recipes={displayedRecipes}
        />
      </section>

    </Layout>
  );
}

import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CategoryNav } from '@/components/CategoryNav';
import { CuisineNav } from '@/components/CuisineNav';
import { SourceNav } from '@/components/SourceNav';
import { McpBanner } from '@/components/McpBanner';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { WebsiteJsonLd } from '@/components/WebsiteJsonLd';
import { useSearch } from '@/hooks/useSearch';
import { useRecipes } from '@/hooks/useRecipes';
import { useMeta } from '@/hooks/useMeta';
import { useI18n } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';

const SOURCE_LABELS: Record<string, string> = {
  all: '全部',
  howtocook: 'HowToCook',
  '随便做': '随便做',
  'noodle-god': '面食之神',
};

export function Home() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Filter recipes based on language and cuisine
  const allRecipes = useMemo(() => {
    const recipes = categories.flatMap(c => c.recipes);

    // Chinese mode: show all Chinese recipes, filtered by source
    if (lang === 'zh') {
      const zhRecipes = recipes.filter(r => (r.language || 'zh') !== 'en');
      if (activeSource === 'all') return zhRecipes;
      return zhRecipes.filter(r => r.source === activeSource);
    }

    // English mode: filter by cuisine
    if (activeCuisine === 'all') {
      return recipes.filter(r => (r.language || 'zh') === 'en');
    }

    // Chinese sub-options
    if (activeCuisine === 'chinese-original') {
      return recipes.filter(r => r.cuisine === 'chinese' && (r.language || 'zh') !== 'en');
    }
    if (activeCuisine === 'chinese-western') {
      return recipes.filter(r => r.cuisine === 'chinese' && r.language === 'en');
    }

    // Other cuisines
    return recipes
      .filter(r => (r.language || 'zh') === 'en')
      .filter(r => r.cuisine === activeCuisine);
  }, [categories, lang, activeCuisine, activeSource]);

  // Calculate cuisine counts for English mode
  const cuisineCounts = useMemo(() => {
    if (lang !== 'en') return {};
    const allRecipes = categories.flatMap(c => c.recipes);

    // English recipes only
    const enRecipes = allRecipes.filter(r => (r.language || 'zh') === 'en');
    const counts: Record<string, number> = { all: enRecipes.length };

    // Count by cuisine
    enRecipes.forEach(r => {
      if (r.cuisine) {
        counts[r.cuisine] = (counts[r.cuisine] || 0) + 1;
      }
    });

    // Chinese sub-counts
    const zhRecipes = allRecipes.filter(r => r.cuisine === 'chinese' && (r.language || 'zh') !== 'en');
    counts['chinese-original'] = zhRecipes.length;
    counts['chinese'] = (counts['chinese'] || 0) + zhRecipes.length;

    return counts;
  }, [categories, lang]);

  // Calculate source counts for Chinese mode
  const sourceCounts = useMemo(() => {
    if (lang !== 'zh') return {};
    const zhRecipes = categories.flatMap(c => c.recipes).filter(r => (r.language || 'zh') !== 'en');
    const counts: Record<string, number> = { all: zhRecipes.length };
    zhRecipes.forEach(r => {
      if (r.source) {
        counts[r.source] = (counts[r.source] || 0) + 1;
      }
    });
    return counts;
  }, [categories, lang]);

  const displayedRecipes = useMemo(() => {
    const list = categoryId
      ? allRecipes.filter(recipe => recipe.category === categoryId)
      : allRecipes;
    return [...list].sort((a, b) => (a.imagePath ? 0 : 1) - (b.imagePath ? 0 : 1));
  }, [categoryId, allRecipes]);

  // API search (triggered when search term is present)
  const { results: searchResults, loading: searchLoading } = useSearch(searchTerm, allRecipes);

  // Final display: API results > local fallback > category browsing
  const filteredRecipes = useMemo(() => {
    if (!normalizedSearch) return displayedRecipes;
    if (searchResults !== null) return searchResults;
    // API search failed or still loading, fall back to local search
    return displayedRecipes.filter(recipe => recipe.name.toLowerCase().includes(normalizedSearch));
  }, [displayedRecipes, normalizedSearch, searchResults]);

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
      <div className="mt-4 mb-2 px-2">
        <McpBanner />
      </div>

      {/* Navigation: SourceNav + CategoryNav for Chinese, CuisineNav for English */}
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

      <div className="mt-6">
        <div className="mb-6 px-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-headline-lg text-on-surface">
            {categoryId
              ? categories.find(c => c.id === categoryId)?.displayName || t.home.category
              : lang === 'en'
                ? (activeCuisine === 'all' ? 'All Recipes' : activeCuisine === 'chinese-original' ? 'Original Chinese' : activeCuisine === 'chinese-western' ? 'Western Chinese' : activeCuisine)
                : (activeSource === 'all' ? t.home.category : SOURCE_LABELS[activeSource] || activeSource)}
            <span className="text-on-surface-variant text-body-md font-normal ml-3">
              ({t.home.recipeCount(filteredRecipes.length)})
            </span>
          </h1>
          <div className="w-full sm:w-72 relative">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.home.searchPlaceholder}
              aria-label={t.home.searchPlaceholder}
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">...</span>
            )}
          </div>
        </div>

        <RecipeGrid
          recipes={filteredRecipes}
          emptyMessage={normalizedSearch ? t.home.emptySearch : undefined}
        />
      </div>
    </Layout>
  );
}

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { SourceNav } from '@/components/SourceNav';
import { CategoryNav } from '@/components/CategoryNav';
import { McpBanner } from '@/components/McpBanner';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { WebsiteJsonLd } from '@/components/WebsiteJsonLd';
import { useSearch } from '@/hooks/useSearch';
import { useRecipes } from '@/hooks/useRecipes';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { getUiLang, getLabels } from '@/lib/ui-labels';
import type { Recipe } from '@/types';

interface FeaturedCollection {
  id: string;
  title: string;
  emoji: string;
  description: string;
  filter: (r: Recipe) => boolean;
  moreLink?: string;
  moreText?: string;
}

const FEATURED: FeaturedCollection[] = [
  {
    id: 'chinese-recipes',
    title: 'Chinese Recipes',
    emoji: '🥢',
    description: 'Authentic Chinese cuisine',
    filter: (r) => r.cuisine === 'chinese',
    moreLink: '/collection/chinese-all',
    moreText: 'More Chinese Recipes → 481+ recipes',
  },
  {
    id: 'italian',
    title: 'Italian',
    emoji: '🍝',
    description: 'Classic Italian dishes',
    filter: (r) => r.cuisine === 'italian',
  },
  {
    id: 'french',
    title: 'French',
    emoji: '🥐',
    description: 'Elegant French cuisine',
    filter: (r) => r.cuisine === 'french',
  },
  {
    id: 'japanese',
    title: 'Japanese',
    emoji: '🍣',
    description: 'Delicate Japanese flavors',
    filter: (r) => r.cuisine === 'japanese',
  },
  {
    id: 'baking',
    title: 'Baking',
    emoji: '🍰',
    description: 'Breads, cakes, and pastries',
    filter: (r) => r.category === 'dessert',
  },
];

const SOURCE_LABELS: Record<string, string> = {
  all: 'All',
  zh: '中文',
  en: 'English',
};

export function Home() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeSource, setActiveSource] = useState('all');
  const { categories, loading, error, retry } = useRecipes();

  const t = getLabels(getUiLang(activeSource));

  useMeta({
    title: categoryId
      ? (categories.find(c => c.id === categoryId)?.displayName || t.category)
      : undefined,
    description: t.metaDesc,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: categoryId ? `${SITE_URL}/category/${categoryId}` : SITE_URL,
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const allRecipes = useMemo(() => {
    return categories
      .flatMap(c => c.recipes)
      .filter(recipe => {
        if (activeSource === 'all') return true;
        const lang = recipe.language || 'zh';
        return lang === activeSource;
      });
  }, [categories, activeSource]);

  const featuredCollections = useMemo(() => {
    if (categoryId || normalizedSearch) return [];
    // 只在英文模式或全部模式下显示精选推荐
    if (activeSource === 'zh') return [];
    // 筛选英文菜谱
    const enRecipes = categories.flatMap(c => c.recipes).filter(r => (r.language || 'zh') === 'en');
    return FEATURED.map((col) => {
      const picks = enRecipes.filter(col.filter).slice(0, 8);
      return { ...col, recipes: picks };
    }).filter((col) => col.recipes.length > 0);
  }, [categories, categoryId, normalizedSearch, activeSource]);

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
          <p className="text-on-surface-variant text-lg font-body mt-4">{t.loading}</p>
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
            {t.retry}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!categoryId && <WebsiteJsonLd />}
      <SourceNav activeSource={activeSource} onSourceChange={setActiveSource} />
      <div className="mt-4 mb-2 px-2">
        <McpBanner />
      </div>
      <CategoryNav categories={categories} />

      {featuredCollections.length > 0 && (
        <div className="mt-6 px-2">
          <h2 className="font-display text-title-lg text-on-surface mb-3">{t.featured}</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {featuredCollections.map((col) => (
              <Link
                key={col.id}
                to={col.moreLink || `/collection/${col.id}`}
                className="flex-shrink-0 w-64 group"
              >
                <div className="bg-surface-container-low rounded-xl border border-outline-variant p-3 hover:border-primary transition">
                  <p className="font-body text-label-lg text-primary group-hover:underline mb-1">
                    {col.emoji} {col.title}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-2">{col.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {col.recipes.slice(0, 4).map((r) => (
                      <span key={r.id} className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {r.name}
                      </span>
                    ))}
                  </div>
                  {col.moreText ? (
                    <p className="text-xs text-primary mt-2">{col.moreText}</p>
                  ) : (
                    <p className="text-xs text-on-surface-variant mt-2">{t.recipes(col.recipes.length)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-6 px-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-headline-lg text-on-surface">
            {categoryId
              ? categories.find(c => c.id === categoryId)?.displayName || t.category
              : SOURCE_LABELS[activeSource] || activeSource}
            <span className="text-on-surface-variant text-body-md font-normal ml-3">
              ({t.recipeCount(filteredRecipes.length)})
            </span>
          </h1>
          <div className="w-full sm:w-72 relative">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">...</span>
            )}
          </div>
        </div>

        <RecipeGrid
          recipes={filteredRecipes}
          emptyMessage={normalizedSearch ? t.emptySearch : undefined}
        />
      </div>
    </Layout>
  );
}

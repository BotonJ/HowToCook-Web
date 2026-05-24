import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SourceNav } from '@/components/SourceNav';
import { CategoryNav } from '@/components/CategoryNav';
import { McpBanner } from '@/components/McpBanner';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { useSearch } from '@/hooks/useSearch';
import { useRecipes } from '@/hooks/useRecipes';

const SOURCE_LABELS: Record<string, string> = {
  howtocook: 'HowToCook',
  '随便做': '随便做',
};

export function Home() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSource, setActiveSource] = useState('howtocook');
  const { categories, loading, error, retry } = useRecipes();

  const allRecipes = useMemo(() => {
    return categories
      .flatMap(c => c.recipes)
      .filter(recipe => recipe.source === activeSource);
  }, [activeSource]);

  const displayedRecipes = useMemo(() => {
    const list = categoryId
      ? allRecipes.filter(recipe => recipe.category === categoryId)
      : allRecipes;
    return [...list].sort((a, b) => (a.imagePath ? 0 : 1) - (b.imagePath ? 0 : 1));
  }, [categoryId, allRecipes]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  // API search (triggered when search term is present)
  const { results: searchResults, loading: searchLoading } = useSearch(searchTerm, allRecipes);

  // Final display: API results > local fallback > category browsing
  const filteredRecipes = useMemo(() => {
    if (!normalizedSearch) return displayedRecipes;
    if (searchResults) return searchResults;
    // API search failed or still loading, fall back to local search
    return displayedRecipes.filter(recipe => recipe.name.toLowerCase().includes(normalizedSearch));
  }, [displayedRecipes, normalizedSearch, searchResults]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-lg font-body mt-4">加载菜谱中...</p>
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
            重试
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SourceNav activeSource={activeSource} onSourceChange={setActiveSource} />
      <div className="mt-4 mb-2 px-2">
        <McpBanner />
      </div>
      <CategoryNav categories={categories} />

      <div className="mt-6">
        <div className="mb-6 px-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-headline-lg text-on-surface">
            {categoryId
              ? categories.find(c => c.id === categoryId)?.displayName || '分类'
              : SOURCE_LABELS[activeSource] || activeSource}
            <span className="text-on-surface-variant text-body-md font-normal ml-3">
              ({filteredRecipes.length} 道菜)
            </span>
          </h1>
          <div className="w-full sm:w-72 relative">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="输入关键词搜索菜谱"
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">...</span>
            )}
          </div>
        </div>

        <RecipeGrid recipes={filteredRecipes} />
      </div>
    </Layout>
  );
}

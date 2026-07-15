import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { RecipeGrid } from '@/components/RecipeGrid';
import { useRecipes } from '@/hooks/useRecipes';
import { useSearch } from '@/hooks/useSearch';
import { useI18n, useT } from '@/lib/i18n';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import type { Recipe } from '@/types';

type SortOption = 'relevance' | 'quickest';
type TimeFilter = 'all' | 'quick' | 'medium' | 'long';
type DifficultyFilter = 'all' | '1' | '2' | '3' | '4';

function matchesTimeFilter(recipe: Recipe, filter: TimeFilter): boolean {
  if (filter === 'all') return true;
  return recipe.cook_time === filter;
}

function matchesDifficultyFilter(recipe: Recipe, filter: DifficultyFilter): boolean {
  if (filter === 'all') return true;
  return recipe.difficulty === Number(filter);
}

function matchesCategoryFilter(recipe: Recipe, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  return selected.has(recipe.category);
}

function matchesDietaryFilter(recipe: Recipe, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  const diet = recipe.tags?.diet ?? [];
  const isSpicy = recipe.tags?.spicy;
  for (const tag of selected) {
    if (tag === 'spicy' && isSpicy) return true;
    if (diet.includes(tag)) return true;
  }
  return false;
}

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'quickest':
      return sorted.sort((a, b) => {
        const order = { quick: 0, medium: 1, long: 2, very_long: 3 };
        return (order[a.cook_time as keyof typeof order] ?? 9) - (order[b.cook_time as keyof typeof order] ?? 9);
      });
    case 'relevance':
    default:
      return sorted;
  }
}

export function SearchPage() {
  const { lang } = useI18n();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [dietaryFilters, setDietaryFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Mobile sidebar
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Data
  const { categories, recipes, loading, error, retry } = useRecipes();
  const normalizedSearch = searchTerm.trim().toLowerCase();

  useMeta({
    title: lang === 'zh' ? '搜索菜谱' : 'Search Recipes',
    description: lang === 'zh'
      ? '搜索和筛选菜谱 — 按菜系、时间、难度、饮食偏好快速找到你想要的菜。'
      : 'Search and filter recipes — find what you want by cuisine, time, difficulty, and dietary preferences.',
    ogUrl: `${SITE_URL}/search`,
  });

  // Available categories with counts
  const categoryOptions = useMemo(() => {
    const allRecipes = categories.flatMap(c => c.recipes);
    const counts = new Map<string, number>();
    for (const r of allRecipes) {
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    return categories
      .filter(c => c.recipes.length > 0)
      .map(c => ({ id: c.id, name: c.displayName, count: counts.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [categories]);

  // Available dietary tags
  const dietaryOptions = useMemo(() => {
    const tags = new Set<string>();
    for (const r of recipes) {
      if (r.tags?.spicy) tags.add('spicy');
      for (const d of r.tags?.diet ?? []) tags.add(d);
    }
    return Array.from(tags).sort();
  }, [recipes]);

  // API search (triggered when search term is present)
  const { results: searchResults, loading: searchLoading } = useSearch(searchTerm, recipes);

  // Filtered + sorted results
  const filteredRecipes = useMemo(() => {
    // Base: search results or all recipes
    let base: Recipe[];
    if (normalizedSearch) {
      base = searchResults !== null
        ? searchResults
        : recipes.filter(r => r.name.toLowerCase().includes(normalizedSearch));
    } else {
      base = recipes;
    }

    // Filter by language
    base = base.filter(r => (r.language || 'zh') === (lang === 'zh' ? 'zh' : 'en'));

    // Apply filters
    base = base.filter(r => matchesCategoryFilter(r, selectedCategories));
    base = base.filter(r => matchesTimeFilter(r, timeFilter));
    base = base.filter(r => matchesDifficultyFilter(r, difficultyFilter));
    base = base.filter(r => matchesDietaryFilter(r, dietaryFilters));

    // Sort
    return sortRecipes(base, sortBy);
  }, [normalizedSearch, searchResults, recipes, lang, selectedCategories, timeFilter, difficultyFilter, dietaryFilters, sortBy]);

  // Toggle handlers
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDietary = useCallback((tag: string) => {
    setDietaryFilters(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setTimeFilter('all');
    setDifficultyFilter('all');
    setDietaryFilters(new Set());
    setSearchTerm('');
    setSearchParams({});
  }, [setSearchParams]);

  const activeFilterCount = selectedCategories.size
    + (timeFilter !== 'all' ? 1 : 0)
    + (difficultyFilter !== 'all' ? 1 : 0)
    + dietaryFilters.size;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  // i18n helpers
  const difficultyLabel = (level: string) => {
    const idx = Number(level);
    return t.constants.difficulty[idx] ?? level;
  };

  const dietaryLabel = (tag: string) => {
    if (tag === 'spicy') return lang === 'zh' ? '辣' : 'Spicy';
    // Capitalize first letter for English
    if (lang === 'en') return tag.charAt(0).toUpperCase() + tag.slice(1);
    return tag;
  };

  // ── Sidebar content ──────────────────────────────────────────────
  const sidebarContent = (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="font-display text-body-md font-semibold text-on-surface mb-3">
          {lang === 'zh' ? '分类' : 'Category'}
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {categoryOptions.map(cat => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                className="form-checkbox h-4 w-4 text-primary border-outline-variant rounded focus:ring-primary/50 transition-colors"
              />
              <span className={`text-sm transition-colors ${
                selectedCategories.has(cat.id)
                  ? 'text-primary font-medium'
                  : 'text-on-surface-variant group-hover:text-primary'
              }`}>
                {cat.name}
                <span className="text-outline-variant ml-1 text-xs">({cat.count})</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-outline-variant" />

      {/* Time Filter */}
      <div>
        <h3 className="font-display text-body-md font-semibold text-on-surface mb-3">
          {t.recipe.time}
        </h3>
        <div className="space-y-2">
          {(['all', 'quick', 'medium', 'long'] as TimeFilter[]).map(val => (
            <label key={val} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="time-filter"
                checked={timeFilter === val}
                onChange={() => setTimeFilter(val)}
                className="form-radio h-4 w-4 text-primary border-outline-variant focus:ring-primary/50 transition-colors"
              />
              <span className={`text-sm transition-colors ${
                timeFilter === val
                  ? 'text-primary font-medium'
                  : 'text-on-surface-variant group-hover:text-primary'
              }`}>
                {val === 'all'
                  ? (lang === 'zh' ? '不限' : 'Any time')
                  : t.constants.cookTime[val]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-outline-variant" />

      {/* Difficulty Filter */}
      <div>
        <h3 className="font-display text-body-md font-semibold text-on-surface mb-3">
          {t.recipe.difficulty}
        </h3>
        <div className="space-y-2">
          {(['all', '1', '2', '3', '4'] as DifficultyFilter[]).map(val => (
            <label key={val} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="difficulty-filter"
                checked={difficultyFilter === val}
                onChange={() => setDifficultyFilter(val)}
                className="form-radio h-4 w-4 text-primary border-outline-variant focus:ring-primary/50 transition-colors"
              />
              <span className={`text-sm transition-colors ${
                difficultyFilter === val
                  ? 'text-primary font-medium'
                  : 'text-on-surface-variant group-hover:text-primary'
              }`}>
                {val === 'all'
                  ? (lang === 'zh' ? '不限' : 'Any difficulty')
                  : difficultyLabel(val)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {dietaryOptions.length > 0 && (
        <>
          <hr className="border-outline-variant" />

          {/* Dietary Filter */}
          <div>
            <h3 className="font-display text-body-md font-semibold text-on-surface mb-3">
              {lang === 'zh' ? '饮食标签' : 'Dietary'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map(tag => {
                const isActive = dietaryFilters.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDietary(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors border ${
                      isActive
                        ? 'bg-primary-container/20 text-primary border-primary/20'
                        : 'bg-surface-container-high text-on-surface-variant border-transparent hover:bg-surface-variant'
                    }`}
                  >
                    {tag === 'spicy' ? '辣 ' : ''}{dietaryLabel(tag)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full text-sm text-error hover:text-error/80 transition-colors py-2"
        >
          {lang === 'zh' ? '清除所有筛选' : 'Clear all filters'}
          <span className="ml-1 text-xs">({activeFilterCount})</span>
        </button>
      )}
    </div>
  );

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-body-md font-body mt-4">{t.common.loadingRecipes}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-body-md font-body mb-4">{error}</p>
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

  // ── Main render ──────────────────────────────────────────────────
  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <SlidersHorizontal size={16} />
            {lang === 'zh' ? '筛选' : 'Filters'}
            {activeFilterCount > 0 && (
              <span className="bg-primary text-on-primary text-xs px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showMobileFilters && (
            <div className="mt-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
              {sidebarContent}
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-[100px] max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
            {sidebarContent}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Search Bar */}
          <div className="mb-6 flex flex-col gap-5">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={20} className="text-outline" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={lang === 'zh' ? '搜索菜谱、食材、菜系...' : 'Search recipes, ingredients, cuisines...'}
                aria-label={t.common.search}
                className="w-full bg-surface-container-lowest input-zen rounded-full py-4 pl-14 pr-5 text-on-surface placeholder:text-outline-variant text-body-lg shadow-sm outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              {searchLoading && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Results Info & Sort */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-on-surface-variant text-body-md">
                <span className="font-semibold text-primary">{filteredRecipes.length}</span>
                {' '}
                {lang === 'zh' ? '道菜谱' : 'recipes found'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-outline">{lang === 'zh' ? '排序:' : 'Sort by:'}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label={lang === 'zh' ? '排序方式' : 'Sort by'}
                  className="bg-transparent border-none text-primary font-medium focus:ring-0 cursor-pointer text-sm pl-0 py-1 pr-6"
                >
                  <option value="relevance">{lang === 'zh' ? '相关度' : 'Relevance'}</option>
                  <option value="quickest">{lang === 'zh' ? '最快' : 'Quickest'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Recipe Grid */}
          <RecipeGrid
            recipes={filteredRecipes}
            emptyMessage={
              normalizedSearch
                ? (lang === 'zh' ? '未找到匹配的菜谱，试试其他关键词' : 'No recipes found. Try different keywords.')
                : activeFilterCount > 0
                  ? (lang === 'zh' ? '当前筛选条件下暂无菜谱，试试调整筛选' : 'No recipes match these filters. Try adjusting your criteria.')
                  : undefined
            }
          />
        </div>
      </div>
    </Layout>
  );
}

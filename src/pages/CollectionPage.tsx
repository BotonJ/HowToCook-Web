import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { useT, useBasePath } from '@/lib/i18n';
import type { Recipe, Category } from '@/types';
import type { EnIndexData } from '@/types/api';

interface CollectionDef {
  id: string;
  title: string;
  description: string;
  seoKeywords: string;
  filter: (recipe: Recipe) => boolean;
}

const COLLECTIONS: Record<string, CollectionDef> = {
  'chinese-recipes': {
    id: 'chinese-recipes',
    title: 'Chinese Recipes',
    description: 'Authentic Chinese recipes — stir-fry, braised, steamed, and more.',
    seoKeywords: 'chinese recipe, chinese food, 中餐',
    filter: (r) => r.language === 'en' && r.cuisine === 'chinese',
  },
  'chinese-all': {
    id: 'chinese-all',
    title: 'All Chinese Recipes',
    description: 'Complete collection of authentic Chinese recipes — 481+ dishes from every region.',
    seoKeywords: 'chinese recipe, chinese food, 中餐, all chinese recipes',
    filter: (r) => r.language !== 'en', // 中文菜谱
  },
  'chicken-recipes': {
    id: 'chicken-recipes',
    title: 'Chicken Recipes',
    description: 'Easy and delicious chicken recipes for every occasion.',
    seoKeywords: 'chicken recipe, chicken dinner',
    filter: (r) => r.language === 'en' && r.main_ingredients.some((i) => i.toLowerCase().includes('chicken')),
  },
  'baking': {
    id: 'baking',
    title: 'Baking Recipes',
    description: 'Breads, cakes, cookies, and pastries from professional baking sources.',
    seoKeywords: 'baking recipes, bread, cake, pastry',
    filter: (r) => r.language === 'en' && (r.source === 'professional_baking' || r.category === 'dessert'),
  },
  'air-fryer': {
    id: 'air-fryer',
    title: 'Air Fryer Recipes',
    description: 'Quick and healthy air fryer recipes.',
    seoKeywords: 'air fryer recipe, air fryer',
    filter: (r) =>
      r.language === 'en' && (
        r.name.toLowerCase().includes('air fryer') ||
        r.ingredients.some((i) => i.toLowerCase().includes('air fryer'))
      ),
  },
  'italian': {
    id: 'italian',
    title: 'Italian Recipes',
    description: 'Classic Italian dishes — pasta, risotto, and more.',
    seoKeywords: 'italian recipe, italian food, pasta',
    filter: (r) => r.language === 'en' && r.cuisine === 'italian',
  },
  'french': {
    id: 'french',
    title: 'French Recipes',
    description: 'Elegant French cuisine — sauces, pastries, and refined dishes.',
    seoKeywords: 'french recipe, french cuisine, french food',
    filter: (r) => r.language === 'en' && r.cuisine === 'french',
  },
  'japanese': {
    id: 'japanese',
    title: 'Japanese Recipes',
    description: 'Delicate Japanese flavors — sushi, ramen, and traditional dishes.',
    seoKeywords: 'japanese recipe, japanese food, sushi, ramen',
    filter: (r) => r.language === 'en' && r.cuisine === 'japanese',
  },
};

async function loadRecipeData(): Promise<Category[]> {
  // 加载中文数据
  const zhRes = await fetch('/data/recipes-index.json');
  if (!zhRes.ok) throw new Error(`Failed to load recipe data: ${zhRes.status}`);
  const zhCategories: Category[] = await zhRes.json();

  // 加载英文数据
  try {
    const enRes = await fetch('/data/en_index_curated.json');
    if (enRes.ok) {
      const enData: EnIndexData = await enRes.json();
      const enRecipes: Recipe[] = enData.dishes.map((dish) => ({
        id: `en/${dish.name}`,
        name: dish.name,
        category: dish.category,
        imagePath: '',
        difficulty: dish.difficulty,
        cuisine: dish.cuisine,
        cooking_method: dish.cooking_method,
        cook_time: dish.cook_time,
        ingredients: dish.ingredients,
        main_ingredients: dish.main_ingredients ?? [],
        tags: dish.tags ?? {},
        source: dish.source,
        description: dish.epicurious_meta?.description ?? '',
        language: 'en' as const,
      }));

      const grouped = new Map<string, Recipe[]>();
      for (const recipe of enRecipes) {
        const list = grouped.get(recipe.category);
        if (list) {
          list.push(recipe);
        } else {
          grouped.set(recipe.category, [recipe]);
        }
      }

      for (const [id, recs] of grouped) {
        const existing = zhCategories.find(c => c.id === id);
        if (existing) {
          existing.recipes.push(...recs);
          existing.count = existing.recipes.length;
        } else {
          zhCategories.push({
            id: `en-${id}`,
            name: `English ${id}`,
            displayName: `English ${id}`,
            count: recs.length,
            recipes: recs,
          });
        }
      }
    }
  } catch {
    // 英文数据加载失败，继续使用中文数据
  }

  return zhCategories;
}

export function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const collection = collectionId ? COLLECTIONS[collectionId] : undefined;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  const base = useBasePath();

  useMeta({
    title: collection?.title,
    description: collection?.description,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: collectionId ? `${SITE_URL}/collection/${collectionId}` : SITE_URL,
  });

  useEffect(() => {
    loadRecipeData()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : t.collection.error))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!collection) return [];
    return categories
      .flatMap((c) => c.recipes)
      .filter(collection.filter);
  }, [categories, collection]);

  if (!collection) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body">{t.collection.notFound}</p>
          <Link to={`${base}/`} className="text-primary underline mt-2 inline-block">{t.collection.backHome}</Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-lg font-body mt-4">{t.collection.loading}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-error text-lg font-body">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mt-6 mb-2 px-2">
        <Link to={`${base}/`} className="text-primary text-sm hover:underline">{t.collection.backHome}</Link>
      </div>
      <div className="mt-4 mb-6 px-2">
        <h1 className="font-display text-headline-lg text-on-surface">
          {collection.title}
          <span className="text-on-surface-variant text-body-md font-normal ml-3">
            ({filteredRecipes.length} recipes)
          </span>
        </h1>
        <p className="text-on-surface-variant text-body-md mt-1">{collection.description}</p>
      </div>
      <div className="px-2">
        <RecipeGrid
          recipes={filteredRecipes}
          emptyMessage={t.collection.empty}
        />
      </div>
    </Layout>
  );
}

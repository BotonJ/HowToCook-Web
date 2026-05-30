import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { getLabels } from '@/lib/ui-labels';
import type { Recipe, Category } from '@/types';

const t = getLabels('en');

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
    filter: (r) => r.cuisine === 'chinese',
  },
  'chicken-recipes': {
    id: 'chicken-recipes',
    title: 'Chicken Recipes',
    description: 'Easy and delicious chicken recipes for every occasion.',
    seoKeywords: 'chicken recipe, chicken dinner',
    filter: (r) => r.main_ingredients.some((i) => i.toLowerCase().includes('chicken')),
  },
  'baking': {
    id: 'baking',
    title: 'Baking Recipes',
    description: 'Breads, cakes, cookies, and pastries from professional baking sources.',
    seoKeywords: 'baking recipes, bread, cake, pastry',
    filter: (r) => r.source === 'professional_baking' || r.category === 'dessert',
  },
  'air-fryer': {
    id: 'air-fryer',
    title: 'Air Fryer Recipes',
    description: 'Quick and healthy air fryer recipes.',
    seoKeywords: 'air fryer recipe, air fryer',
    filter: (r) =>
      r.name.toLowerCase().includes('air fryer') ||
      r.ingredients.some((i) => i.toLowerCase().includes('air fryer')),
  },
  'pasta': {
    id: 'pasta',
    title: 'Pasta & Italian Recipes',
    description: 'Classic pasta and Italian recipes — from carbonara to risotto.',
    seoKeywords: 'pasta recipe, italian recipe, italian food',
    filter: (r) => r.cuisine === 'italian',
  },
};

async function loadRecipeData(): Promise<Category[]> {
  const res = await fetch('/data/recipes-index.json');
  if (!res.ok) throw new Error(`Failed to load recipe data: ${res.status}`);
  return res.json();
}

export function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const collection = collectionId ? COLLECTIONS[collectionId] : undefined;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMeta({
    title: collection?.title,
    description: collection?.description,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: collectionId ? `${SITE_URL}/collection/${collectionId}` : SITE_URL,
  });

  useEffect(() => {
    loadRecipeData()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : t.collectionError))
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
          <p className="text-error text-lg font-body">{t.notFound}</p>
          <Link to="/" className="text-primary underline mt-2 inline-block">{t.backHome}</Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-lg font-body mt-4">{t.collectionLoading}</p>
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
        <Link to="/" className="text-primary text-sm hover:underline">{t.backHome}</Link>
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
          emptyMessage={t.collectionEmpty}
        />
      </div>
    </Layout>
  );
}

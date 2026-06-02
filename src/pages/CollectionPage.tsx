import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RecipeGrid } from '@/components/RecipeGrid';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useRecipes } from '@/hooks/useRecipes';
import { SITE_URL } from '@/lib/constants';
import { useT, useBasePath } from '@/lib/i18n';
import type { Recipe } from '@/types';

interface CollectionDef {
  id: string;
  title: string;
  description: string;
  seoKeywords: string;
  filter: (recipe: Recipe) => boolean;
}

const COLLECTIONS: Record<string, CollectionDef> = {
  // ── 中文专题（2026-06-02） ──────────────────────────────────────────
  'air-fryer': {
    id: 'air-fryer',
    title: '空气炸锅系列',
    description: '用空气炸锅做出美味佳肴，简单又健康',
    seoKeywords: '空气炸锅, air fryer, 炸鸡翅, 烤肉',
    filter: (r) => {
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return r.language === 'zh' && text.includes('空气炸锅');
    },
  },
  'microwave': {
    id: 'microwave',
    title: '微波炉快手菜',
    description: '叮一下就好，懒人必备',
    seoKeywords: '微波炉, microwave, 快手菜',
    filter: (r) => {
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return r.language === 'zh' && text.includes('微波炉');
    },
  },
  'rice-cooker': {
    id: 'rice-cooker',
    title: '电饭煲料理',
    description: '一个电饭煲搞定一餐，懒人福音',
    seoKeywords: '电饭煲, rice cooker, 焖饭, 懒人料理',
    filter: (r) => {
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return r.language === 'zh' && text.includes('电饭煲');
    },
  },
  'lazy-meal': {
    id: 'lazy-meal',
    title: '懒人菜谱',
    description: '简单省事，一学就会',
    seoKeywords: '懒人菜谱, 简单菜, 快手菜, 新手菜',
    filter: (r) => {
      if (r.language !== 'zh') return false;
      if (r.difficulty > 2) return false;
      if (r.cook_time !== 'quick') return false;
      const text = `${r.name} ${r.description || ''} ${r.steps_text || ''}`;
      // 使用更严格的关键词组合
      const strictKeywords = ['懒人', '省事', '一锅', '新手友好', '零失败', '小白'];
      const hasStrict = strictKeywords.some(kw => text.includes(kw));
      // 或者：名称中包含"简单"且难度为1
      const isSimpleAndEasy = r.name.includes('简单') && r.difficulty === 1;
      return hasStrict || isSimpleAndEasy;
    },
  },
  'rice-killer': {
    id: 'rice-killer',
    title: '下饭菜',
    description: '一口菜扒三碗饭',
    seoKeywords: '下饭菜, 拌饭, 盖饭, 炒饭',
    filter: (r) => {
      if (r.language !== 'zh') return false;
      if (r.difficulty > 2) return false;
      const text = `${r.name} ${r.description || ''} ${r.steps_text || ''}`;
      // 名称中包含关键词
      const nameKeywords = ['下饭', '拌饭', '盖饭', '炒饭'];
      const hasInName = nameKeywords.some(kw => r.name.includes(kw));
      // 或者描述中明确提到"下饭"
      const hasInDesc = text.includes('下饭');
      return hasInName || hasInDesc;
    },
  },
  'oven': {
    id: 'oven',
    title: '烤箱烘焙',
    description: '烤出美味，烘焙幸福',
    seoKeywords: '烤箱, oven, 烘焙, 烤肉, 烤鸡翅',
    filter: (r) => {
      if (r.language !== 'zh') return false;
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return text.includes('烤箱') || r.cooking_method === '烤';
    },
  },

  // ── 英文专题（保留原有） ─────────────────────────────────────────────
  // 'chinese-recipes': {
  //   id: 'chinese-recipes',
  //   title: 'Chinese Recipes',
  //   description: 'Authentic Chinese recipes — stir-fry, braised, steamed, and more.',
  //   seoKeywords: 'chinese recipe, chinese food, 中餐',
  //   filter: (r) => r.language === 'en' && r.cuisine === 'chinese',
  // },
  // 'chinese-all': {
  //   id: 'chinese-all',
  //   title: 'All Chinese Recipes',
  //   description: 'Complete collection of authentic Chinese recipes — 481+ dishes from every region.',
  //   seoKeywords: 'chinese recipe, chinese food, 中餐, all chinese recipes',
  //   filter: (r) => r.language !== 'en', // 中文菜谱
  // },
  // 'chicken-recipes': {
  //   id: 'chicken-recipes',
  //   title: 'Chicken Recipes',
  //   description: 'Easy and delicious chicken recipes for every occasion.',
  //   seoKeywords: 'chicken recipe, chicken dinner',
  //   filter: (r) => r.language === 'en' && r.main_ingredients.some((i) => i.toLowerCase().includes('chicken')),
  // },
  // 'baking': {
  //   id: 'baking',
  //   title: 'Baking Recipes',
  //   description: 'Breads, cakes, cookies, and pastries from professional baking sources.',
  //   seoKeywords: 'baking recipes, bread, cake, pastry',
  //   filter: (r) => r.language === 'en' && (r.source === 'professional_baking' || r.category === 'dessert'),
  // },
  // 'air-fryer-en': {
  //   id: 'air-fryer-en',
  //   title: 'Air Fryer Recipes',
  //   description: 'Quick and healthy air fryer recipes.',
  //   seoKeywords: 'air fryer recipe, air fryer',
  //   filter: (r) =>
  //     r.language === 'en' && (
  //       r.name.toLowerCase().includes('air fryer') ||
  //       r.ingredients.some((i) => i.toLowerCase().includes('air fryer'))
  //     ),
  // },
  // 'italian': {
  //   id: 'italian',
  //   title: 'Italian Recipes',
  //   description: 'Classic Italian dishes — pasta, risotto, and more.',
  //   seoKeywords: 'italian recipe, italian food, pasta',
  //   filter: (r) => r.language === 'en' && r.cuisine === 'italian',
  // },
  // 'french': {
  //   id: 'french',
  //   title: 'French Recipes',
  //   description: 'Elegant French cuisine — sauces, pastries, and refined dishes.',
  //   seoKeywords: 'french recipe, french cuisine, french food',
  //   filter: (r) => r.language === 'en' && r.cuisine === 'french',
  // },
  // 'japanese': {
  //   id: 'japanese',
  //   title: 'Japanese Recipes',
  //   description: 'Delicate Japanese flavors — sushi, ramen, and traditional dishes.',
  //   seoKeywords: 'japanese recipe, japanese food, sushi, ramen',
  //   filter: (r) => r.language === 'en' && r.cuisine === 'japanese',
  // },
};

export function CollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const collection = collectionId ? COLLECTIONS[collectionId] : undefined;
  const { recipes, loading, error } = useRecipes();
  const t = useT();
  const base = useBasePath();

  useMeta({
    title: collection?.title,
    description: collection?.description,
    ogImage: `${SITE_URL}/og.png`,
    ogUrl: collectionId ? `${SITE_URL}/collection/${collectionId}` : SITE_URL,
  });

  const filteredRecipes = useMemo(() => {
    if (!collection) return [];
    return recipes.filter(collection.filter);
  }, [recipes, collection]);

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

/**
 * Shared collection definitions for Home and CollectionPage.
 * Each collection has a filter function that determines which recipes belong to it.
 */
import type { Recipe } from '@/types';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  seoKeywords: string;
  emoji: string;
  filter: (recipe: Recipe) => boolean;
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  // ── 中文专题（2026-06-02） ──────────────────────────────────────────
  'air-fryer': {
    id: 'air-fryer',
    title: '空气炸锅系列',
    description: '用空气炸锅做出美味佳肴，简单又健康',
    seoKeywords: '空气炸锅, air fryer, 炸鸡翅, 烤肉',
    emoji: '🍳',
    filter: (r) => {
      if (!r.ingredients || r.language !== 'zh') return false;
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return text.includes('空气炸锅');
    },
  },
  'microwave': {
    id: 'microwave',
    title: '微波炉快手菜',
    description: '叮一下就好，懒人必备',
    seoKeywords: '微波炉, microwave, 快手菜',
    emoji: '📡',
    filter: (r) => {
      if (!r.ingredients || r.language !== 'zh') return false;
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return text.includes('微波炉');
    },
  },
  'rice-cooker': {
    id: 'rice-cooker',
    title: '电饭煲料理',
    description: '一个电饭煲搞定一餐，懒人福音',
    seoKeywords: '电饭煲, rice cooker, 焖饭, 懒人料理',
    emoji: '🍚',
    filter: (r) => {
      if (!r.ingredients || r.language !== 'zh') return false;
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return text.includes('电饭煲');
    },
  },
  'lazy-meal': {
    id: 'lazy-meal',
    title: '懒人菜谱',
    description: '简单省事，一学就会',
    seoKeywords: '懒人菜谱, 简单菜, 快手菜, 新手菜',
    emoji: '😴',
    filter: (r) => {
      if (r.language !== 'zh') return false;
      if (r.difficulty > 2) return false;
      if (r.cook_time !== 'quick') return false;
      const text = `${r.name} ${r.description || ''} ${r.steps_text || ''}`;
      const strictKeywords = ['懒人', '省事', '一锅', '新手友好', '零失败', '小白'];
      const hasStrict = strictKeywords.some(kw => text.includes(kw));
      const isSimpleAndEasy = r.name.includes('简单') && r.difficulty === 1;
      return hasStrict || isSimpleAndEasy;
    },
  },
  'rice-killer': {
    id: 'rice-killer',
    title: '下饭菜',
    description: '一口菜扒三碗饭',
    seoKeywords: '下饭菜, 拌饭, 盖饭, 炒饭',
    emoji: '🌶️',
    filter: (r) => {
      if (r.language !== 'zh') return false;
      if (r.difficulty > 2) return false;
      const text = `${r.name} ${r.description || ''} ${r.steps_text || ''}`;
      const nameKeywords = ['下饭', '拌饭', '盖饭', '炒饭'];
      const hasInName = nameKeywords.some(kw => r.name.includes(kw));
      const hasInDesc = text.includes('下饭');
      return hasInName || hasInDesc;
    },
  },
  'oven': {
    id: 'oven',
    title: '烤箱烘焙',
    description: '烤出美味，烘焙幸福',
    seoKeywords: '烤箱, oven, 烘焙, 烤肉, 烤鸡翅',
    emoji: '🔥',
    filter: (r) => {
      if (!r.ingredients || r.language !== 'zh') return false;
      const text = `${r.name} ${r.ingredients.join(' ')} ${r.steps_text || ''}`;
      return text.includes('烤箱') || r.cooking_method === '烤';
    },
  },
};

/** Ordered list of collection IDs for display (bento grid order). */
export const COLLECTION_IDS = [
  'air-fryer',
  'rice-killer',
  'lazy-meal',
  'microwave',
  'rice-cooker',
  'oven',
] as const;

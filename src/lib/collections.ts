/**
 * Shared collection definitions for Home and CollectionPage.
 * Each collection has a human-curated recipeIds list (形态 A).
 */
import { COLLECTION_RECIPES } from './collection-recipes';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  seoKeywords: string;
  recipeIds: string[];
  coverImage?: string;
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  'kitchen-appliances': {
    id: 'kitchen-appliances',
    title: '厨电料理',
    description: '不用明火也能做菜——空气炸锅、烤箱、微波炉、电饭煲，四种设备解锁厨房新姿势',
    seoKeywords: '空气炸锅, 烤箱, 微波炉, 电饭煲, 厨电料理, 无火烹饪',
    coverImage: '/images/collections/kitchen-appliances.webp',
    recipeIds: COLLECTION_RECIPES['kitchen-appliances'],
  },
  'lazy-meals': {
    id: 'lazy-meals',
    title: '懒人快手',
    description: '零失败入门菜——步骤少、食材常见、新手友好，帮厨房小白建立信心',
    seoKeywords: '懒人菜谱, 快手菜, 新手菜, 简单菜',
    coverImage: '/images/collections/lazy-meals.webp',
    recipeIds: COLLECTION_RECIPES['lazy-meals'],
  },
  'rice-killer': {
    id: 'rice-killer',
    title: '下饭菜',
    description: '一口菜扒三碗饭——咸鲜/辣/重口味，纯粹的食欲驱动',
    seoKeywords: '下饭菜, 拌饭, 盖饭, 米饭杀手',
    coverImage: '/images/collections/rice-killer.webp',
    recipeIds: COLLECTION_RECIPES['rice-killer'],
  },
  'noodles': {
    id: 'noodles',
    title: '面食专题',
    description: '面/饼/馒头/饺子——碳水的艺术，展示面食制作的工艺感',
    seoKeywords: '面食, 面条, 饺子, 馒头, 饼, 拉面',
    coverImage: '/images/collections/noodles.webp',
    recipeIds: COLLECTION_RECIPES['noodles'],
  },
  'summer': {
    id: 'summer',
    title: '夏日清凉',
    description: '夏天的味道——冷饮冰品、清凉甜品、凉拌菜、凉主食，消暑解腻',
    seoKeywords: '夏日, 冰品, 凉拌, 冷饮, 消暑, 甜品',
    coverImage: '/images/collections/summer.webp',
    recipeIds: COLLECTION_RECIPES['summer'],
  },
};

/** Ordered list of collection IDs for display (bento grid order). */
export const COLLECTION_IDS = [
  'kitchen-appliances',
  'lazy-meals',
  'rice-killer',
  'noodles',
  'summer',
] as const;

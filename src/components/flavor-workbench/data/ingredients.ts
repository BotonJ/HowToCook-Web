/**
 * Ingredient data loaded from recipe-embedding c3v2 model.
 * All flavor dimensions are 0-1 normalized.
 */

export interface Ingredient {
  id: string;
  name: string;       // Chinese
  nameEn: string;     // English
  category: 'meat' | 'vegetable' | 'spice' | 'dairy' | 'grain' | 'seafood' | 'fruit' | 'fermented' | 'other';
  flavor: {
    sweet: number;
    umami: number;
    fat: number;
    spicy: number;
    bitter: number;
    sour: number;
    [key: string]: number;
  };
  pca: [number, number]; // PCA-projected 2D coordinates
}

export interface CooccurrencePair {
  a: string;          // ingredient id
  b: string;
  pmi: number;        // Pointwise Mutual Information
  recipes: number;    // shared recipe count
}

export interface SurprisePair {
  a: string;
  b: string;
  semanticSim: number;
  pmi: number;
  culturalDist: number;
  score: number;
  explanation: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  difficulty: 1 | 2 | 3;
  time: string;
  tags: string[];
}

// ── Category colors ──────────────────────────────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  meat: '#ae3a04',
  vegetable: '#4a7c59',
  spice: '#e68a4f',
  dairy: '#7c4a7c',
  grain: '#a39b96',
  seafood: '#4a7c8c',
  fruit: '#c44569',
  fermented: '#6c5b3e',
  other: '#8c7168',
};

export const CATEGORY_LABELS: Record<string, string> = {
  meat: '肉类',
  vegetable: '蔬菜',
  spice: '香料',
  dairy: '乳制品',
  grain: '谷物',
  seafood: '海鲜',
  fruit: '水果',
  fermented: '发酵',
  other: '其他',
};

// ── Substitution types ───────────────────────────────────────

export interface Substitution {
  scenario: 'allergy' | 'vegan' | 'keto' | 'lowfat';
  label: string;
  icon: string;
  replace: string;
  with: string;
  reason: string;
}

export interface Allergen {
  id: string;
  name: string;
  icon: string;
  relatedIngredients: string[];
}

// ── Private mutable state ──────────────────────────────────────

const state = {
  ingredients: [] as Ingredient[],
  cooccurrencePairs: [] as CooccurrencePair[],
  surprisePairs: [] as SurprisePair[],
  recipes: [] as Recipe[],
  substitutions: [] as Substitution[],
  commonAllergens: [] as Allergen[],
  scenarioExplanations: {} as Record<string, string>,
};

// ── Getters (immutable — return the same array reference) ──────

export const getIngredients = () => state.ingredients;
export const getCooccurrencePairs = () => state.cooccurrencePairs;
export const getSurprisePairs = () => state.surprisePairs;
export const getRecipes = () => state.recipes;
export const getSubstitutions = () => state.substitutions;
export const getCommonAllergens = () => state.commonAllergens;
export const getScenarioExplanations = () => state.scenarioExplanations;

// ── Data loader ──────────────────────────────────────────────

let loaded = false;

export async function loadWorkbenchData(): Promise<void> {
  if (loaded) return;

  // Strategy: try real data first; if ingredients exist but recipes don't,
  // fall back to full mock data because IDs are incompatible between real and mock.
  let useRealData = false;

  try {
    const resp = await fetch('/data/flavor-workbench/workbench-data.json');
    if (resp.ok) {
      const data = await resp.json();
      if (data.ingredients?.length && data.recipes?.length) {
        // Real data is complete — use it
        state.ingredients = data.ingredients;
        state.cooccurrencePairs = data.cooccurrence || [];
        state.surprisePairs = data.surprise || [];
        state.recipes = data.recipes;
        state.substitutions = data.substitutions || [];
        state.commonAllergens = data.allergens || [];
        state.scenarioExplanations = data.scenarioExplanations || {};
        useRealData = true;
      }
    }
  } catch {
    // Fall through to mock data
  }

  if (!useRealData) {
    await loadMockData();
  }
  loaded = true;
}

export function isWorkbenchDataLoaded(): boolean {
  return loaded;
}

// ── Mock data (fallback when recipe-embedding data unavailable) ──

async function loadMockData(): Promise<void> {
  state.ingredients = [
    { id: 'chicken', name: '鸡肉', nameEn: 'Chicken', category: 'meat', flavor: { sweet: 0.1, umami: 0.6, fat: 0.5, spicy: 0, bitter: 0, sour: 0 }, pca: [-80, 40] },
    { id: 'pork', name: '猪肉', nameEn: 'Pork', category: 'meat', flavor: { sweet: 0.15, umami: 0.7, fat: 0.7, spicy: 0, bitter: 0, sour: 0 }, pca: [-90, 60] },
    { id: 'beef', name: '牛肉', nameEn: 'Beef', category: 'meat', flavor: { sweet: 0.05, umami: 0.8, fat: 0.6, spicy: 0, bitter: 0.05, sour: 0 }, pca: [-100, 50] },
    { id: 'lamb', name: '羊肉', nameEn: 'Lamb', category: 'meat', flavor: { sweet: 0.05, umami: 0.65, fat: 0.6, spicy: 0.1, bitter: 0.05, sour: 0 }, pca: [-95, 70] },
    { id: 'duck', name: '鸭肉', nameEn: 'Duck', category: 'meat', flavor: { sweet: 0.1, umami: 0.7, fat: 0.75, spicy: 0, bitter: 0, sour: 0 }, pca: [-85, 55] },
    { id: 'fish-sauce', name: '鱼露', nameEn: 'Fish Sauce', category: 'fermented', flavor: { sweet: 0.05, umami: 0.95, fat: 0.05, spicy: 0, bitter: 0, sour: 0.2 }, pca: [100, 30] },
    { id: 'shrimp', name: '虾', nameEn: 'Shrimp', category: 'seafood', flavor: { sweet: 0.2, umami: 0.75, fat: 0.15, spicy: 0, bitter: 0, sour: 0 }, pca: [60, 20] },
    { id: 'shrimp-paste', name: '虾酱', nameEn: 'Shrimp Paste', category: 'fermented', flavor: { sweet: 0.05, umami: 0.9, fat: 0.1, spicy: 0.05, bitter: 0, sour: 0.15 }, pca: [90, 40] },
    { id: 'salmon', name: '三文鱼', nameEn: 'Salmon', category: 'seafood', flavor: { sweet: 0.1, umami: 0.7, fat: 0.65, spicy: 0, bitter: 0, sour: 0.05 }, pca: [50, 45] },
    { id: 'ginger', name: '生姜', nameEn: 'Ginger', category: 'spice', flavor: { sweet: 0.1, umami: 0.1, fat: 0, spicy: 0.7, bitter: 0.1, sour: 0.05 }, pca: [30, -60] },
    { id: 'garlic', name: '大蒜', nameEn: 'Garlic', category: 'spice', flavor: { sweet: 0.1, umami: 0.3, fat: 0, spicy: 0.6, bitter: 0.1, sour: 0 }, pca: [20, -50] },
    { id: 'scallion', name: '葱', nameEn: 'Scallion', category: 'vegetable', flavor: { sweet: 0.15, umami: 0.15, fat: 0, spicy: 0.4, bitter: 0.05, sour: 0 }, pca: [10, -40] },
    { id: 'chili', name: '辣椒', nameEn: 'Chili', category: 'spice', flavor: { sweet: 0.05, umami: 0.1, fat: 0, spicy: 0.95, bitter: 0.1, sour: 0.05 }, pca: [40, -80] },
    { id: 'lemongrass', name: '香茅', nameEn: 'Lemongrass', category: 'spice', flavor: { sweet: 0.1, umami: 0.05, fat: 0, spicy: 0.3, bitter: 0.05, sour: 0.2 }, pca: [50, -55] },
    { id: 'galangal', name: '南姜', nameEn: 'Galangal', category: 'spice', flavor: { sweet: 0.05, umami: 0.1, fat: 0, spicy: 0.5, bitter: 0.15, sour: 0.05 }, pca: [45, -65] },
    { id: 'tofu', name: '豆腐', nameEn: 'Tofu', category: 'grain', flavor: { sweet: 0.1, umami: 0.3, fat: 0.2, spicy: 0, bitter: 0, sour: 0 }, pca: [-20, 10] },
    { id: 'mushroom', name: '蘑菇', nameEn: 'Mushroom', category: 'vegetable', flavor: { sweet: 0.05, umami: 0.7, fat: 0.05, spicy: 0, bitter: 0.05, sour: 0 }, pca: [-10, 30] },
    { id: 'eggplant', name: '茄子', nameEn: 'Eggplant', category: 'vegetable', flavor: { sweet: 0.15, umami: 0.2, fat: 0.1, spicy: 0, bitter: 0.05, sour: 0 }, pca: [-5, -10] },
    { id: 'tomato', name: '番茄', nameEn: 'Tomato', category: 'fruit', flavor: { sweet: 0.4, umami: 0.35, fat: 0.05, spicy: 0, bitter: 0.05, sour: 0.5 }, pca: [20, -20] },
    { id: 'coconut-milk', name: '椰奶', nameEn: 'Coconut Milk', category: 'dairy', flavor: { sweet: 0.4, umami: 0.1, fat: 0.8, spicy: 0, bitter: 0, sour: 0 }, pca: [-40, -30] },
    { id: 'soy-sauce', name: '酱油', nameEn: 'Soy Sauce', category: 'fermented', flavor: { sweet: 0.15, umami: 0.85, fat: 0.05, spicy: 0, bitter: 0.05, sour: 0.1 }, pca: [80, 20] },
    { id: 'oyster-sauce', name: '蚝油', nameEn: 'Oyster Sauce', category: 'fermented', flavor: { sweet: 0.25, umami: 0.8, fat: 0.1, spicy: 0, bitter: 0, sour: 0.05 }, pca: [75, 35] },
    { id: 'vinegar', name: '醋', nameEn: 'Vinegar', category: 'fermented', flavor: { sweet: 0.05, umami: 0.1, fat: 0, spicy: 0, bitter: 0, sour: 0.95 }, pca: [60, -40] },
    { id: 'rice', name: '米饭', nameEn: 'Rice', category: 'grain', flavor: { sweet: 0.3, umami: 0.15, fat: 0.05, spicy: 0, bitter: 0, sour: 0 }, pca: [-30, -5] },
    { id: 'noodle', name: '面条', nameEn: 'Noodle', category: 'grain', flavor: { sweet: 0.2, umami: 0.2, fat: 0.1, spicy: 0, bitter: 0, sour: 0 }, pca: [-25, 5] },
    { id: 'sesame-oil', name: '芝麻油', nameEn: 'Sesame Oil', category: 'spice', flavor: { sweet: 0.1, umami: 0.2, fat: 0.85, spicy: 0.05, bitter: 0.05, sour: 0 }, pca: [10, 50] },
    { id: 'peanut', name: '花生', nameEn: 'Peanut', category: 'grain', flavor: { sweet: 0.15, umami: 0.3, fat: 0.7, spicy: 0, bitter: 0.05, sour: 0 }, pca: [-15, 40] },
    { id: 'egg', name: '鸡蛋', nameEn: 'Egg', category: 'dairy', flavor: { sweet: 0.05, umami: 0.5, fat: 0.5, spicy: 0, bitter: 0, sour: 0 }, pca: [-25, 20] },
    { id: 'cilantro', name: '香菜', nameEn: 'Cilantro', category: 'vegetable', flavor: { sweet: 0.05, umami: 0.1, fat: 0, spicy: 0.15, bitter: 0.1, sour: 0.05 }, pca: [25, -35] },
    { id: 'basil', name: '罗勒', nameEn: 'Basil', category: 'spice', flavor: { sweet: 0.1, umami: 0.1, fat: 0, spicy: 0.2, bitter: 0.1, sour: 0 }, pca: [35, -45] },
    { id: 'star-anise', name: '八角', nameEn: 'Star Anise', category: 'spice', flavor: { sweet: 0.2, umami: 0.05, fat: 0, spicy: 0.3, bitter: 0.15, sour: 0 }, pca: [55, -70] },
    { id: 'cinnamon', name: '肉桂', nameEn: 'Cinnamon', category: 'spice', flavor: { sweet: 0.35, umami: 0, fat: 0, spicy: 0.4, bitter: 0.1, sour: 0 }, pca: [45, -75] },
    { id: 'sichuan-pepper', name: '花椒', nameEn: 'Sichuan Pepper', category: 'spice', flavor: { sweet: 0, umami: 0.05, fat: 0, spicy: 0.85, bitter: 0.2, sour: 0.05 }, pca: [50, -85] },
    { id: 'bell-pepper', name: '甜椒', nameEn: 'Bell Pepper', category: 'vegetable', flavor: { sweet: 0.5, umami: 0.1, fat: 0, spicy: 0.05, bitter: 0.05, sour: 0.1 }, pca: [15, -25] },
    { id: 'cabbage', name: '白菜', nameEn: 'Cabbage', category: 'vegetable', flavor: { sweet: 0.2, umami: 0.15, fat: 0, spicy: 0.05, bitter: 0.05, sour: 0.05 }, pca: [-5, -20] },
    { id: 'carrot', name: '胡萝卜', nameEn: 'Carrot', category: 'vegetable', flavor: { sweet: 0.55, umami: 0.1, fat: 0, spicy: 0, bitter: 0.05, sour: 0.05 }, pca: [0, -30] },
    { id: 'potato', name: '土豆', nameEn: 'Potato', category: 'vegetable', flavor: { sweet: 0.15, umami: 0.2, fat: 0.05, spicy: 0, bitter: 0, sour: 0 }, pca: [-20, 0] },
    { id: 'corn', name: '玉米', nameEn: 'Corn', category: 'grain', flavor: { sweet: 0.6, umami: 0.15, fat: 0.1, spicy: 0, bitter: 0, sour: 0 }, pca: [-10, -15] },
    { id: 'lime', name: '青柠', nameEn: 'Lime', category: 'fruit', flavor: { sweet: 0.1, umami: 0.05, fat: 0, spicy: 0, bitter: 0.1, sour: 0.9 }, pca: [55, -35] },
    { id: 'lemon', name: '柠檬', nameEn: 'Lemon', category: 'fruit', flavor: { sweet: 0.1, umami: 0.05, fat: 0, spicy: 0, bitter: 0.1, sour: 0.85 }, pca: [50, -30] },
  ];

  state.cooccurrencePairs = [
    { a: 'chicken', b: 'ginger', pmi: 2.8, recipes: 87 },
    { a: 'chicken', b: 'scallion', pmi: 2.5, recipes: 72 },
    { a: 'chicken', b: 'soy-sauce', pmi: 2.3, recipes: 65 },
    { a: 'chicken', b: 'garlic', pmi: 2.1, recipes: 58 },
    { a: 'chicken', b: 'sesame-oil', pmi: 1.8, recipes: 42 },
    { a: 'pork', b: 'soy-sauce', pmi: 3.1, recipes: 95 },
    { a: 'pork', b: 'garlic', pmi: 2.6, recipes: 78 },
    { a: 'pork', b: 'ginger', pmi: 2.2, recipes: 60 },
    { a: 'pork', b: 'scallion', pmi: 2.0, recipes: 55 },
    { a: 'beef', b: 'soy-sauce', pmi: 2.9, recipes: 88 },
    { a: 'beef', b: 'garlic', pmi: 2.4, recipes: 70 },
    { a: 'beef', b: 'star-anise', pmi: 2.7, recipes: 35 },
    { a: 'beef', b: 'sichuan-pepper', pmi: 1.9, recipes: 28 },
    { a: 'tofu', b: 'soy-sauce', pmi: 2.5, recipes: 68 },
    { a: 'tofu', b: 'scallion', pmi: 2.2, recipes: 52 },
    { a: 'tofu', b: 'sesame-oil', pmi: 2.0, recipes: 45 },
    { a: 'shrimp', b: 'garlic', pmi: 2.6, recipes: 75 },
    { a: 'shrimp', b: 'ginger', pmi: 2.3, recipes: 62 },
    { a: 'shrimp', b: 'scallion', pmi: 2.1, recipes: 50 },
    { a: 'tomato', b: 'egg', pmi: 2.8, recipes: 90 },
    { a: 'tomato', b: 'garlic', pmi: 2.0, recipes: 48 },
    { a: 'rice', b: 'soy-sauce', pmi: 1.8, recipes: 55 },
    { a: 'rice', b: 'egg', pmi: 1.6, recipes: 40 },
    { a: 'noodle', b: 'soy-sauce', pmi: 2.4, recipes: 65 },
    { a: 'noodle', b: 'sesame-oil', pmi: 2.1, recipes: 50 },
    { a: 'coconut-milk', b: 'lemongrass', pmi: 3.2, recipes: 42 },
    { a: 'coconut-milk', b: 'galangal', pmi: 2.9, recipes: 35 },
    { a: 'coconut-milk', b: 'chili', pmi: 2.1, recipes: 30 },
    { a: 'fish-sauce', b: 'lime', pmi: 3.0, recipes: 48 },
    { a: 'fish-sauce', b: 'chili', pmi: 2.8, recipes: 45 },
    { a: 'fish-sauce', b: 'garlic', pmi: 2.5, recipes: 40 },
    { a: 'garlic', b: 'chili', pmi: 2.4, recipes: 65 },
    { a: 'garlic', b: 'ginger', pmi: 2.2, recipes: 55 },
    { a: 'vinegar', b: 'soy-sauce', pmi: 2.3, recipes: 50 },
    { a: 'vinegar', b: 'ginger', pmi: 1.9, recipes: 35 },
    { a: 'cilantro', b: 'lime', pmi: 2.6, recipes: 38 },
    { a: 'cilantro', b: 'chili', pmi: 2.2, recipes: 42 },
    { a: 'basil', b: 'chili', pmi: 2.5, recipes: 35 },
    { a: 'basil', b: 'garlic', pmi: 2.3, recipes: 32 },
    { a: 'peanut', b: 'chili', pmi: 2.1, recipes: 28 },
    { a: 'peanut', b: 'sesame-oil', pmi: 1.8, recipes: 22 },
    { a: 'mushroom', b: 'soy-sauce', pmi: 2.4, recipes: 45 },
    { a: 'mushroom', b: 'garlic', pmi: 2.1, recipes: 38 },
    { a: 'sesame-oil', b: 'soy-sauce', pmi: 2.7, recipes: 72 },
    { a: 'sesame-oil', b: 'scallion', pmi: 2.3, recipes: 55 },
  ];

  state.surprisePairs = [
    { a: 'chicken', b: 'coconut-milk', semanticSim: 0.72, pmi: 0.3, culturalDist: 0.8, score: 0.46, explanation: '化学相似度高但中餐很少搭配——东南亚经典组合' },
    { a: 'beef', b: 'lime', semanticSim: 0.65, pmi: 0.2, culturalDist: 0.85, score: 0.44, explanation: '牛肉的铁质与青柠的酸产生意外的清新感' },
    { a: 'tofu', b: 'star-anise', semanticSim: 0.58, pmi: 0.15, culturalDist: 0.7, score: 0.34, explanation: '豆腐的温和遇上八角的浓烈——卤水豆腐的隐藏配方' },
    { a: 'shrimp', b: 'coconut-milk', semanticSim: 0.68, pmi: 0.25, culturalDist: 0.75, score: 0.38, explanation: '虾的鲜甜与椰奶的醇厚——泰式咖喱的灵魂' },
    { a: 'mushroom', b: 'sesame-oil', semanticSim: 0.75, pmi: 0.4, culturalDist: 0.3, score: 0.32, explanation: '菌菇的鲜与芝麻的香——被低估的黄金搭档' },
    { a: 'pork', b: 'fish-sauce', semanticSim: 0.7, pmi: 0.35, culturalDist: 0.65, score: 0.29, explanation: '猪肉遇上鱼露——越南 phở 的秘密武器' },
  ];

  state.recipes = [
    { id: 'r1', name: '宫保鸡丁', ingredients: ['chicken', 'peanut', 'chili', 'scallion', 'soy-sauce', 'vinegar'], difficulty: 2, time: '25 min', tags: ['经典', '下饭'] },
    { id: 'r2', name: '红烧肉', ingredients: ['pork', 'soy-sauce', 'star-anise', 'ginger', 'scallion'], difficulty: 2, time: '90 min', tags: ['经典', '炖煮'] },
    { id: 'r3', name: '麻婆豆腐', ingredients: ['tofu', 'pork', 'sichuan-pepper', 'chili', 'garlic', 'scallion'], difficulty: 2, time: '20 min', tags: ['川菜', '下饭'] },
    { id: 'r4', name: '冬阴功汤', ingredients: ['shrimp', 'coconut-milk', 'lemongrass', 'galangal', 'chili', 'lime', 'fish-sauce'], difficulty: 3, time: '35 min', tags: ['泰式', '汤'] },
    { id: 'r5', name: '番茄炒蛋', ingredients: ['tomato', 'egg', 'scallion', 'sugar'], difficulty: 1, time: '10 min', tags: ['家常', '快手'] },
    { id: 'r6', name: '蒜蓉虾', ingredients: ['shrimp', 'garlic', 'scallion', 'sesame-oil', 'soy-sauce'], difficulty: 1, time: '15 min', tags: ['快手', '海鲜'] },
    { id: 'r7', name: '鱼香茄子', ingredients: ['eggplant', 'garlic', 'ginger', 'chili', 'soy-sauce', 'vinegar', 'scallion'], difficulty: 2, time: '20 min', tags: ['川菜', '素菜'] },
    { id: 'r8', name: '椰奶咖喱鸡', ingredients: ['chicken', 'coconut-milk', 'chili', 'lemongrass', 'galangal', 'basil'], difficulty: 2, time: '40 min', tags: ['东南亚', '咖喱'] },
    { id: 'r9', name: '凉拌木耳', ingredients: ['mushroom', 'garlic', 'vinegar', 'sesame-oil', 'cilantro', 'chili'], difficulty: 1, time: '10 min', tags: ['凉菜', '素食'] },
    { id: 'r10', name: '担担面', ingredients: ['noodle', 'pork', 'sesame-oil', 'chili', 'sichuan-pepper', 'scallion', 'peanut'], difficulty: 2, time: '25 min', tags: ['川菜', '面食'] },
    { id: 'r11', name: '蚝油牛肉', ingredients: ['beef', 'oyster-sauce', 'garlic', 'ginger', 'scallion', 'bell-pepper'], difficulty: 2, time: '20 min', tags: ['粤菜', '快炒'] },
    { id: 'r12', name: '酸辣汤', ingredients: ['tofu', 'mushroom', 'egg', 'vinegar', 'chili', 'scallion', 'sesame-oil'], difficulty: 2, time: '20 min', tags: ['汤', '酸辣'] },
  ];

  state.substitutions = [
    { scenario: 'allergy', label: '过敏', icon: '⚠️', replace: 'peanut', with: 'sesame-oil', reason: '花生过敏 → 芝麻油替代' },
    { scenario: 'allergy', label: '过敏', icon: '⚠️', replace: 'shrimp', with: 'tofu', reason: '海鲜过敏 → 豆腐替代蛋白质' },
    { scenario: 'vegan', label: '素食', icon: '🌱', replace: 'chicken', with: 'tofu', reason: '鸡肉 → 豆腐（蛋白质替代）' },
    { scenario: 'vegan', label: '素食', icon: '🌱', replace: 'pork', with: 'mushroom', reason: '猪肉 → 蘑菇（鲜味替代）' },
    { scenario: 'vegan', label: '素食', icon: '🌱', replace: 'fish-sauce', with: 'soy-sauce', reason: '鱼露 → 酱油（鲜味替代）' },
    { scenario: 'keto', label: '生酮', icon: '🥑', replace: 'rice', with: 'tofu', reason: '米饭（高碳水）→ 豆腐（低碳水）' },
    { scenario: 'keto', label: '生酮', icon: '🥑', replace: 'noodle', with: 'eggplant', reason: '面条（高碳水）→ 茄子（低碳水）' },
    { scenario: 'lowfat', label: '减脂', icon: '💪', replace: 'pork', with: 'chicken', reason: '猪肉（高脂）→ 鸡胸肉（低脂）' },
    { scenario: 'lowfat', label: '减脂', icon: '💪', replace: 'coconut-milk', with: 'tofu', reason: '椰奶（高脂）→ 豆腐（低脂）' },
  ];

  state.commonAllergens = [
    { id: 'peanut', name: '花生', icon: '🥜', relatedIngredients: ['peanut'] },
    { id: 'shellfish', name: '虾蟹', icon: '🦐', relatedIngredients: ['shrimp', 'shrimp-paste'] },
    { id: 'seafood', name: '海鲜', icon: '🐟', relatedIngredients: ['shrimp', 'shrimp-paste', 'salmon', 'fish-sauce'] },
    { id: 'soy', name: '大豆', icon: '🫘', relatedIngredients: ['tofu', 'soy-sauce'] },
    { id: 'sesame', name: '芝麻', icon: '🫙', relatedIngredients: ['sesame-oil'] },
    { id: 'egg', name: '鸡蛋', icon: '🥚', relatedIngredients: ['egg'] },
  ];

  state.scenarioExplanations = {
    allergy: '排除含有特定过敏原的菜谱。点击后选择你要排除的过敏源（花生、海鲜、大豆等），也可以自定义输入。',
    vegan: '排除所有含肉类、海鲜、动物制品的菜谱，只保留纯素食选项。',
    keto: '排除高碳水食材（米饭、面条、土豆等）的菜谱，保留低碳水、高脂肪的选项。',
    lowfat: '优先推荐使用低脂食材（鸡胸肉、豆腐、蔬菜）的菜谱，排除高脂肪搭配。',
  };
}

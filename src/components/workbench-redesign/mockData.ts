/**
 * Mock data for Phase 1: Three-Tab skeleton with mock data.
 * All data represents "chicken" as the selected ingredient.
 * Replace with real epicure/recipe-embedding data in Phase 2+.
 */

// ─── Flavor Profile ─────────────────────────────────────────────────────────

export interface FlavorProfile {
  sweet: number; // 0–10
  sour: number;
  bitter: number;
  umami: number;
  spicy: number;
  fatty: number;
}

export const MOCK_FLAVOR_PROFILE: FlavorProfile = {
  sweet: 1.5,
  sour: 2.0,
  bitter: 1.0,
  umami: 7.5,
  spicy: 1.0,
  fatty: 5.5,
};

// ─── Flavor Wheel Neighbors ───────────────────────────────────────────────────

export interface Neighbor {
  name: string;
  score: number; // similarity0–1
  emoji: string;
}

export const MOCK_NEIGHBORS: Neighbor[] = [
  { name: '猪肉', score: 0.92, emoji: '🐷' },
  { name: '牛肉', score: 0.89, emoji: '🥩' },
  { name: '虾', score: 0.85, emoji: '🦐' },
  { name: '鱼', score: 0.83, emoji: '🐟' },
  { name: '豆腐', score: 0.79, emoji: '🧈' },
  { name: '鸡蛋', score: 0.76, emoji: '🥚' },
  { name: '蘑菇', score: 0.73, emoji: '🍄' },
  { name: '姜', score: 0.70, emoji:'🫚' },
  { name: '葱', score: 0.68, emoji: '🧅' },
];

// ─── SLERP Results ──────────────────────────────────────────────────────────

export type SlerpAngle = '0°' | '30°' | '60°' | '90°';

export interface SlerpResult {
  angle: SlerpAngle;
  items: string[]; // e.g. "鸡肝(0.94)"
}

export const MOCK_SLERP_RESULTS: SlerpResult[] = [
  { angle: '0°', items: ['鸡肝(0.94)', '鸡胸(0.91)'] },
  { angle: '30°', items: ['椰奶(0.82)', '柠檬草(0.76)'] },
  { angle: '60°', items: ['鱼露(0.71)', '南姜(0.68)'] },
  { angle: '90°', items: ['虾酱(0.65)', '青柠叶(0.62)'] },
];

// ─── Classic Pairings ───────────────────────────────────────────────────────

export interface Pairing {
  emoji: string;
  name: string;
  pmi: number;
  compound: string;
}

export const MOCK_CLASSIC_PAIRINGS: Pairing[] = [
  { emoji: '🧄', name: '大蒜', pmi: 4.2, compound: '谷氨酸盐协同' },
  { emoji: '🧅', name: '洋葱', pmi: 3.8, compound: '硫化物基底' },
  { emoji: '🫚', name: '生姜', pmi: 3.5, compound: '姜辣素提鲜' },
  { emoji: '🫘', name: '酱油', pmi: 3.2, compound: '美拉德增色' },
];

// ─── Flavor Bridges ─────────────────────────────────────────────────────────

export interface FlavorBridge {
  emoji: string;
  pair: string;
  compound: string;
  description: string;
  strength: '极高' | '高' | '中等';
}

export const MOCK_FLAVOR_BRIDGES: FlavorBridge[] = [
  {
    emoji: '🍓',
    pair: '草莓 + 帕马森干酪',
    compound: '异戊酸 (Isovaleric Acid)',
    description: '两者均含有这种短链脂肪酸，带来成熟水果与陈年奶酪交织的奇妙层次。',
    strength: '极高',
  },
  {
    emoji: '☕',
    pair: '咖啡 + 烤牛肉',
    compound: '美拉德反应物',
    description: '烘焙与烤制过程中产生的吡嗪和呋喃类化合物，形成深邃的焦糖与肉香共振。',
    strength: '高',
  },
  {
    emoji: '🥒',
    pair: '黄瓜 + 牡蛎',
    compound: '壬烯醛 (Nonenal)',
    description: '强烈的清新海洋与瓜果气息，完美呼应海水的咸鲜，提升整体清爽度。',
    strength: '中等',
  },
  {
    emoji: '🍫',
    pair: '白巧克力 + 鱼子酱',
    compound: '三甲胺 (Trimethylamine)',
    description: '白巧克力的可可脂与鱼子酱的海鲜胺类结合，创造出丰富的鲜甜奶油质感。',
    strength: '高',
  },
];

// ─── Scenario Substitutes ───────────────────────────────────────────────────

export type Scenario = 'vegan' | 'keto' | 'raw' | 'low-fat';

export interface Substitute {
  replaces: string;
  with: string;
}

export const MOCK_SUBSTITUTES: Record<Scenario, Substitute[]> = {
  vegan: [
    { replaces: '鸡肉', with: '豆腐 + 蘑菇' },
    { replaces: '酱油', with: '椰氨基酱油' },
  ],
  keto: [
    { replaces: '土豆', with: '花椰菜泥' },
    { replaces: '蜂蜜', with: '赤藓糖醇 + 香草荚' },
  ],
  raw: [
    { replaces: '酱油', with: 'Tamari（无添加）' },
    { replaces: '味淋', with: '椰糖' },
  ],
  'low-fat': [
    { replaces: '五花肉', with: '鸡胸肉' },
    { replaces: '奶油', with: '希腊酸奶' },
  ],
};

// ─── Recipes ────────────────────────────────────────────────────────────────

export interface Recipe {
  title: string;
 鲜: number;
  脂: number;
  ingredients: string[];
}

export const MOCK_RECIPES: Recipe[] = [
  { title: '红烧鸡腿', 鲜: 8.2, 脂: 6.1, ingredients: ['鸡肉', '大蒜', '生姜', '酱油'] },
  { title: '宫保鸡丁', 鲜: 7.8, 脂: 5.5, ingredients: ['鸡肉', '花生', '辣椒', '葱'] },
  { title: '白切鸡', 鲜: 8.5, 脂: 4.2, ingredients: ['鸡肉', '葱', '姜', '蒜'] },
  { title: '鸡汤面', 鲜: 7.2, 脂: 3.8, ingredients: ['鸡肉', '面条', '葱', '姜'] },
];

// ─── Synthesis Radar ─────────────────────────────────────────────────────────

export const MOCK_SYNTHESIS_DATA = {
  umami: 7.5,
  sweet: 1.5,
  bitter: 1.0,
  fatty: 5.5,
  salty: 2.0,
  sour: 2.0,
  spicy: 1.0,
};

export const MOCK_EVALUATION_TEXT =
  '鸡肉的高鲜味基底构建了深厚的咸鲜基础。大蒜引入的硫化物和大蒜素形成化学桥梁，' +
  '在提鲜的同时带来微妙辛香。酱油中的氨基酸与鸡肉蛋白质发生美拉德反应，' +
  '生成棕褐色泽和复杂酱香。这是一组高度可行的搭配，适合红烧、炒制等多种烹饪方式。';
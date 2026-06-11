/**
 * Ingredient normalization for flavor workbench.
 * Cleans 326 active ingredients by mapping noise to real ingredients,
 * deleting non-food entries, and merging duplicates.
 *
 * Source: 326 active ingredients noise analysis (2026-06-09)
 */

import type { Ingredient, CooccurrencePair, SurprisePair } from './ingredients';

// ── Delete patterns (pure noise, no real ingredient mapping) ───

export const DELETE_PATTERNS: RegExp[] = [
  /^[）＊\*]/,                    // 括号/星号开头
  /^(材料|配方|面团|做法|方法)[一二三1-5]/,  // 步骤编号
  /^(第一|第二|第三)(步|层|部分)/,           // 步骤描述
  /^(看着来|随便)/,               // 模糊量词
  /^(分钟|度温度|张滤纸)/,        // 非食材
  /^(早餐|午餐|晚餐|主食类|水果类|肉蛋类|蔬菜类)/,  // 餐食类别
  /(蛋白|蛋黄)(用|糊|霜|部分|材料)/,  // 烘焙分区
  /(料勺|平勺|铲|飯勺|湯匙|半料勺|一料勺)/,  // 量具
  /^(原料准备|调料准备|量材料)/,   // 步骤描述
  /练切$/,                        // 烘焙工艺
  /^(丝袜|手冲壶|分享壶|酵素机|枫叶|^母$|^酵$|^ｇ$)/,  // 非食材
  // ── 设备/工具/非食材 ──
  /^(一台|家用|普通家用)/,         // 设备前缀
  /咖啡机|微波炉|烤箱|破壁机|料理机|搅拌机|榨汁机|原汁机|豆浆机|冰箱|磨豆机|酸奶机/,  // 设备
  /拉花嘴|压粉锤|滤纸|模具|裱花袋|裱花嘴|锡纸|油纸|保鲜膜/,  // 工具
  /脂肪含量|蛋白质含量|热量/,       // 营养指标
  /^「[a-d]$/,                     // 残留引号标签
  /^#[A-D]$/,                      // 井号标签
];

// ── Exact delete (pure noise, no mapping) ─────────────────────

export const DELETE_EXACT = new Set([
  '水①', '水②', '面团一', '面团二', '配方一', '配方二',
  '材料一', '材料二', '材料三', '做法一', '做法二',
  '方法一', '方法二', '上层', '下层', '干料', '湿料',
  '干性材料', '湿性材料', '辅料', '主料',
  '白色部分', '红色部分', '绿色部分', '黄色部分',
  '蛋白部分', '蛋黄部分', '布丁层', '布丁材料', '布丁部分',
  '布朗尼部分', '焦糖层', '焦糖材料', '焦糖部分',
  '芝士部分', '桂花层', '椰汁层',
  '细砂糖①', '细砂糖②',
  '份蛋白', '份蛋黄', '蛋白质', '碳水化合物',
  '健康', '营养', '热饭', '黄', '牛', '蛋', '奶',
  'ｇ', '母', '酵',
  // 烘焙术语/泛化词
  '熟浆', '生浆', '转化糖浆', '枧水',
  // 泛化词/食品添加剂（非具体食材）
  '食品添加剂', '海藻酸钠',
]);

// ── Brand → generic name ─────────────────────────────────────

export const BRAND_MAP: Record<string, string> = {
  '极妙原鲜酱油': '生抽', '极妙红烧酱油': '老抽', '极妙麻辣红油': '红油',
  '臻品蚝油': '蚝油', '臻品料酒': '料酒', '臻品特级生抽': '生抽',
  '易小焙细砂糖': '白糖', '新良酵母': '酵母', '展艺酵母': '酵母',
  '展艺高筋粉': '高筋面粉', '展艺白巧克力': '白巧克力', '展艺黑巧克力': '黑巧克力',
  '丸庄生抽': '生抽', '丸庄老抽': '老抽',
  '可达怡海盐': '海盐', '可达怡黑胡椒': '黑胡椒',
  '黄记煌照烧汁': '照烧汁', '黄记煌酱汁': '酱汁',
  '佳沛阳光金果': '猕猴桃', '小鲜侣': '鸡精',
  '海皇芝麻油': '麻油', '酱油心生': '生抽',
  '特级金标生抽': '生抽', '特级草菇老抽': '老抽', '特级老抽': '老抽',
  '冰糖老抽酱油': '老抽', '日本寿司醋': '米醋',
  '锅酱': '甜面酱', '鲜香红烧': '红烧酱',
};

// ── Measurement prefix strip ("铲生抽" → "生抽") ─────────────

export const MEASUREMENT_PREFIX_MAP: Record<string, string> = {
  '铲生抽': '生抽', '铲老抽': '老抽',
  '料勺香油': '麻油', '料勺芝麻': '芝麻', '料勺白糖': '白糖',
  '料勺料油': '料油', '料勺十三香': '十三香',
  '平勺生抽': '生抽', '平勺老抽': '老抽',
  '平铲生抽': '生抽', '平铲老抽': '老抽',
  '飯勺料酒': '料酒', '飯勺老抽': '老抽',
  '湯匙生抽': '生抽', '湯匙老抽': '老抽',
  '半料勺十三香': '十三香', '半料勺盐': '盐',
  '一料勺盐': '盐', '盐勺精盐': '盐', '盐勺鸡精': '鸡精',
  '盐勺十三香': '十三香', '盐糖味精': '味精',
};

// ── Other exact mappings ──────────────────────────────────────

export const EXACT_MAP: Record<string, string> = {
  '）面粉': '面粉', '）砂糖': '白糖', '）鸡蛋': '鸡蛋',
  '）牛奶': '牛奶', '）油': '食用油', '）黄油': '黄油',
  '）酵母': '酵母', '）白砂糖': '白糖', '）食用油': '食用油',
  '）温水': '清水', '）清水': '清水', '）食盐': '盐',
  '）淡奶油': '淡奶油', '）巧克力碎': '黑巧克力',
  '＊生抽': '生抽', '＊糖': '白糖', '＊蚝油': '蚝油',
  '看着来料酒': '料酒', '看着来盐': '盐', '看着来酱油': '酱油',
  '看着来蚝油': '蚝油', '看着来黑胡椒': '黑胡椒',
  '看着来食用油': '食用油', '看着来淀粉': '淀粉',
  '随便姜': '姜', '随便葱': '葱', '随便鸡蛋': '鸡蛋',
  'めんつゆ': '日式酱油', '五十克牛奶': '牛奶',
  '一百克面粉': '面粉', '数颗瑶柱': '干贝', '数片淮山': '山药',
  '椰浆一罐': '椰浆', '黄糖两片': '红糖',
  '大量干辣椒': '干辣椒', '大量花椒': '花椒',
  '添加辣椒粉': '辣椒粉', '添加孜然粉': '孜然粉',
  '煮玉米': '玉米', '煮红薯': '红薯',
  '红各半个彩椒': '红椒', '黄各半个彩椒': '黄椒',
  '红各一个彩椒': '红椒', '黄各一个彩椒': '黄椒',
  '個红椒': '红椒', '個黃椒': '黄椒',
  '红椒洋葱': '洋葱', '青椒洋葱': '洋葱',
  '红小番茄': '小番茄', '黄小番茄': '小番茄',
  '红圣女果': '圣女果', '黄圣女果': '圣女果',
  '红椒块': '红椒', '红椒片': '红椒', '青椒块': '青椒', '青椒片': '青椒',
  '红黄彩椒': '彩椒', '红绿彩椒': '彩椒', '青黄彩椒': '彩椒',
  '黄绿彩椒': '彩椒', '红黄椒': '彩椒', '青黄椒': '彩椒',
  '红肉椒': '红椒', '青肉椒': '青椒',
  '糖水桃肉': '桃子', '桃子糖水': '桃子',
  '洋葱皮': '洋葱',
  '黑淡奶': '淡奶', '白淡奶': '淡奶',
  '黑黄油': '黄油', '白黄油': '黄油', '裹入片状黄油': '黄油',
  '白熟芝麻': '芝麻', '黑熟芝麻': '芝麻',
  '南杏': '杏仁', '南杏仁': '杏仁', '北杏': '杏仁', '北杏仁': '杏仁',
  '红丝': '果脯', '青丝': '果脯', '绿丝': '果脯',
  '炒麦芽': '麦芽', '炒谷芽': '谷芽',
  '蛋白用白砂糖': '白糖', '蛋白用白糖': '白糖', '蛋白用砂糖': '白糖',
  '蛋白用糖': '白糖', '蛋白砂糖': '白糖', '蛋白细砂糖': '白糖',
  '蛋黄用白砂糖': '白糖', '蛋黄用白糖': '白糖', '蛋黄用砂糖': '白糖',
  '蛋黄用糖': '白糖', '蛋黄砂糖': '白糖', '蛋黄细砂糖': '白糖',
  '细砂糖蛋白用': '白糖', '细砂糖蛋黄用': '白糖',
  '细砂糖蛋白': '白糖', '细砂糖蛋黄': '白糖',
  '蛋白糖': '白糖', '蛋黄糖': '白糖',
  '蛋白霜材料': '蛋白', '蛋白霜部分': '蛋白',
  '蛋黄糊材料': '蛋黄', '蛋黄糊部分': '蛋黄',
  '焦糖材料': '焦糖', '焦糖部分': '焦糖',
  '珍珠材料': '珍珠', '芋头芋圆': '芋圆', '紫薯芋圆': '芋圆', '红薯芋圆': '芋圆',
  '冰粉籽': '冰粉', '栀子绿色粉': '栀子粉', '栀子黄色粉': '栀子粉',
  '竹炭粉面团': '竹炭粉', '红曲粉面团': '红曲粉', '浅粉色面团': '面粉', '深粉色面团': '面粉',
  '粉色巧克力笔': '巧克力', '白巧克力笔': '巧克力', '黑巧克力笔': '巧克力', '黑色巧克力笔': '巧克力',
  '巧克力拉线膏': '巧克力', '巧克力桃山皮': '桃山皮', '抹茶桃山皮': '桃山皮',
  '樱桃桃山皮': '桃山皮', '紫薯桃山皮': '桃山皮', '草莓拉线膏': '草莓酱',
  '果膏': '果酱', '植物色素': '食用色素',
  '白色芝士片': '芝士', '黄色芝士片': '芝士',
  '油米辣': '小米辣', '红小米辣': '小米辣', '青小米辣': '小米辣',
  '小炒料包': '调料包', '鲜汤料包': '调料包', '鲜香红烧': '红烧酱',
  '葱姜蒜小料': '葱姜蒜', '葱姜蒜包': '葱姜蒜',
  '饭勺老抽': '老抽', '饭勺料酒': '料酒',
  '适中料酒': '料酒', '适中酱油': '酱油',
  '咸馅料': '馅料', '甜馅料': '馅料',
  '道明粉': '糯米粉', '道明寺粉': '糯米粉',
  '芭蕉芋粉': '芭蕉芋', '梅山泡打粉': '泡打粉',
  '普通干酵母': '酵母', '自制酵种': '酵母',
  '木鱼精汁': '木鱼花', '海藻酸钠': '明胶', '膨鱼腮': '鱼翅',
  '猫爪草': '中药材', '杜仲': '中药材', '巴戟': '中药材', '红蓝草': '中药材',
  '石灰': '食用石灰', '氢氧化钠': '食用碱',
  '乳酸钙': '食品添加剂',
  // 食材变体合并
  '姜丝': '姜', '姜末': '姜', '姜片': '姜', '片姜': '姜',
  '蒜末': '蒜',
  '牛奶①': '牛奶', '牛奶②': '牛奶',
  '捏生姜粉': '姜粉', '捏白胡椒粉': '白胡椒粉',
  '全蛋液': '鸡蛋',
  '棕榈油': '食用油', '甜杏仁油': '杏仁油',
  '乳木果油': '乳木果', '黍子面': '黍子', '糜子面': '糜子',
  '小铺菜籽油': '菜籽油',
  '小铺不辣干碟': '干碟',
  '绿节瓜': '节瓜', '黄节瓜': '节瓜',
  '种蔬菜': '蔬菜', '种水果': '水果',
  '~用料': '', '~天然果蔬粉': '果蔬粉',
  '方法一': '', '方法二': '', '第一步': '', '第二步': '', '第三步': '',
  '辅料': '', '主料': '',
  '牛': '牛肉', '蛋': '鸡蛋', '奶': '牛奶', '黄': '',
};

// ── Normalize a single ingredient name/id ─────────────────────

function normalizeName(name: string): string | null {
  // 1. Exact delete
  if (DELETE_EXACT.has(name)) return null;

  // 2. Pattern delete
  for (const pat of DELETE_PATTERNS) {
    if (pat.test(name)) return null;
  }

  // 3. Exact map (highest priority for known mappings)
  if (name in EXACT_MAP) {
    const mapped = EXACT_MAP[name];
    return mapped || null; // empty string → delete
  }

  // 4. Brand map
  if (name in BRAND_MAP) return BRAND_MAP[name];

  // 5. Measurement prefix map
  if (name in MEASUREMENT_PREFIX_MAP) return MEASUREMENT_PREFIX_MAP[name];

  // 6. Strip A/B/C/D suffix labels from Chinese ingredient names
  //    "细砂糖A" → "细砂糖", "低筋面粉B" → "低筋面粉"
  //    Only strip when the name contains Chinese characters (avoids "Feta", "Paprika")
  if (/[一-鿿]/.test(name)) {
    const stripped = name.replace(/[A-Da-d]$/, '');
    if (stripped !== name && stripped.length > 0) return stripped;
  }

  return name; // no change
}

// ── Public API ────────────────────────────────────────────────

export interface NormalizeResult {
  ingredients: Ingredient[];
  validIds: Set<string>;
}

/**
 * Normalize ingredients: map noise → real, delete non-food, merge duplicates.
 * Returns cleaned ingredients and the set of valid ids.
 */
export function normalizeIngredients(raw: Ingredient[]): NormalizeResult {
  // Phase 1: map + delete
  const mapped: Array<{ original: Ingredient; normalizedName: string }> = [];

  for (const ing of raw) {
    const result = normalizeName(ing.name);
    if (result === null) continue; // deleted
    mapped.push({ original: ing, normalizedName: result });
  }

  // Phase 2: merge duplicates (keep first occurrence for PCA/flavor)
  const seen = new Map<string, Ingredient>();
  for (const { original, normalizedName } of mapped) {
    // Use normalizedName as the merge key (lowercase for consistency)
    const key = normalizedName.toLowerCase();
    if (seen.has(key)) continue; // keep first
    seen.set(key, {
      ...original,
      id: normalizedName, // update id to match normalized name
      name: normalizedName,
    });
  }

  const ingredients = Array.from(seen.values());
  const validIds = new Set(ingredients.map((i) => i.id));
  return { ingredients, validIds };
}

/**
 * Filter cooccurrence pairs: keep only pairs where both ends are in validIds.
 * Update ids to normalized names.
 */
export function normalizeCooccurrence(
  raw: CooccurrencePair[],
  validIds: Set<string>,
): CooccurrencePair[] {
  return raw
    .map((p) => ({
      ...p,
      a: EXACT_MAP[p.a] || BRAND_MAP[p.a] || MEASUREMENT_PREFIX_MAP[p.a] || p.a,
      b: EXACT_MAP[p.b] || BRAND_MAP[p.b] || MEASUREMENT_PREFIX_MAP[p.b] || p.b,
    }))
    .filter((p) => validIds.has(p.a) && validIds.has(p.b) && p.a !== p.b);
}

/**
 * Filter surprise pairs: keep only pairs where both ends are in validIds.
 * Update ids to normalized names.
 */
export function normalizeSurprise(
  raw: SurprisePair[],
  validIds: Set<string>,
): SurprisePair[] {
  return raw
    .map((p) => ({
      ...p,
      a: EXACT_MAP[p.a] || BRAND_MAP[p.a] || MEASUREMENT_PREFIX_MAP[p.a] || p.a,
      b: EXACT_MAP[p.b] || BRAND_MAP[p.b] || MEASUREMENT_PREFIX_MAP[p.b] || p.b,
    }))
    .filter((p) => validIds.has(p.a) && validIds.has(p.b) && p.a !== p.b);
}

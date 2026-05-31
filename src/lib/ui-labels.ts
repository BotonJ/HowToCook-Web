/** 轻量多语言 UI 标签 —— 跟随 SourceNav 语言切换 */

export type UiLang = 'zh' | 'en';

const labels = {
  zh: {
    loading: '加载菜谱中...',
    retry: '重试',
    recipeCount: (n: number) => `${n} 道菜`,
    searchPlaceholder: '输入关键词搜索菜谱',
    emptySearch: '未找到匹配的菜谱，试试其他关键词',
    emptyCategory: '该分类暂无菜谱',
    category: '分类',
    featured: '精选推荐',
    recipes: (n: number) => `${n} recipes →`,
    backHome: '← 返回首页',
    notFound: '聚合页不存在',
    metaDesc: '做饭指北 — 世界首个 AI 驱动的食谱百科与烹饪 Skill。',
    collectionLoading: '加载中...',
    collectionEmpty: 'No recipes found in this collection.',
    collectionError: '加载失败',
  },
  en: {
    loading: 'Loading recipes...',
    retry: 'Retry',
    recipeCount: (n: number) => `${n} recipes`,
    searchPlaceholder: 'Search recipes...',
    emptySearch: 'No recipes found. Try different keywords.',
    emptyCategory: 'No recipes in this category.',
    category: 'Category',
    featured: 'Featured',
    recipes: (n: number) => `${n} recipes →`,
    backHome: '← Back to Home',
    notFound: 'Collection not found',
    metaDesc: 'HowToCook — The AI-powered recipe encyclopedia and cooking Skill.',
    collectionLoading: 'Loading...',
    collectionEmpty: 'No recipes found in this collection.',
    collectionError: 'Failed to load',
  },
} as const;

export type Labels = typeof labels['zh'];

/** 从 activeSource 推导 UI 语言：en → 'en'，其他 → 'zh' */
export function getUiLang(activeSource: string): UiLang {
  return activeSource === 'en' ? 'en' : 'zh';
}

export function getLabels(lang: UiLang): Labels {
  return labels[lang] as Labels;
}

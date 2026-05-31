/**
 * Lightweight multilingual UI labels — follows SourceNav language switch.
 *
 * This module is a backward-compatible shim over the comprehensive i18n
 * system in `./i18n/`. New code should prefer `useT()` from `./i18n`.
 */

import { zh } from './i18n/zh';
import { en } from './i18n/en';
import type { Lang } from './i18n/index';

export type UiLang = Lang;

/** Derive UI language from activeSource: en → 'en', otherwise → 'zh' */
export function getUiLang(activeSource: string): UiLang {
  return activeSource === 'en' ? 'en' : 'zh';
}

/**
 * Backward-compatible labels object.
 * Maps the old flat label keys to the new structured locale.
 */
const labels = {
  zh: {
    loading: zh.common.loadingRecipes,
    retry: zh.common.retry,
    recipeCount: zh.home.recipeCount,
    searchPlaceholder: zh.home.searchPlaceholder,
    emptySearch: zh.home.emptySearch,
    emptyCategory: zh.home.emptyCategory,
    category: zh.home.category,
    featured: zh.home.featured,
    recipes: zh.home.recipes,
    backHome: zh.common.backHome,
    notFound: zh.collection.notFound,
    metaDesc: zh.home.metaDesc,
    collectionLoading: zh.collection.loading,
    collectionEmpty: zh.collection.empty,
    collectionError: zh.collection.error,
    brandName: zh.nav.siteName,
    cookingAcademy: zh.nav.academy,
    collections: zh.nav.collections,
    ingredientExplorer: zh.nav.explore,
    about: zh.nav.about,
    credits: zh.nav.credits,
    collectionChineseRecipes: zh.nav.collectionLabels['chinese-recipes'],
    collectionChicken: zh.nav.collectionLabels['chicken-recipes'],
    collectionBaking: zh.nav.collectionLabels['baking'],
    collectionAirFryer: zh.nav.collectionLabels['air-fryer'],
    collectionPasta: zh.nav.collectionLabels['pasta'],
    spicy: zh.recipe.spicy,
    errorTitle: '出错了',
    errorMessage: '页面加载异常，请',
    returnHome: '返回首页',
    addToHomeScreen: zh.pwa.addToHome,
    all: zh.common.all,
  },
  en: {
    loading: en.common.loadingRecipes,
    retry: en.common.retry,
    recipeCount: en.home.recipeCount,
    searchPlaceholder: en.home.searchPlaceholder,
    emptySearch: en.home.emptySearch,
    emptyCategory: en.home.emptyCategory,
    category: en.home.category,
    featured: en.home.featured,
    recipes: en.home.recipes,
    backHome: en.common.backHome,
    notFound: en.collection.notFound,
    metaDesc: en.home.metaDesc,
    collectionLoading: en.collection.loading,
    collectionEmpty: en.collection.empty,
    collectionError: en.collection.error,
    brandName: en.nav.siteName,
    cookingAcademy: en.nav.academy,
    collections: en.nav.collections,
    ingredientExplorer: en.nav.explore,
    about: en.nav.about,
    credits: en.nav.credits,
    collectionChineseRecipes: en.nav.collectionLabels['chinese-recipes'],
    collectionChicken: en.nav.collectionLabels['chicken-recipes'],
    collectionBaking: en.nav.collectionLabels['baking'],
    collectionAirFryer: en.nav.collectionLabels['air-fryer'],
    collectionPasta: en.nav.collectionLabels['pasta'],
    spicy: en.recipe.spicy,
    errorTitle: 'Something went wrong',
    errorMessage: 'Page failed to load, please ',
    returnHome: 'Return to Home',
    addToHomeScreen: en.pwa.addToHome,
    all: en.common.all,
  },
} as const;

export type Labels = typeof labels['zh'];

export function getLabels(lang: UiLang): Labels {
  return labels[lang] as Labels;
}

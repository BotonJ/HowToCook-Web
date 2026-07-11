/**
 * Language-aware constants for HowToCook UI.
 *
 * These mirror the values from `@/lib/constants` but support zh/en.
 * Import from here when you need localized labels.
 */

import type { Lang } from './index';
import { zh } from './zh';
import { en } from './en';

const locales = { zh, en } as const;

/** Full cook-time labels with duration range. */
export function getCookTimeLabels(lang: Lang): Record<string, string> {
  return locales[lang].constants.cookTime;
}

/** Short cook-time labels (without duration range). */
export function getCookTimeShort(lang: Lang): Record<string, string> {
  return locales[lang].constants.cookTimeShort;
}

/** Difficulty labels indexed by numeric level (1-5). */
export function getDifficultyLabels(lang: Lang): readonly string[] {
  return locales[lang].constants.difficulty;
}

/** Category display names. */
export function getCategoryLabels(lang: Lang): Record<string, string> {
  return locales[lang].constants.categories;
}

/** Flavor dimension labels (sweet, sour, umami, spicy). */
export function getFlavorLabels(lang: Lang) {
  return locales[lang].flavor;
}

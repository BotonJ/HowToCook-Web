/**
 * i18n context — lightweight locale system for HowToCook UI strings.
 *
 * Language detection priority:
 *   1. URL path prefix (/en/... → en, / → zh)
 *   2. localStorage preference (htc-lang)
 *   3. Browser language (navigator.language)
 *
 * Usage:
 *   const t = useT();
 *   const base = useBasePath();  // '' or '/en'
 *   t.nav.siteName  // → '做饭指北' or 'HowToCook'
 */

import { createContext, useContext, type ReactNode } from 'react';
import { zh } from './zh';
import { en } from './en';

export type Locale = typeof zh | typeof en;
export type Lang = 'zh' | 'en';

const locales: Record<Lang, typeof zh | typeof en> = { zh, en };
const STORAGE_KEY = 'htc-lang';

const LangContext = createContext<Lang>('zh');

/** Detect language with priority: URL > localStorage > browser. */
function detectLang(): Lang {
  // 1. URL prefix takes priority (for /en/ routes)
  if (window.location.pathname.startsWith('/en')) return 'en';
  // 2. localStorage preference
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  // 3. Browser language
  return navigator.language.startsWith('zh') ? 'zh' : 'zh'; // default to zh
}

/** Save language preference to localStorage. */
export function saveLangPreference(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang);
}

/** Provider that reads language from URL path prefix. */
export function LangProvider({ children }: { children: ReactNode }) {
  const lang = detectLang();
  return (
    <LangContext.Provider value={lang}>
      {children}
    </LangContext.Provider>
  );
}

/** Returns the current language code. */
export function useLang(): Lang {
  return useContext(LangContext);
}

/** Returns the full locale object for the current language. */
export function useT(): Locale {
  return locales[useLang()];
}

/** Returns the base path prefix: '' for zh, '/en' for en. */
export function useBasePath(): string {
  return useLang() === 'en' ? '/en' : '';
}

/** Resolve a path with the current language prefix. */
export function useLocalizedPath(path: string): string {
  const base = useBasePath();
  return `${base}${path}`;
}

export { LangContext, locales };

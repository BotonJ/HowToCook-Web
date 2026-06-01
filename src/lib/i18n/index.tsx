/**
 * i18n context — lightweight locale system for HowToCook UI strings.
 *
 * Language is determined by:
 *   1. localStorage preference (htc-lang)
 *   2. Browser language (navigator.language)
 *   3. Default: zh (Chinese)
 *
 * Usage:
 *   const { lang, setLang, t } = useI18n();
 *   t.nav.siteName  // → '做饭指北' or 'HowToCook'
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { zh } from './zh';
import { en } from './en';

export type Locale = typeof zh | typeof en;
export type Lang = 'zh' | 'en';

const locales: Record<Lang, typeof zh | typeof en> = { zh, en };
const STORAGE_KEY = 'htc-lang';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Locale;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'zh',
  setLang: () => {},
  t: zh,
});

/** Get initial language from localStorage or browser. */
function getInitialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

/** Provider that manages language state. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    // Update document meta
    document.title = newLang === 'zh' ? '做饭指北 - HowToCook' : 'HowToCook - Recipe Encyclopedia';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', newLang === 'zh'
        ? '做饭指北 — 500+ 道菜谱，按分类浏览，附 AI 生成图片。程序员也能做好饭。'
        : 'HowToCook — 500+ recipes with AI-generated images. Browse by category. Even programmers can cook.');
    }
  };

  useEffect(() => {
    // Apply initial language on mount
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', lang === 'zh'
        ? '做饭指北 — 500+ 道菜谱，按分类浏览，附 AI 生成图片。程序员也能做好饭。'
        : 'HowToCook — 500+ recipes with AI-generated images. Browse by category. Even programmers can cook.');
    }
  }, [lang]);

  const value: I18nContextValue = {
    lang,
    setLang,
    t: locales[lang],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/** Hook to access i18n context. */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

/** Returns the current language code. */
export function useLang(): Lang {
  return useContext(I18nContext).lang;
}

/** Returns the full locale object for the current language. */
export function useT(): Locale {
  return useContext(I18nContext).t;
}

/** Returns the base path prefix: '' for zh, '/en' for en. */
export function useBasePath(): string {
  return '';  // No URL prefix in state-based approach
}

export { I18nContext, locales };

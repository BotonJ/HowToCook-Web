/**
 * i18n context — lightweight locale system for HowToCook UI strings.
 *
 * Usage:
 *   const t = useT();
 *   t.nav.siteName  // → '做饭指北' or 'HowToCook'
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import { zh } from './zh';
import { en } from './en';

export type Locale = typeof zh | typeof en;
export type Lang = 'zh' | 'en';

const locales: Record<Lang, typeof zh | typeof en> = { zh, en };

const I18nContext = createContext<Lang>('zh');

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangStateContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
});

/** Provider that manages language state. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh');
  return (
    <I18nContext.Provider value={lang}>
      <LangStateContext.Provider value={{ lang, setLang }}>
        {children}
      </LangStateContext.Provider>
    </I18nContext.Provider>
  );
}

/** Returns the current language code. */
export function useLang(): Lang {
  return useContext(I18nContext);
}

/** Returns the full locale object for the current language. */
export function useT(): Locale {
  return locales[useLang()];
}

/** Returns the setter for the current language. */
export function useSetLang() {
  return useContext(LangStateContext).setLang;
}

export { I18nContext, locales };

import { createContext, useContext, useState, type ReactNode } from 'react';
import { UiLang } from '@/lib/ui-labels';

interface LangContextValue {
  lang: UiLang;
  setLang: (lang: UiLang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<UiLang>('zh');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): UiLang {
  return useContext(LangContext).lang;
}

export function useSetLang() {
  return useContext(LangContext).setLang;
}

export type Lang = UiLang;

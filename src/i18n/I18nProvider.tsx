// src/i18n/I18nProvider.tsx
// Provides the current language + a t() function to the whole app, remembers the
// user's choice, and sets <html lang> / direction. Wrap <App/> with this once.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { LANGUAGES, LangCode, TransKey, dict } from './translations';

const STORAGE_KEY = 'carai.lang';

interface I18nValue {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: TransKey) => string;
  languages: typeof LANGUAGES;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectInitial(): LangCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (saved && dict[saved]) return saved;
  } catch {
    /* ignore */
  }
  // fall back to the device language if we support it, else English
  try {
    const nav = (navigator.language || 'en').slice(0, 2) as LangCode;
    if (dict[nav]) return nav;
  } catch {
    /* ignore */
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LangCode>('en');

  // initialise on mount (client only)
  useEffect(() => {
    setLangState(detectInitial());
  }, []);

  // apply <html lang> and direction whenever language changes
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang);
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = meta?.rtl ? 'rtl' : 'ltr';
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: TransKey) => dict[lang]?.[key] ?? dict.en[key] ?? key, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t,
      languages: LANGUAGES,
    }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANG, translate } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'gb_lang';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch { return DEFAULT_LANG; }
  });

  // Apply <html dir> for RTL languages (Arabic) and persist on change.
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = meta?.dir === 'rtl' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code);
    // Persist to the user entity so the choice survives across devices.
    try { base44.auth.updateMe({ language: code }).catch(() => {}); } catch { /* ignore */ }
  }, []);

  // On mount, if the user has a saved language on their profile, use it.
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return; // local choice wins
        const me = await base44.auth.me().catch(() => null);
        if (me?.language && LANGUAGES.some((l) => l.code === me.language)) {
          setLangState(me.language);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback so pages rendered outside the provider still work.
    return { lang: DEFAULT_LANG, setLang: () => {}, t: (k) => k };
  }
  return ctx;
}
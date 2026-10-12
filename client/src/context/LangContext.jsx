import { createContext, useContext, useState } from 'react';
import en from '../locales/en';
import ta from '../locales/ta';

import hi from '../locales/hi';
import te from '../locales/te';
import ml from '../locales/ml';
import kn from '../locales/kn';

const LOCALES = { en, ta, hi, te, ml, kn };

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lc-lang') || 'en');

  const t = (key) => LOCALES[lang]?.[key] || LOCALES.en[key] || key;

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('lc-lang', l);
  };

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

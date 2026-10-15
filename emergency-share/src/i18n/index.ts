// i18n/index.ts  — locale bootstrapper
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './en.json'
import ta from './ta.json'
import kn from './kn.json'
import hi from './hi.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import sourcingEn from './locales/sourcing.en.json';
import sourcingEs from './locales/sourcing.es.json';

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('language') || 'en';

// Merge dedicated Sourcing strings so the namespace always ships with the bundle explicitly.
const enMerged = { ...enTranslations, sourcing: sourcingEn };
const esMerged = { ...esTranslations, sourcing: sourcingEs };

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enMerged,
    },
    es: {
      translation: esMerged,
    },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

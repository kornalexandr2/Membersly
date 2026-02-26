import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import en from './locales/en.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru', // default language
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
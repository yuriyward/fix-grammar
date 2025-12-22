/**
 * i18next configuration and translations
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        appName: 'electron-shadcn-ai',
        titleHomePage: 'Home Page',
        titleSecondPage: 'Second Page',
        documentation: 'Documentation',
        version: 'Version',
        madeBy: 'Made by Yuriy Babyak',
      },
    },
    pl: {
      translation: {
        appName: 'electron-shadcn-ai',
        titleHomePage: 'Strona główna',
        titleSecondPage: 'Następna strona',
        documentation: 'Dokumentacja',
        version: 'Wersja',
        madeBy: 'Przygotował Yuriy Babyak',
      },
    },
    uk: {
      translation: {
        appName: 'electron-shadcn-ai',
        titleHomePage: 'Головна сторінка',
        titleSecondPage: 'Наступна сторінка',
        documentation: 'Документація',
        version: 'Версія',
        madeBy: 'Створив Yuriy Babyak',
      },
    },
  },
});

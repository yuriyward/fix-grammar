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
        onboarding: {
          notificationsNotePrefix:
            'In development, macOS may list the sender as',
          notificationsNoteAppName: 'Electron',
          notificationsNoteSuffix:
            '(not "Grammar Copilot"). Make sure notifications are allowed for that entry.',
        },
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
        onboarding: {
          notificationsNotePrefix:
            'W trybie deweloperskim macOS może wyświetlać nadawcę jako',
          notificationsNoteAppName: 'Electron',
          notificationsNoteSuffix:
            '(a nie "Grammar Copilot"). Upewnij się, że powiadomienia są dozwolone dla tego wpisu.',
        },
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
        onboarding: {
          notificationsNotePrefix:
            'У режимі розробки macOS може відображати відправника як',
          notificationsNoteAppName: 'Electron',
          notificationsNoteSuffix:
            '(а не "Grammar Copilot"). Переконайтеся, що сповіщення дозволені для цього запису.',
        },
      },
    },
  },
});

export default i18n;

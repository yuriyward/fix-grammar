/**
 * i18n Integration tests
 */

import i18n from 'i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('i18n Configuration', () => {
  beforeEach(async () => {
    // Reset i18n instance before each test
    vi.resetModules();
  });

  describe('initialization', () => {
    it('should initialize i18n with fallback language', async () => {
      // Import fresh instance
      await import('@/renderer/lib/i18n');

      expect(i18n.options.fallbackLng).toContain('en');
    });

    it('should have English as default language', async () => {
      await import('@/renderer/lib/i18n');

      // Check that English resources are loaded
      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    });
  });

  describe('translations', () => {
    it('should have English translations', async () => {
      await import('@/renderer/lib/i18n');

      const enTranslations = i18n.getResourceBundle('en', 'translation');

      expect(enTranslations).toBeDefined();
      expect(enTranslations.appName).toBe('electron-shadcn-ai');
      expect(enTranslations.titleHomePage).toBe('Home Page');
      expect(enTranslations.titleSecondPage).toBe('Second Page');
      expect(enTranslations.documentation).toBe('Documentation');
      expect(enTranslations.version).toBe('Version');
      expect(enTranslations.madeBy).toBe('Made by Yuriy Babyak');
    });

    it('should have Polish translations', async () => {
      await import('@/renderer/lib/i18n');

      const plTranslations = i18n.getResourceBundle('pl', 'translation');

      expect(plTranslations).toBeDefined();
      expect(plTranslations.appName).toBe('electron-shadcn-ai');
      expect(plTranslations.titleHomePage).toBe('Strona główna');
      expect(plTranslations.titleSecondPage).toBe('Następna strona');
      expect(plTranslations.documentation).toBe('Dokumentacja');
      expect(plTranslations.version).toBe('Wersja');
      expect(plTranslations.madeBy).toBe('Przygotował Yuriy Babyak');
    });

    it('should have Ukrainian translations', async () => {
      await import('@/renderer/lib/i18n');

      const ukTranslations = i18n.getResourceBundle('uk', 'translation');

      expect(ukTranslations).toBeDefined();
      expect(ukTranslations.appName).toBe('electron-shadcn-ai');
      expect(ukTranslations.titleHomePage).toBe('Головна сторінка');
      expect(ukTranslations.titleSecondPage).toBe('Наступна сторінка');
      expect(ukTranslations.documentation).toBe('Документація');
      expect(ukTranslations.version).toBe('Версія');
      expect(ukTranslations.madeBy).toBe('Створив Yuriy Babyak');
    });
  });

  describe('language switching', () => {
    it('should switch to Polish', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('pl');

      expect(i18n.language).toBe('pl');
    });

    it('should switch to Ukrainian', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('uk');

      expect(i18n.language).toBe('uk');
    });

    it('should switch back to English', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('pl');
      await i18n.changeLanguage('en');

      expect(i18n.language).toBe('en');
    });

    it('should translate keys after language switch', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('en');
      expect(i18n.t('titleHomePage')).toBe('Home Page');

      await i18n.changeLanguage('pl');
      expect(i18n.t('titleHomePage')).toBe('Strona główna');

      await i18n.changeLanguage('uk');
      expect(i18n.t('titleHomePage')).toBe('Головна сторінка');
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to English for unsupported language', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('fr');

      // Should fallback to English translation
      expect(i18n.t('titleHomePage')).toBe('Home Page');
    });

    it('should return key for missing translation', async () => {
      await import('@/renderer/lib/i18n');

      await i18n.changeLanguage('en');

      // Non-existent key should return the key itself
      const result = i18n.t('nonExistentKey');
      expect(result).toBe('nonExistentKey');
    });
  });

  describe('supported languages', () => {
    it('should support English (en)', async () => {
      await import('@/renderer/lib/i18n');

      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    });

    it('should support Polish (pl)', async () => {
      await import('@/renderer/lib/i18n');

      expect(i18n.hasResourceBundle('pl', 'translation')).toBe(true);
    });

    it('should support Ukrainian (uk)', async () => {
      await import('@/renderer/lib/i18n');

      expect(i18n.hasResourceBundle('uk', 'translation')).toBe(true);
    });

    it('should have consistent keys across all languages', async () => {
      await import('@/renderer/lib/i18n');

      const enKeys = Object.keys(i18n.getResourceBundle('en', 'translation'));
      const plKeys = Object.keys(i18n.getResourceBundle('pl', 'translation'));
      const ukKeys = Object.keys(i18n.getResourceBundle('uk', 'translation'));

      expect(enKeys.sort()).toEqual(plKeys.sort());
      expect(enKeys.sort()).toEqual(ukKeys.sort());
    });
  });

  describe('translation keys', () => {
    it('should have all required translation keys', async () => {
      await import('@/renderer/lib/i18n');

      const requiredKeys = [
        'appName',
        'titleHomePage',
        'titleSecondPage',
        'documentation',
        'version',
        'madeBy',
      ];

      const enTranslations = i18n.getResourceBundle('en', 'translation');

      for (const key of requiredKeys) {
        expect(enTranslations).toHaveProperty(key);
      }
    });
  });
});

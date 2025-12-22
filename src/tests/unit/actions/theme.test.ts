/**
 * Theme Actions tests
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to define mocks before they're used in vi.mock
const { mockGetCurrentThemeMode, mockSetThemeMode, mockToggleThemeMode } =
  vi.hoisted(() => ({
    mockGetCurrentThemeMode: vi.fn(),
    mockSetThemeMode: vi.fn(),
    mockToggleThemeMode: vi.fn(),
  }));

vi.mock('@/renderer/lib/ipc-manager', () => ({
  ipc: {
    client: {
      theme: {
        getCurrentThemeMode: mockGetCurrentThemeMode,
        setThemeMode: mockSetThemeMode,
        toggleThemeMode: mockToggleThemeMode,
      },
    },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock document.documentElement
const documentElementMock = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: documentElementMock,
  writable: true,
});

import {
  getCurrentTheme,
  setTheme,
  syncWithLocalTheme,
  toggleTheme,
} from '@/actions/theme';

describe('Theme Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCurrentTheme', () => {
    it('should return system and local theme preferences', async () => {
      mockGetCurrentThemeMode.mockResolvedValue('dark');
      localStorageMock.getItem.mockReturnValue('light');

      const result = await getCurrentTheme();

      expect(result).toEqual({
        system: 'dark',
        local: 'light',
      });
      expect(mockGetCurrentThemeMode).toHaveBeenCalled();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });

    it('should return null for local theme when not set', async () => {
      mockGetCurrentThemeMode.mockResolvedValue('system');
      localStorageMock.getItem.mockReturnValue(null);

      const result = await getCurrentTheme();

      expect(result).toEqual({
        system: 'system',
        local: null,
      });
    });
  });

  describe('setTheme', () => {
    it('should set dark theme and update document', async () => {
      mockSetThemeMode.mockResolvedValue('dark');

      await setTheme('dark');

      expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
      expect(documentElementMock.classList.remove).not.toHaveBeenCalled();
    });

    it('should set light theme and update document', async () => {
      mockSetThemeMode.mockResolvedValue('light');

      await setTheme('light');

      expect(mockSetThemeMode).toHaveBeenCalledWith('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
      expect(documentElementMock.classList.add).not.toHaveBeenCalled();
    });

    it('should set system theme', async () => {
      mockSetThemeMode.mockResolvedValue('system');

      await setTheme('system');

      expect(mockSetThemeMode).toHaveBeenCalledWith('system');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'system');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle to dark mode and update document', async () => {
      mockToggleThemeMode.mockResolvedValue(true);

      await toggleTheme();

      expect(mockToggleThemeMode).toHaveBeenCalled();
      expect(documentElementMock.classList.add).toHaveBeenCalledWith('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle to light mode and update document', async () => {
      mockToggleThemeMode.mockResolvedValue(false);

      await toggleTheme();

      expect(mockToggleThemeMode).toHaveBeenCalled();
      expect(documentElementMock.classList.remove).toHaveBeenCalledWith('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('syncWithLocalTheme', () => {
    it('should set system theme when no local theme exists', async () => {
      mockGetCurrentThemeMode.mockResolvedValue('system');
      localStorageMock.getItem.mockReturnValue(null);
      mockSetThemeMode.mockResolvedValue('system');

      await syncWithLocalTheme();

      expect(mockSetThemeMode).toHaveBeenCalledWith('system');
    });

    it('should sync with local dark theme', async () => {
      mockGetCurrentThemeMode.mockResolvedValue('light');
      localStorageMock.getItem.mockReturnValue('dark');
      mockSetThemeMode.mockResolvedValue('dark');

      await syncWithLocalTheme();

      expect(mockSetThemeMode).toHaveBeenCalledWith('dark');
    });

    it('should sync with local light theme', async () => {
      mockGetCurrentThemeMode.mockResolvedValue('dark');
      localStorageMock.getItem.mockReturnValue('light');
      mockSetThemeMode.mockResolvedValue('light');

      await syncWithLocalTheme();

      expect(mockSetThemeMode).toHaveBeenCalledWith('light');
    });
  });
});

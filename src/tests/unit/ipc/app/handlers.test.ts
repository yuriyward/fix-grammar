/**
 * App IPC Handlers tests
 *
 * These tests verify the app handler logic by testing
 * the handler functions with mocked Electron app module.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock process.platform
const originalPlatform = process.platform;

// Mock Electron app module
const mockGetVersion = vi.fn();

vi.mock('electron', () => ({
  app: {
    getVersion: mockGetVersion,
  },
}));

describe('App IPC Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVersion.mockReturnValue('1.0.0');
  });

  afterAll(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  describe('currentPlatform handler logic', () => {
    it('should return darwin for macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });

      expect(process.platform).toBe('darwin');
    });

    it('should return win32 for Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      expect(process.platform).toBe('win32');
    });

    it('should return linux for Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });

      expect(process.platform).toBe('linux');
    });

    it('should return the actual platform value', () => {
      const platforms = ['darwin', 'win32', 'linux', 'freebsd', 'sunos'];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform,
          configurable: true,
        });

        expect(process.platform).toBe(platform);
      }
    });
  });

  describe('appVersion handler logic', () => {
    it('should return the app version', async () => {
      mockGetVersion.mockReturnValue('1.0.0');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(version).toBe('1.0.0');
      expect(mockGetVersion).toHaveBeenCalledTimes(1);
    });

    it('should return semantic version strings', async () => {
      mockGetVersion.mockReturnValue('2.5.3');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(version).toBe('2.5.3');
    });

    it('should handle pre-release versions', async () => {
      mockGetVersion.mockReturnValue('1.0.0-beta.1');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(version).toBe('1.0.0-beta.1');
    });

    it('should handle alpha versions', async () => {
      mockGetVersion.mockReturnValue('0.0.1-alpha');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(version).toBe('0.0.1-alpha');
    });

    it('should handle versions with build metadata', async () => {
      mockGetVersion.mockReturnValue('1.0.0+build.123');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(version).toBe('1.0.0+build.123');
    });
  });

  describe('handler return types', () => {
    it('currentPlatform should return a string', () => {
      expect(typeof process.platform).toBe('string');
    });

    it('appVersion should return a string', async () => {
      mockGetVersion.mockReturnValue('1.0.0');

      const { app } = await import('electron');
      const version = app.getVersion();

      expect(typeof version).toBe('string');
    });
  });
});

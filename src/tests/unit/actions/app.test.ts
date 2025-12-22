/**
 * App Actions tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to define mocks before they're used in vi.mock
const { mockCurrentPlatform, mockAppVersion } = vi.hoisted(() => ({
  mockCurrentPlatform: vi.fn(),
  mockAppVersion: vi.fn(),
}));

vi.mock('@/renderer/lib/ipc-manager', () => ({
  ipc: {
    client: {
      app: {
        currentPlatfom: mockCurrentPlatform,
        appVersion: mockAppVersion,
      },
    },
  },
}));

import { getAppVersion, getPlatform } from '@/actions/app';

describe('App Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlatform', () => {
    it('should return darwin for macOS', () => {
      mockCurrentPlatform.mockReturnValue('darwin');

      const result = getPlatform();

      expect(result).toBe('darwin');
      expect(mockCurrentPlatform).toHaveBeenCalledTimes(1);
    });

    it('should return win32 for Windows', () => {
      mockCurrentPlatform.mockReturnValue('win32');

      const result = getPlatform();

      expect(result).toBe('win32');
    });

    it('should return linux for Linux', () => {
      mockCurrentPlatform.mockReturnValue('linux');

      const result = getPlatform();

      expect(result).toBe('linux');
    });
  });

  describe('getAppVersion', () => {
    it('should return the app version', () => {
      mockAppVersion.mockReturnValue('1.0.0');

      const result = getAppVersion();

      expect(result).toBe('1.0.0');
      expect(mockAppVersion).toHaveBeenCalledTimes(1);
    });

    it('should return different version strings', () => {
      mockAppVersion.mockReturnValue('2.5.3-beta');

      const result = getAppVersion();

      expect(result).toBe('2.5.3-beta');
    });

    it('should handle pre-release versions', () => {
      mockAppVersion.mockReturnValue('0.0.1-alpha.1');

      const result = getAppVersion();

      expect(result).toBe('0.0.1-alpha.1');
    });
  });
});

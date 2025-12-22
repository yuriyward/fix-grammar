/**
 * Window Actions tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to define mocks before they're used in vi.mock
const { mockMinimizeWindow, mockMaximizeWindow, mockCloseWindow } = vi.hoisted(
  () => ({
    mockMinimizeWindow: vi.fn(),
    mockMaximizeWindow: vi.fn(),
    mockCloseWindow: vi.fn(),
  }),
);

vi.mock('@/renderer/lib/ipc-manager', () => ({
  ipc: {
    client: {
      window: {
        minimizeWindow: mockMinimizeWindow,
        maximizeWindow: mockMaximizeWindow,
        closeWindow: mockCloseWindow,
      },
    },
  },
}));

import { closeWindow, maximizeWindow, minimizeWindow } from '@/actions/window';

describe('Window Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('minimizeWindow', () => {
    it('should call IPC minimizeWindow', async () => {
      mockMinimizeWindow.mockResolvedValue(undefined);

      await minimizeWindow();

      expect(mockMinimizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from IPC', async () => {
      const error = new Error('Window not available');
      mockMinimizeWindow.mockRejectedValue(error);

      await expect(minimizeWindow()).rejects.toThrow('Window not available');
    });
  });

  describe('maximizeWindow', () => {
    it('should call IPC maximizeWindow', async () => {
      mockMaximizeWindow.mockResolvedValue(undefined);

      await maximizeWindow();

      expect(mockMaximizeWindow).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from IPC', async () => {
      const error = new Error('Window not available');
      mockMaximizeWindow.mockRejectedValue(error);

      await expect(maximizeWindow()).rejects.toThrow('Window not available');
    });
  });

  describe('closeWindow', () => {
    it('should call IPC closeWindow', async () => {
      mockCloseWindow.mockResolvedValue(undefined);

      await closeWindow();

      expect(mockCloseWindow).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from IPC', async () => {
      const error = new Error('Window not available');
      mockCloseWindow.mockRejectedValue(error);

      await expect(closeWindow()).rejects.toThrow('Window not available');
    });
  });
});

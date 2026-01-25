import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  Notification: class Notification {
    show(): void {}
  },
}));

vi.mock('@/main/ai/client', () => ({
  rewriteText: async () => ({ text: '' }),
}));
vi.mock('@/main/ai/error-handler', () => ({
  parseAIError: () => ({ title: '', message: '' }),
}));
vi.mock('@/main/automation/clipboard', () => ({
  backupClipboard: (): void => {},
  readClipboard: (): string => '',
  restoreClipboard: (): void => {},
  writeClipboard: (_text: string): void => {},
}));
vi.mock('@/main/automation/keyboard', () => ({
  simulateCopy: async (): Promise<void> => {},
  simulatePaste: async (): Promise<void> => {},
  simulateSelectAll: async (): Promise<void> => {},
}));
vi.mock('@/main/storage/api-keys', () => ({
  getApiKey: (_provider: string): string | null => null,
}));
vi.mock('@/main/storage/context', () => ({ saveEditContext: (): void => {} }));
vi.mock('@/main/storage/notifications', () => ({
  addNotification: (payload: {
    title: string;
    description: string;
  }): { title: string; description: string } => payload,
}));
vi.mock('@/main/storage/settings', () => ({
  store: {
    get: (_key: string): string => '',
  },
}));
vi.mock('@/main/tray/tray-manager', () => ({
  trayManager: {
    startBusy: vi.fn(),
    stopBusy: vi.fn(),
  },
}));
vi.mock('@/main/windows/window-manager', () => ({
  windowManager: {
    broadcast: vi.fn(),
    createOrFocusPopupAtCursor: vi.fn(),
    showMainWindow: vi.fn(),
    navigateMainWindow: vi.fn(),
  },
}));

import { preserveTrailingNewlines } from '@/main/shortcuts/handlers';

describe('preserveTrailingNewlines', () => {
  it('returns rewritten text unchanged when original has no trailing newline', () => {
    expect(preserveTrailingNewlines('abc', 'xyz')).toBe('xyz');
  });

  it('adds missing LF newlines to match the original count', () => {
    expect(preserveTrailingNewlines('abc\n\n', 'xyz\n')).toBe('xyz\n\n');
  });

  it('does not remove trailing newlines when rewritten has more than original', () => {
    expect(preserveTrailingNewlines('abc\n', 'xyz\n\n')).toBe('xyz\n\n');
  });

  it('uses CRLF when the original trailing newlines are CRLF', () => {
    expect(preserveTrailingNewlines('abc\r\n\r\n', 'xyz')).toBe('xyz\r\n\r\n');
  });

  it('preserves rewritten text when newline counts already match', () => {
    expect(preserveTrailingNewlines('abc\r\n', 'xyz\n')).toBe('xyz\n');
  });

  it('appends original newline style even if rewritten uses a different one', () => {
    expect(preserveTrailingNewlines('abc\n\n', 'xyz\r\n')).toBe('xyz\r\n\n');
  });

  it('handles an original that is only newlines', () => {
    expect(preserveTrailingNewlines('\n\n', 'x')).toBe('x\n\n');
  });
});

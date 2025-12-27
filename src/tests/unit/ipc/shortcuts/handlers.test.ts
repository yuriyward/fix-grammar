/**
 * Shortcuts IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReregister, mockUnregisterAll } = vi.hoisted(() => ({
  mockReregister: vi.fn(),
  mockUnregisterAll: vi.fn(),
}));

vi.mock('@/main/shortcuts/manager', () => ({
  shortcutManager: {
    reregister: mockReregister,
    unregisterAll: mockUnregisterAll,
  },
}));

describe('Shortcuts IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-registers global shortcuts', async () => {
    const { reregisterShortcuts } = await import('@/ipc/shortcuts/handlers');
    const callReregister = createProcedureClient(reregisterShortcuts);

    await expect(callReregister(undefined)).resolves.toEqual({ success: true });
    expect(mockReregister).toHaveBeenCalledTimes(1);
  });

  it('unregisters all global shortcuts', async () => {
    const { unregisterAllShortcuts } = await import('@/ipc/shortcuts/handlers');
    const callUnregisterAll = createProcedureClient(unregisterAllShortcuts);

    await expect(callUnregisterAll(undefined)).resolves.toEqual({
      success: true,
    });
    expect(mockUnregisterAll).toHaveBeenCalledTimes(1);
  });
});

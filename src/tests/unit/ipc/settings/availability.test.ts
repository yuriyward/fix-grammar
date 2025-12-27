/**
 * Settings IPC handlers tests for isEncryptionAvailable
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock declaration must happen before imports that use it if doing top-level mocking,
// but for this simple test we can just mock the module directly returning a spy.
const mockIsEncryptionAvailable = vi.fn();

vi.mock('@/main/storage/api-keys', () => ({
  // Other mocks not needed for this specific test file
  deleteApiKey: vi.fn(),
  getApiKeyPreview: vi.fn(),
  hasApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  // The one we care about
  isEncryptionAvailable: mockIsEncryptionAvailable,
}));

vi.mock('@/main/storage/settings', () => ({
  store: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe('Settings IPC handlers - Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when encryption is available', async () => {
    mockIsEncryptionAvailable.mockReturnValue(true);

    const { isEncryptionAvailableHandler } = await import(
      '@/ipc/settings/handlers'
    );
    const callHandler = createProcedureClient(isEncryptionAvailableHandler);

    await expect(callHandler(undefined)).resolves.toEqual({
      available: true,
    });
    expect(mockIsEncryptionAvailable).toHaveBeenCalledTimes(1);
  });

  it('returns false when encryption is encryption unavailable', async () => {
    mockIsEncryptionAvailable.mockReturnValue(false);

    const { isEncryptionAvailableHandler } = await import(
      '@/ipc/settings/handlers'
    );
    const callHandler = createProcedureClient(isEncryptionAvailableHandler);

    await expect(callHandler(undefined)).resolves.toEqual({
      available: false,
    });
    expect(mockIsEncryptionAvailable).toHaveBeenCalledTimes(1);
  });
});

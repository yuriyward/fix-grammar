/**
 * Settings IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSettings } from '@/shared/types/settings';

const {
  mockDeleteApiKey,
  mockGetApiKeyPreview,
  mockHasApiKey,
  mockSaveApiKey,
  mockStore,
  mockStoreSet,
} = vi.hoisted(() => {
  const mockDeleteApiKey = vi.fn();
  const mockGetApiKeyPreview = vi.fn();
  const mockHasApiKey = vi.fn();
  const mockSaveApiKey = vi.fn();

  const mockStore: {
    store: AppSettings;
    set: (value: AppSettings) => void;
  } = {
    store: {
      hotkeys: {
        fixSelection: 'CommandOrControl+Shift+F',
        togglePopup: 'CommandOrControl+Shift+P',
      },
      ai: {
        provider: 'google',
        model: 'gemini-2.5-flash',
        role: 'grammar',
      },
      automation: {
        clipboardSyncDelayMs: 200,
        selectionDelayMs: 100,
      },
    },
    set: () => {},
  };

  const mockStoreSet = vi.fn((value: AppSettings) => {
    mockStore.store = {
      ...mockStore.store,
      ...value,
    };
  });

  mockStore.set = mockStoreSet;

  return {
    mockDeleteApiKey,
    mockGetApiKeyPreview,
    mockHasApiKey,
    mockSaveApiKey,
    mockStore,
    mockStoreSet,
  };
});

vi.mock('@/main/storage/api-keys', () => ({
  deleteApiKey: mockDeleteApiKey,
  getApiKeyPreview: mockGetApiKeyPreview,
  hasApiKey: mockHasApiKey,
  saveApiKey: mockSaveApiKey,
}));

vi.mock('@/main/storage/settings', () => ({
  store: mockStore,
}));

describe('Settings IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.store = {
      hotkeys: {
        fixSelection: 'CommandOrControl+Shift+F',
        togglePopup: 'CommandOrControl+Shift+P',
      },
      ai: {
        provider: 'google',
        model: 'gemini-2.5-flash',
        role: 'grammar',
      },
      automation: {
        clipboardSyncDelayMs: 200,
        selectionDelayMs: 100,
      },
    };
  });

  it('returns current settings', async () => {
    const { getSettings } = await import('@/ipc/settings/handlers');
    const callGetSettings = createProcedureClient(getSettings);

    await expect(callGetSettings(undefined)).resolves.toEqual(mockStore.store);
  });

  it('updates settings and returns the updated store', async () => {
    const { updateSettings } = await import('@/ipc/settings/handlers');
    const callUpdateSettings = createProcedureClient(updateSettings);

    const next: AppSettings = {
      hotkeys: {
        fixSelection: 'CommandOrControl+Shift+F',
        togglePopup: 'CommandOrControl+Shift+P',
      },
      ai: {
        provider: 'google',
        model: 'gemini-2.5-flash',
        role: 'grammar-tone',
      },
      automation: {
        clipboardSyncDelayMs: 250,
        selectionDelayMs: 150,
      },
    };

    await expect(callUpdateSettings(next)).resolves.toEqual({
      ...mockStore.store,
      ...next,
    });
    expect(mockStoreSet).toHaveBeenCalledWith(next);
  });

  it('rejects settings when model is not valid for provider', async () => {
    const { updateSettings } = await import('@/ipc/settings/handlers');
    const callUpdateSettings = createProcedureClient(updateSettings);

    const invalid: AppSettings = {
      hotkeys: {
        fixSelection: 'CommandOrControl+Shift+F',
        togglePopup: 'CommandOrControl+Shift+P',
      },
      ai: {
        provider: 'google',
        model: 'grok-beta' as AppSettings['ai']['model'],
        role: 'grammar',
      },
      automation: {
        clipboardSyncDelayMs: 200,
        selectionDelayMs: 100,
      },
    };

    await expect(callUpdateSettings(invalid)).rejects.toBeInstanceOf(Error);
    expect(mockStoreSet).not.toHaveBeenCalled();
  });

  it('rejects settings when a hotkey accelerator is invalid', async () => {
    const { updateSettings } = await import('@/ipc/settings/handlers');
    const callUpdateSettings = createProcedureClient(updateSettings);

    const invalid: AppSettings = {
      hotkeys: {
        fixSelection: 'CommandOrControl+Shift+F',
        togglePopup: 'Not A Hotkey',
      },
      ai: {
        provider: 'google',
        model: 'gemini-2.5-flash',
        role: 'grammar',
      },
      automation: {
        clipboardSyncDelayMs: 200,
        selectionDelayMs: 100,
      },
    };

    await expect(callUpdateSettings(invalid)).rejects.toBeInstanceOf(Error);
    expect(mockStoreSet).not.toHaveBeenCalled();
  });

  it('saves an API key for a provider', async () => {
    const { saveApiKeyHandler } = await import('@/ipc/settings/handlers');
    const callSaveApiKey = createProcedureClient(saveApiKeyHandler);

    await expect(
      callSaveApiKey({ provider: 'google', key: 'secret' }),
    ).resolves.toEqual({
      success: true,
    });
    expect(mockSaveApiKey).toHaveBeenCalledWith('google', 'secret');
  });

  it('returns API key presence and preview', async () => {
    mockHasApiKey.mockReturnValue(true);
    mockGetApiKeyPreview.mockReturnValue('sk-***');

    const { hasApiKeyHandler } = await import('@/ipc/settings/handlers');
    const callHasApiKey = createProcedureClient(hasApiKeyHandler);

    await expect(callHasApiKey({ provider: 'google' })).resolves.toEqual({
      hasKey: true,
      preview: 'sk-***',
    });
  });

  it('returns null preview when API key is missing', async () => {
    mockHasApiKey.mockReturnValue(false);

    const { hasApiKeyHandler } = await import('@/ipc/settings/handlers');
    const callHasApiKey = createProcedureClient(hasApiKeyHandler);

    await expect(callHasApiKey({ provider: 'google' })).resolves.toEqual({
      hasKey: false,
      preview: null,
    });
    expect(mockGetApiKeyPreview).not.toHaveBeenCalled();
  });

  it('deletes an API key for a provider', async () => {
    const { deleteApiKeyHandler } = await import('@/ipc/settings/handlers');
    const callDeleteApiKey = createProcedureClient(deleteApiKeyHandler);

    await expect(callDeleteApiKey({ provider: 'google' })).resolves.toEqual({
      success: true,
    });
    expect(mockDeleteApiKey).toHaveBeenCalledWith('google');
  });
});

/**
 * Settings IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HOTKEYS } from '@/shared/config/hotkeys';
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

  // Use placeholder values here - will be overwritten in beforeEach with DEFAULT_HOTKEYS
  const mockStore: {
    store: AppSettings;
    set: (value: AppSettings) => void;
  } = {
    store: {
      hotkeys: {
        fixSelection: '',
        togglePopup: '',
      },
      ai: {
        provider: 'google',
        model: 'gemini-3-flash-preview',
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
        fixSelection: DEFAULT_HOTKEYS.fixSelection,
        togglePopup: DEFAULT_HOTKEYS.togglePopup,
      },
      ai: {
        provider: 'google',
        model: 'gemini-3-flash-preview',
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
        fixSelection: DEFAULT_HOTKEYS.fixSelection,
        togglePopup: DEFAULT_HOTKEYS.togglePopup,
      },
      ai: {
        provider: 'google',
        model: 'gemini-3-flash-preview',
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

  it('accepts custom model IDs for all providers', async () => {
    const { updateSettings } = await import('@/ipc/settings/handlers');
    const callUpdateSettings = createProcedureClient(updateSettings);

    const customModel: AppSettings = {
      hotkeys: {
        fixSelection: DEFAULT_HOTKEYS.fixSelection,
        togglePopup: DEFAULT_HOTKEYS.togglePopup,
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

    await expect(callUpdateSettings(customModel)).resolves.toEqual({
      ...mockStore.store,
      ...customModel,
    });
    expect(mockStoreSet).toHaveBeenCalledWith(customModel);
  });

  it('rejects settings when a hotkey accelerator is invalid', async () => {
    const { updateSettings } = await import('@/ipc/settings/handlers');
    const callUpdateSettings = createProcedureClient(updateSettings);

    const invalid: AppSettings = {
      hotkeys: {
        fixSelection: DEFAULT_HOTKEYS.fixSelection,
        togglePopup: 'Not A Hotkey',
      },
      ai: {
        provider: 'google',
        model: 'gemini-3-flash-preview',
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

  describe('fetchOpenRouterModels', () => {
    const mockFetch = vi.fn();
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = mockFetch;
      mockFetch.mockReset();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('fetches and caches OpenRouter models', async () => {
      const mockModels = [
        { id: 'openai/gpt-4', name: 'GPT-4' },
        { id: 'anthropic/claude-3', name: 'Claude 3' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockModels }),
      });

      const { fetchOpenRouterModels } = await import('@/ipc/settings/handlers');
      const callFetchOpenRouterModels = createProcedureClient(
        fetchOpenRouterModels,
      );

      const result = await callFetchOpenRouterModels(undefined);

      expect(result).toEqual({
        success: true,
        message: 'Fetched 2 models from OpenRouter',
        models: mockModels,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      expect(mockStoreSet).toHaveBeenCalledWith('openrouterModelsCache', {
        models: mockModels,
        timestamp: expect.any(Number),
      });
    });

    it('handles OpenRouter API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { fetchOpenRouterModels } = await import('@/ipc/settings/handlers');
      const callFetchOpenRouterModels = createProcedureClient(
        fetchOpenRouterModels,
      );

      const result = await callFetchOpenRouterModels(undefined);

      expect(result).toEqual({
        success: false,
        error: 'OpenRouter API responded with status 401',
      });

      expect(mockStoreSet).not.toHaveBeenCalledWith(
        'openrouterModelsCache',
        expect.anything(),
      );
    });

    it('handles network timeout', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      const { fetchOpenRouterModels } = await import('@/ipc/settings/handlers');
      const callFetchOpenRouterModels = createProcedureClient(
        fetchOpenRouterModels,
      );

      const result = await callFetchOpenRouterModels(undefined);

      expect(result).toEqual({
        success: false,
        error: 'The operation was aborted',
      });

      expect(mockStoreSet).not.toHaveBeenCalledWith(
        'openrouterModelsCache',
        expect.anything(),
      );
    });
  });
});

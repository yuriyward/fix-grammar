/**
 * useApiKey hook tests
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIProvider } from '@/shared/config/ai-models';

// Use vi.hoisted to define mocks before they're used in vi.mock
const {
  mockHasApiKey,
  mockSaveApiKey,
  mockDeleteApiKey,
  mockIsEncryptionAvailable,
  mockToastAdd,
} = vi.hoisted(() => ({
  mockHasApiKey: vi.fn(),
  mockSaveApiKey: vi.fn(),
  mockDeleteApiKey: vi.fn(),
  mockIsEncryptionAvailable: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock('@/actions/settings', () => ({
  hasApiKey: mockHasApiKey,
  saveApiKey: mockSaveApiKey,
  deleteApiKey: mockDeleteApiKey,
  isEncryptionAvailable: mockIsEncryptionAvailable,
}));

vi.mock('@/renderer/components/ui/toast', () => ({
  toastManager: { add: mockToastAdd },
}));

import { useApiKey } from '@/renderer/features/settings/hooks/use-api-key';

describe('useApiKey', () => {
  const defaultProvider: AIProvider = 'google';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockHasApiKey.mockResolvedValue({ hasKey: false, preview: null });
    mockIsEncryptionAvailable.mockResolvedValue(true);
    mockSaveApiKey.mockResolvedValue(undefined);
    mockDeleteApiKey.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty apiKey', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      expect(result.current.apiKey).toBe('');
    });

    it('should initialize with empty apiKeyPreview', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      expect(result.current.apiKeyPreview).toBe('');
    });

    it('should initialize with hasKey=false', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      expect(result.current.hasKey).toBe(false);
    });

    it('should initialize with isEncryptionAvailable=null', () => {
      // Don't resolve the mock immediately to capture initial state
      mockIsEncryptionAvailable.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { result } = renderHook(() => useApiKey(defaultProvider));

      expect(result.current.isEncryptionAvailable).toBeNull();
    });
  });

  describe('Encryption Availability Check', () => {
    it('should check encryption availability on mount', async () => {
      renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockIsEncryptionAvailable).toHaveBeenCalled();
      });
    });

    it('should set isEncryptionAvailable=true when available', async () => {
      mockIsEncryptionAvailable.mockResolvedValue(true);

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.isEncryptionAvailable).toBe(true);
      });
    });

    it('should set isEncryptionAvailable=false when unavailable', async () => {
      mockIsEncryptionAvailable.mockResolvedValue(false);

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.isEncryptionAvailable).toBe(false);
      });
    });

    it('should default to true on check failure', async () => {
      mockIsEncryptionAvailable.mockRejectedValue(
        new Error('Encryption check failed'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.isEncryptionAvailable).toBe(true);
      });

      consoleSpy.mockRestore();
    });

    it('should log error on check failure', async () => {
      const error = new Error('Encryption check failed');
      mockIsEncryptionAvailable.mockRejectedValue(error);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to check encryption availability:',
          error,
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('loadApiKeyStatus', () => {
    it('should call hasApiKey with current provider', async () => {
      const provider: AIProvider = 'openai';

      renderHook(() => useApiKey(provider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalledWith(provider);
      });
    });

    it('should update hasKey from response', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'sk-...abc' });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
      });
    });

    it('should update apiKeyPreview from response', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'sk-...xyz' });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.apiKeyPreview).toBe('sk-...xyz');
      });
    });

    it('should handle null preview gracefully', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: null });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
        expect(result.current.apiKeyPreview).toBe('');
      });
    });

    it('should log error on failure', async () => {
      const error = new Error('Failed to check API key');
      mockHasApiKey.mockRejectedValue(error);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to check API key:',
          error,
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Provider Change Effect', () => {
    it('should reload API key status when provider changes', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: false, preview: null });

      const { rerender } = renderHook(({ provider }) => useApiKey(provider), {
        initialProps: { provider: 'google' as AIProvider },
      });

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalledWith('google');
      });

      mockHasApiKey.mockClear();
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'xai-...key' });

      rerender({ provider: 'xai' as AIProvider });

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalledWith('xai');
      });
    });

    it('should clear previous provider state', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'google-key' });

      const { result, rerender } = renderHook(
        ({ provider }) => useApiKey(provider),
        { initialProps: { provider: 'google' as AIProvider } },
      );

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
        expect(result.current.apiKeyPreview).toBe('google-key');
      });

      // Change provider and return different state
      mockHasApiKey.mockResolvedValue({ hasKey: false, preview: null });

      rerender({ provider: 'openai' as AIProvider });

      await waitFor(() => {
        expect(result.current.hasKey).toBe(false);
        expect(result.current.apiKeyPreview).toBe('');
      });
    });
  });

  describe('handleSaveApiKey', () => {
    it('should not save if apiKey is empty', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockSaveApiKey).not.toHaveBeenCalled();
    });

    it('should not save if apiKey is whitespace only', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('   ');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockSaveApiKey).not.toHaveBeenCalled();
    });

    it('should call saveApiKey with provider and key', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockSaveApiKey).toHaveBeenCalledWith(
        defaultProvider,
        'my-api-key-123',
      );
    });

    it('should clear apiKey input after successful save', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      expect(result.current.apiKey).toBe('my-api-key-123');

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(result.current.apiKey).toBe('');
    });

    it('should reload API key status after save', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      mockHasApiKey.mockClear();
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'my-...123' });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockHasApiKey).toHaveBeenCalledWith(defaultProvider);
    });

    it('should show success toast on save', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'API key saved',
      });
    });

    it('should show error toast on save failure', async () => {
      mockSaveApiKey.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to save API key',
        description: 'Save failed',
      });
    });

    it('should extract message from Error objects', async () => {
      mockSaveApiKey.mockRejectedValue(new Error('Encryption unavailable'));

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to save API key',
        description: 'Encryption unavailable',
      });
    });

    it('should stringify non-Error exceptions', async () => {
      mockSaveApiKey.mockRejectedValue('String error');

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('my-api-key-123');
      });

      await act(async () => {
        await result.current.handleSaveApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to save API key',
        description: 'String error',
      });
    });
  });

  describe('handleDeleteApiKey', () => {
    it('should call deleteApiKey with provider', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockDeleteApiKey).toHaveBeenCalledWith(defaultProvider);
    });

    it('should reload API key status after delete', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: 'key-preview' });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
      });

      mockHasApiKey.mockClear();
      mockHasApiKey.mockResolvedValue({ hasKey: false, preview: null });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockHasApiKey).toHaveBeenCalledWith(defaultProvider);
      await waitFor(() => {
        expect(result.current.hasKey).toBe(false);
      });
    });

    it('should show success toast on delete', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'API key deleted',
      });
    });

    it('should show error toast on delete failure', async () => {
      mockDeleteApiKey.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to delete API key',
        description: 'Delete failed',
      });
    });

    it('should extract message from Error objects on delete failure', async () => {
      mockDeleteApiKey.mockRejectedValue(new Error('Key not found'));

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to delete API key',
        description: 'Key not found',
      });
    });

    it('should stringify non-Error exceptions on delete failure', async () => {
      mockDeleteApiKey.mockRejectedValue('String delete error');

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleDeleteApiKey();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to delete API key',
        description: 'String delete error',
      });
    });
  });

  describe('apiKeyPlaceholder', () => {
    it('should return preview when hasKey and preview exists', async () => {
      mockHasApiKey.mockResolvedValue({
        hasKey: true,
        preview: 'sk-...abc123',
      });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.apiKeyPlaceholder).toBe('sk-...abc123');
      });
    });

    it('should return "******" when hasKey but no preview', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: null });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
        expect(result.current.apiKeyPlaceholder).toBe('******');
      });
    });

    it('should return "******" when hasKey but preview is empty string', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: true, preview: '' });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.hasKey).toBe(true);
        expect(result.current.apiKeyPlaceholder).toBe('******');
      });
    });

    it('should return "Enter your API key" when no key', async () => {
      mockHasApiKey.mockResolvedValue({ hasKey: false, preview: null });

      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(result.current.apiKeyPlaceholder).toBe('Enter your API key');
      });
    });
  });

  describe('setApiKey', () => {
    it('should update apiKey state', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('new-api-key');
      });

      expect(result.current.apiKey).toBe('new-api-key');
    });

    it('should allow setting empty string', async () => {
      const { result } = renderHook(() => useApiKey(defaultProvider));

      await waitFor(() => {
        expect(mockHasApiKey).toHaveBeenCalled();
      });

      act(() => {
        result.current.setApiKey('some-key');
      });

      expect(result.current.apiKey).toBe('some-key');

      act(() => {
        result.current.setApiKey('');
      });

      expect(result.current.apiKey).toBe('');
    });
  });
});

/**
 * useLMStudioModels hook tests
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIProvider, ModelConfig } from '@/shared/config/ai-models';

// Use vi.hoisted to define mocks before they're used in vi.mock
const { mockTestLMStudioConnection, mockGetModelsForProvider, mockToastAdd } =
  vi.hoisted(() => ({
    mockTestLMStudioConnection: vi.fn(),
    mockGetModelsForProvider: vi.fn(),
    mockToastAdd: vi.fn(),
  }));

vi.mock('@/actions/settings', () => ({
  testLMStudioConnection: mockTestLMStudioConnection,
}));

vi.mock('@/shared/config/ai-models', () => ({
  getModelsForProvider: mockGetModelsForProvider,
}));

vi.mock('@/renderer/components/ui/toast', () => ({
  toastManager: { add: mockToastAdd },
}));

import { useLMStudioModels } from '@/renderer/features/settings/hooks/use-lmstudio-models';

// Test utilities
const createPopularModels = (): ModelConfig[] => [
  {
    id: 'google/gemma-3n-e4b',
    name: 'Google Gemma 3n E4B',
    provider: 'lmstudio',
  },
  { id: 'qwen3-8b-instruct', name: 'Qwen 3 8B Instruct', provider: 'lmstudio' },
];

const createSuccessResult = (models: string[] = ['model-1', 'model-2']) => ({
  success: true as const,
  message: 'Connected successfully',
  models,
});

const createFailureResult = (error?: string) => ({
  success: false as const,
  error,
});

describe('useLMStudioModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelsForProvider.mockReturnValue(createPopularModels());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with isTestingConnection=false', () => {
      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      expect(result.current.isTestingConnection).toBe(false);
    });

    it('should initialize with empty discoveredModels', () => {
      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      expect(result.current.discoveredModels).toEqual([]);
    });

    it('should initialize with popularModels from config', () => {
      const popularModels = createPopularModels();
      mockGetModelsForProvider.mockReturnValue(popularModels);

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      expect(result.current.popularModels).toEqual(popularModels);
      expect(mockGetModelsForProvider).toHaveBeenCalledWith('lmstudio');
    });

    it('should initialize with empty extraModels', () => {
      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      expect(result.current.extraModels).toEqual([]);
    });
  });

  describe('handleFetchModels - Validation', () => {
    it('should show error toast if baseURL is empty', async () => {
      const { result } = renderHook(() => useLMStudioModels('lmstudio', ''));

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'Base URL is required',
      });
    });

    it('should show error toast if baseURL is whitespace only', async () => {
      const { result } = renderHook(() => useLMStudioModels('lmstudio', '   '));

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'Base URL is required',
      });
    });

    it('should not call testLMStudioConnection if baseURL invalid', async () => {
      const { result } = renderHook(() => useLMStudioModels('lmstudio', ''));

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockTestLMStudioConnection).not.toHaveBeenCalled();
    });
  });

  describe('handleFetchModels - Success Flow', () => {
    it('should set isTestingConnection=true during fetch', async () => {
      let resolveConnection: (
        value: ReturnType<typeof createSuccessResult>,
      ) => void;
      mockTestLMStudioConnection.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConnection = resolve;
          }),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Start fetch but don't await
      act(() => {
        result.current.handleFetchModels();
      });

      // Check that isTestingConnection is true during the operation
      expect(result.current.isTestingConnection).toBe(true);

      // Cleanup: resolve the pending promise
      await act(async () => {
        resolveConnection?.(createSuccessResult());
      });
    });

    it('should call testLMStudioConnection with trimmed baseURL', async () => {
      mockTestLMStudioConnection.mockResolvedValue(createSuccessResult());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', '  http://localhost:1234  '),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockTestLMStudioConnection).toHaveBeenCalledWith(
        'http://localhost:1234',
      );
    });

    it('should deduplicate discovered models', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1', 'model-2', 'model-1', 'model-2']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1', 'model-2']);
    });

    it('should filter empty model strings', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1', '', 'model-2', '   ']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1', 'model-2']);
    });

    it('should trim model names', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['  model-1  ', '  model-2  ']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1', 'model-2']);
    });

    it('should update discoveredModels on success', async () => {
      const models = ['custom-model-1', 'custom-model-2'];
      mockTestLMStudioConnection.mockResolvedValue(createSuccessResult(models));

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(models);
    });

    it('should show success toast with message', async () => {
      mockTestLMStudioConnection.mockResolvedValue(createSuccessResult());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'Connected successfully',
      });
    });

    it('should show default success toast if no message', async () => {
      mockTestLMStudioConnection.mockResolvedValue({
        success: true,
        models: ['model-1'],
      });

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'Models fetched',
      });
    });

    it('should set isTestingConnection=false after success', async () => {
      mockTestLMStudioConnection.mockResolvedValue(createSuccessResult());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.isTestingConnection).toBe(false);
    });

    it('should handle null models array', async () => {
      mockTestLMStudioConnection.mockResolvedValue({
        success: true,
        message: 'Connected',
        models: null,
      });

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual([]);
    });

    it('should handle undefined models array', async () => {
      mockTestLMStudioConnection.mockResolvedValue({
        success: true,
        message: 'Connected',
      });

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual([]);
    });
  });

  describe('handleFetchModels - Failure Flow', () => {
    it('should show error toast when result.success=false', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createFailureResult('Connection refused'),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'Connection refused',
      });
    });

    it('should show error from result.error', async () => {
      const errorMessage = 'Server not responding';
      mockTestLMStudioConnection.mockResolvedValue(
        createFailureResult(errorMessage),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: errorMessage,
      });
    });

    it('should show "Unknown error" if no error message', async () => {
      mockTestLMStudioConnection.mockResolvedValue(createFailureResult());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'Unknown error',
      });
    });

    it('should not update discoveredModels on failure', async () => {
      // First, successfully fetch some models
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1']);

      // Now simulate a failure - models should remain unchanged
      mockTestLMStudioConnection.mockResolvedValue(
        createFailureResult('Connection failed'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      // discoveredModels should still have the previous value
      expect(result.current.discoveredModels).toEqual(['model-1']);
    });

    it('should set isTestingConnection=false after failure', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createFailureResult('Connection failed'),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.isTestingConnection).toBe(false);
    });
  });

  describe('handleFetchModels - Exception Handling', () => {
    it('should catch and display Error message', async () => {
      const errorMessage = 'Network connection failed';
      mockTestLMStudioConnection.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: errorMessage,
      });
    });

    it('should stringify non-Error exceptions', async () => {
      mockTestLMStudioConnection.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'String error',
      });
    });

    it('should stringify object exceptions', async () => {
      mockTestLMStudioConnection.mockRejectedValue({ code: 'ERR_001' });

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Fetch Models Failed',
        description: '[object Object]',
      });
    });

    it('should set isTestingConnection=false after exception', async () => {
      mockTestLMStudioConnection.mockRejectedValue(
        new Error('Unexpected error'),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.isTestingConnection).toBe(false);
    });
  });

  describe('extraModels Computation', () => {
    it('should exclude popular models from extraModels', async () => {
      const popularModels = createPopularModels();
      mockGetModelsForProvider.mockReturnValue(popularModels);
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult([
          'google/gemma-3n-e4b', // popular
          'custom-model', // extra
        ]),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual(['custom-model']);
    });

    it('should include only discovered models not in popular', async () => {
      const popularModels = createPopularModels();
      mockGetModelsForProvider.mockReturnValue(popularModels);
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult([
          'extra-model-1',
          'extra-model-2',
          'qwen3-8b-instruct', // popular - should be excluded
        ]),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual([
        'extra-model-1',
        'extra-model-2',
      ]);
    });

    it('should update when discoveredModels changes', async () => {
      mockGetModelsForProvider.mockReturnValue(createPopularModels());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Initially empty
      expect(result.current.extraModels).toEqual([]);

      // First fetch
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['extra-1']),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual(['extra-1']);

      // Second fetch with different models
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['extra-2', 'extra-3']),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual(['extra-2', 'extra-3']);
    });

    it('should return empty array when all discovered models are popular', async () => {
      const popularModels = createPopularModels();
      mockGetModelsForProvider.mockReturnValue(popularModels);
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['google/gemma-3n-e4b', 'qwen3-8b-instruct']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual([]);
    });
  });

  describe('URL Change Detection', () => {
    it('should reset models when baseURL changes', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result, rerender } = renderHook(
        ({ provider, baseURL }) => useLMStudioModels(provider, baseURL),
        {
          initialProps: {
            provider: 'lmstudio' as const,
            baseURL: 'http://localhost:1234',
          },
        },
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1']);

      // Change the URL
      rerender({
        provider: 'lmstudio' as const,
        baseURL: 'http://localhost:5678',
      });

      // Wait for the effect to run
      await waitFor(() => {
        expect(result.current.discoveredModels).toEqual([]);
      });
    });

    it('should not reset if URL unchanged', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result, rerender } = renderHook(
        ({ provider, baseURL }) => useLMStudioModels(provider, baseURL),
        {
          initialProps: {
            provider: 'lmstudio' as const,
            baseURL: 'http://localhost:1234',
          },
        },
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1']);

      // Rerender with same URL
      rerender({
        provider: 'lmstudio' as const,
        baseURL: 'http://localhost:1234',
      });

      // Models should still be there
      expect(result.current.discoveredModels).toEqual(['model-1']);
    });

    it('should not reset if provider is not lmstudio', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result, rerender } = renderHook(
        ({ provider, baseURL }: { provider: AIProvider; baseURL: string }) =>
          useLMStudioModels(provider, baseURL),
        {
          initialProps: {
            provider: 'lmstudio' as AIProvider,
            baseURL: 'http://localhost:1234',
          },
        },
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1']);

      // Change provider to something else
      rerender({
        provider: 'google' as AIProvider,
        baseURL: 'http://localhost:5678',
      });

      // Models should still be there since provider is not lmstudio
      expect(result.current.discoveredModels).toEqual(['model-1']);
    });

    it('should handle URL with whitespace changes', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result, rerender } = renderHook(
        ({ provider, baseURL }) => useLMStudioModels(provider, baseURL),
        {
          initialProps: {
            provider: 'lmstudio' as const,
            baseURL: 'http://localhost:1234',
          },
        },
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1']);

      // Change URL with whitespace (should be trimmed and considered same)
      rerender({
        provider: 'lmstudio' as const,
        baseURL: '  http://localhost:1234  ',
      });

      // Models should still be there since trimmed URL is the same
      expect(result.current.discoveredModels).toEqual(['model-1']);
    });
  });

  describe('resetModels', () => {
    it('should clear discoveredModels', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1', 'model-2']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['model-1', 'model-2']);

      // Reset models
      act(() => {
        result.current.resetModels();
      });

      expect(result.current.discoveredModels).toEqual([]);
    });

    it('should clear extraModels after reset', async () => {
      mockGetModelsForProvider.mockReturnValue(createPopularModels());
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['extra-model']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Fetch models first
      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.extraModels).toEqual(['extra-model']);

      // Reset models
      act(() => {
        result.current.resetModels();
      });

      expect(result.current.extraModels).toEqual([]);
    });

    it('should be callable multiple times', async () => {
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['model-1']),
      );

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Fetch models
      await act(async () => {
        await result.current.handleFetchModels();
      });

      // Reset multiple times
      act(() => {
        result.current.resetModels();
      });

      act(() => {
        result.current.resetModels();
      });

      expect(result.current.discoveredModels).toEqual([]);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full workflow: fetch, reset, fetch again', async () => {
      mockGetModelsForProvider.mockReturnValue(createPopularModels());

      const { result } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      // Initial state
      expect(result.current.discoveredModels).toEqual([]);
      expect(result.current.extraModels).toEqual([]);

      // First fetch
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['extra-1', 'google/gemma-3n-e4b']),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual([
        'extra-1',
        'google/gemma-3n-e4b',
      ]);
      expect(result.current.extraModels).toEqual(['extra-1']);

      // Reset
      act(() => {
        result.current.resetModels();
      });

      expect(result.current.discoveredModels).toEqual([]);
      expect(result.current.extraModels).toEqual([]);

      // Second fetch with different models
      mockTestLMStudioConnection.mockResolvedValue(
        createSuccessResult(['extra-2', 'extra-3']),
      );

      await act(async () => {
        await result.current.handleFetchModels();
      });

      expect(result.current.discoveredModels).toEqual(['extra-2', 'extra-3']);
      expect(result.current.extraModels).toEqual(['extra-2', 'extra-3']);
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useLMStudioModels('lmstudio', 'http://localhost:1234'),
      );

      const initialHandleFetchModels = result.current.handleFetchModels;
      const initialResetModels = result.current.resetModels;

      rerender();

      // resetModels should be stable (wrapped in useCallback with no deps)
      expect(result.current.resetModels).toBe(initialResetModels);

      // handleFetchModels depends on baseURL, so it may change
      // but with same baseURL it should be stable
      expect(result.current.handleFetchModels).toBe(initialHandleFetchModels);
    });
  });
});

/**
 * OpenRouter model discovery hook
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOpenRouterModels, getSettings } from '@/actions/settings';
import { toastManager } from '@/renderer/components/ui/toast';
import { OPENROUTER_CACHE_DURATION_MS } from '@/shared/config/ai';
import {
  type AIProvider,
  getModelsForProvider,
  type ModelConfig,
} from '@/shared/config/ai-models';

/**
 * Deduplicates models by filtering out fetched models that are already in the popular list
 */
function deduplicateModels(
  popularModels: ModelConfig[],
  fetchedModels: ModelConfig[],
): ModelConfig[] {
  const popularIds = new Set(popularModels.map((m) => m.id));
  return fetchedModels.filter((m) => !popularIds.has(m.id));
}

export interface ModelGroup {
  value: string;
  items: ModelConfig[];
}

export interface UseOpenRouterModelsReturn {
  isLoadingModels: boolean;
  fetchedModels: ModelConfig[];
  popularModels: ModelConfig[];
  allModels: ModelConfig[];
  groupedModels: ModelGroup[];
  handleFetchModels: () => Promise<void>;
  resetModels: () => void;
}

export function useOpenRouterModels(
  provider: AIProvider,
): UseOpenRouterModelsReturn {
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<ModelConfig[]>([]);

  const popularModels = useMemo(() => getModelsForProvider('openrouter'), []);

  const allModels = useMemo(() => {
    const uniqueFetched = deduplicateModels(popularModels, fetchedModels);
    return [...popularModels, ...uniqueFetched];
  }, [popularModels, fetchedModels]);

  const groupedModels = useMemo(() => {
    const groups: ModelGroup[] = [
      {
        value: 'Popular Models',
        items: popularModels,
      },
    ];

    // Only add "Other Models" group if we have fetched models
    if (fetchedModels.length > 0) {
      const uniqueFetched = deduplicateModels(popularModels, fetchedModels);
      if (uniqueFetched.length > 0) {
        groups.push({
          value: `Other Models (${uniqueFetched.length})`,
          items: uniqueFetched,
        });
      }
    }

    return groups;
  }, [popularModels, fetchedModels]);

  const resetModels = useCallback(() => {
    setFetchedModels([]);
  }, []);

  // Load cached models on mount
  useEffect(() => {
    if (provider !== 'openrouter') return;

    const loadCachedModels = async () => {
      try {
        const settings = await getSettings();
        const cache = settings.openrouterModelsCache;

        if (!cache) return;

        const now = Date.now();
        const age = now - cache.timestamp;

        // Only use cache if it's less than 24 hours old
        if (age < OPENROUTER_CACHE_DURATION_MS) {
          const models = cache.models.map((m) => ({
            id: m.id,
            name: m.name,
            provider: 'openrouter' as const,
          }));
          setFetchedModels(models);
        }
      } catch (error) {
        // Show toast if cache is corrupted, fallback to popular models only
        console.error('Failed to load cached OpenRouter models:', error);
        toastManager.add({
          type: 'warning',
          title: 'Cache Load Failed',
          description:
            'Using popular models only. You can fetch the full list manually.',
        });
        // Explicitly set to empty to ensure we fall back to popular models
        setFetchedModels([]);
      }
    };

    loadCachedModels();
  }, [provider]);

  const handleFetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const result = await fetchOpenRouterModels();

      if (result.success && result.models) {
        const models = result.models.map((m) => ({
          id: m.id,
          name: m.name,
          provider: 'openrouter' as const,
        }));
        setFetchedModels(models);
        toastManager.add({
          type: 'success',
          title: result.message || 'Models fetched',
        });
      } else {
        toastManager.add({
          type: 'error',
          title: 'Fetch Models Failed',
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Fetch Models Failed',
        description: message,
      });
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  return {
    isLoadingModels,
    fetchedModels,
    popularModels,
    allModels,
    groupedModels,
    handleFetchModels,
    resetModels,
  };
}

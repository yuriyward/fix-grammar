/**
 * LM Studio model discovery hook
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { testLMStudioConnection } from '@/actions/settings';
import { toastManager } from '@/renderer/components/ui/toast';
import {
  type AIProvider,
  getModelsForProvider,
  type ModelConfig,
} from '@/shared/config/ai-models';

export interface LMStudioModelGroup {
  value: string;
  items: Array<{ id: string; name: string }>;
}

export interface UseLMStudioModelsReturn {
  isTestingConnection: boolean;
  discoveredModels: string[];
  popularModels: ModelConfig[];
  extraModels: string[];
  groupedModels: LMStudioModelGroup[];
  handleFetchModels: () => Promise<void>;
  resetModels: () => void;
}

export function useLMStudioModels(
  provider: AIProvider,
  baseURL: string,
): UseLMStudioModelsReturn {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [modelsBaseURL, setModelsBaseURL] = useState<string | null>(null);

  const popularModels = getModelsForProvider(provider);

  const extraModels = (() => {
    const known = new Set(popularModels.map((entry) => entry.id));
    return discoveredModels.filter((id) => !known.has(id));
  })();

  const groupedModels = useMemo(() => {
    const groups: LMStudioModelGroup[] = [];

    // Add "Discovered Models" group if we have extra models
    if (extraModels.length > 0) {
      groups.push({
        value: 'Discovered Models',
        items: extraModels.map((id) => ({ id, name: id })),
      });
    }

    // Always add "Popular Models" group
    groups.push({
      value: 'Popular Models',
      items: popularModels.map((m) => ({ id: m.id, name: m.name })),
    });

    return groups;
  }, [extraModels, popularModels]);

  const resetModels = useCallback(() => {
    setDiscoveredModels([]);
    setModelsBaseURL(null);
  }, []);

  // Reset models when URL changes
  useEffect(() => {
    if (provider !== 'lmstudio') return;
    const trimmed = baseURL.trim();
    if (!modelsBaseURL || trimmed === modelsBaseURL) return;
    resetModels();
  }, [provider, baseURL, modelsBaseURL, resetModels]);

  const handleFetchModels = useCallback(async () => {
    if (!baseURL.trim()) {
      toastManager.add({
        type: 'error',
        title: 'Fetch Models Failed',
        description: 'Base URL is required',
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await testLMStudioConnection(baseURL.trim());

      if (result.success) {
        const models = Array.from(
          new Set((result.models ?? []).map((entry) => entry.trim())),
        ).filter((entry) => entry.length > 0);
        setDiscoveredModels(models);
        setModelsBaseURL(baseURL.trim());
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
      setIsTestingConnection(false);
    }
  }, [baseURL]);

  return {
    isTestingConnection,
    discoveredModels,
    popularModels,
    extraModels,
    groupedModels,
    handleFetchModels,
    resetModels,
  };
}

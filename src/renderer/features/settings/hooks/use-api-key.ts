/**
 * API key management hook
 */
import { useCallback, useEffect, useState } from 'react';
import {
  isEncryptionAvailable as checkEncryptionAvailable,
  deleteApiKey,
  hasApiKey,
  saveApiKey,
} from '@/actions/settings';
import { toastManager } from '@/renderer/components/ui/toast';
import type { AIProvider } from '@/shared/config/ai-models';

export interface UseApiKeyReturn {
  apiKey: string;
  setApiKey: (key: string) => void;
  apiKeyPreview: string;
  hasKey: boolean;
  isEncryptionAvailable: boolean | null;
  apiKeyPlaceholder: string;
  handleSaveApiKey: () => Promise<void>;
  handleDeleteApiKey: () => Promise<void>;
}

export function useApiKey(provider: AIProvider): UseApiKeyReturn {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyPreview, setApiKeyPreview] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isEncryptionAvailable, setIsEncryptionAvailable] = useState<
    boolean | null
  >(null);

  const loadApiKeyStatus = useCallback(async () => {
    try {
      const result = await hasApiKey(provider);
      setHasKey(result.hasKey);
      setApiKeyPreview(result.preview ?? '');
    } catch (error) {
      console.error('Failed to check API key:', error);
    }
  }, [provider]);

  // Check encryption availability on mount
  useEffect(() => {
    void (async () => {
      try {
        const available = await checkEncryptionAvailable();
        setIsEncryptionAvailable(available);
      } catch (error) {
        console.error('Failed to check encryption availability:', error);
        setIsEncryptionAvailable(true);
      }
    })();
  }, []);

  // Load API key status when provider changes
  useEffect(() => {
    void loadApiKeyStatus();
  }, [loadApiKeyStatus]);

  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim()) return;

    try {
      await saveApiKey(provider, apiKey);
      setApiKey('');
      await loadApiKeyStatus();
      toastManager.add({ type: 'success', title: 'API key saved' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Failed to save API key',
        description: message,
      });
    }
  }, [apiKey, provider, loadApiKeyStatus]);

  const handleDeleteApiKey = useCallback(async () => {
    try {
      await deleteApiKey(provider);
      await loadApiKeyStatus();
      toastManager.add({ type: 'success', title: 'API key deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Failed to delete API key',
        description: message,
      });
    }
  }, [provider, loadApiKeyStatus]);

  const apiKeyPlaceholder = hasKey
    ? apiKeyPreview || '******'
    : 'Enter your API key';

  return {
    apiKey,
    setApiKey,
    apiKeyPreview,
    hasKey,
    isEncryptionAvailable,
    apiKeyPlaceholder,
    handleSaveApiKey,
    handleDeleteApiKey,
  };
}

/**
 * Langfuse API key management hook
 */
import { useCallback, useEffect, useState } from 'react';
import {
  deleteLangfuseKeys,
  hasLangfuseKeys,
  saveLangfuseKeys,
} from '@/actions/settings';
import { toastManager } from '@/renderer/components/ui/toast';

export interface UseLangfuseKeysReturn {
  publicKey: string;
  setPublicKey: (key: string) => void;
  secretKey: string;
  setSecretKey: (key: string) => void;
  hasKeys: boolean;
  publicKeyPreview: string;
  secretKeyPreview: string;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

export function useLangfuseKeys(): UseLangfuseKeysReturn {
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [hasKeys, setHasKeys] = useState(false);
  const [publicKeyPreview, setPublicKeyPreview] = useState('');
  const [secretKeyPreview, setSecretKeyPreview] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const result = await hasLangfuseKeys();
      setHasKeys(result.hasKeys);
      setPublicKeyPreview(result.publicKeyPreview ?? '');
      setSecretKeyPreview(result.secretKeyPreview ?? '');
    } catch (error) {
      console.error('Failed to check Langfuse keys:', error);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSave = useCallback(async () => {
    if (!publicKey.trim() || !secretKey.trim()) return;

    try {
      await saveLangfuseKeys(publicKey, secretKey);
      setPublicKey('');
      setSecretKey('');
      await loadStatus();
      toastManager.add({ type: 'success', title: 'Langfuse keys saved' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Failed to save Langfuse keys',
        description: message,
      });
    }
  }, [publicKey, secretKey, loadStatus]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteLangfuseKeys();
      await loadStatus();
      toastManager.add({ type: 'success', title: 'Langfuse keys deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Failed to delete Langfuse keys',
        description: message,
      });
    }
  }, [loadStatus]);

  return {
    publicKey,
    setPublicKey,
    secretKey,
    setSecretKey,
    hasKeys,
    publicKeyPreview,
    secretKeyPreview,
    handleSave,
    handleDelete,
  };
}

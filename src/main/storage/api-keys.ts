/**
 * safeStorage wrapper for API key encryption
 */
import { safeStorage } from 'electron';
import { store } from './settings';

const API_KEY_PREFIX = 'apiKeys';

export function saveApiKey(provider: string, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system');
  }

  const encrypted = safeStorage.encryptString(key);
  const storageKey = `${API_KEY_PREFIX}.${provider}`;
  const base64 = encrypted.toString('base64');

  store.set(storageKey, base64);
}

export function getApiKey(provider: string): string | null {
  const key = `${API_KEY_PREFIX}.${provider}`;
  const base64 = store.get(key) as string | undefined;

  if (!base64) {
    return null;
  }

  try {
    const encrypted = Buffer.from(base64, 'base64');
    return safeStorage.decryptString(encrypted);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}

export function deleteApiKey(provider: string): void {
  store.delete(`${API_KEY_PREFIX}.${provider}`);
}

export function hasApiKey(provider: string): boolean {
  return store.has(`${API_KEY_PREFIX}.${provider}`);
}

export function getApiKeyPreview(provider: string): string | null {
  const apiKey = getApiKey(provider);
  if (!apiKey) return null;

  const trimmed = apiKey.trim();
  if (trimmed.length <= 7) return '******';

  return `${trimmed.slice(0, 6)}******${trimmed.slice(-1)}`;
}

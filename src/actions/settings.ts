/**
 * Settings IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { AppSettings } from '@/shared/types/settings';

export async function getSettings(): Promise<AppSettings> {
  return ipc.client.settings.getSettings();
}

export async function updateSettings(
  settings: AppSettings,
): Promise<AppSettings> {
  return ipc.client.settings.updateSettings(settings);
}

export async function saveApiKey(
  provider: string,
  key: string,
): Promise<{ success: boolean }> {
  return ipc.client.settings.saveApiKey({ provider, key });
}

export async function hasApiKey(
  provider: string,
): Promise<{ hasKey: boolean; preview: string | null }> {
  return ipc.client.settings.hasApiKey({ provider });
}

export async function deleteApiKey(
  provider: string,
): Promise<{ success: boolean }> {
  return ipc.client.settings.deleteApiKey({ provider });
}

export async function isEncryptionAvailable(): Promise<boolean> {
  const result = await ipc.client.settings.isEncryptionAvailable();
  return result.available;
}

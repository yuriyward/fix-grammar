/**
 * Settings IPC handlers
 */
import { os } from '@orpc/server';
import {
  deleteApiKey,
  getApiKeyPreview,
  hasApiKey,
  isEncryptionAvailable,
  saveApiKey,
} from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import { appSettingsSchema } from '@/shared/schemas/settings';
import {
  deleteApiKeyInputSchema,
  hasApiKeyInputSchema,
  isEncryptionAvailableInputSchema,
  saveApiKeyInputSchema,
  testLMStudioConnectionInputSchema,
} from './schemas';

const LM_STUDIO_CONNECTION_TIMEOUT_MS = 5000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export const getSettings = os.handler(() => {
  return store.store;
});

export const updateSettings = os
  .input(appSettingsSchema)
  .handler(({ input }) => {
    store.set(input);
    return store.store;
  });

export const saveApiKeyHandler = os
  .input(saveApiKeyInputSchema)
  .handler(({ input }) => {
    saveApiKey(input.provider, input.key);
    return { success: true };
  });

export const hasApiKeyHandler = os
  .input(hasApiKeyInputSchema)
  .handler(({ input }) => {
    const hasKey = hasApiKey(input.provider);
    return {
      hasKey,
      preview: hasKey ? getApiKeyPreview(input.provider) : null,
    };
  });

export const deleteApiKeyHandler = os
  .input(deleteApiKeyInputSchema)
  .handler(({ input }) => {
    deleteApiKey(input.provider);
    return { success: true };
  });

export const isEncryptionAvailableHandler = os
  .input(isEncryptionAvailableInputSchema)
  .handler(() => {
    return { available: isEncryptionAvailable() };
  });

export const testLMStudioConnection = os
  .input(testLMStudioConnectionInputSchema)
  .handler(async ({ input }) => {
    try {
      const response = await fetch(`${input.baseURL}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(LM_STUDIO_CONNECTION_TIMEOUT_MS),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Server responded with status ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        data?: Array<{ id: string }>;
      };
      const modelCount = data.data?.length || 0;

      return {
        success: true,
        message: `Connected successfully. Found ${modelCount} model(s).`,
        models: data.data?.map((m) => m.id) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  });

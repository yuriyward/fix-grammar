/**
 * Settings IPC handlers
 */
import { os } from '@orpc/server';
import {
  deleteApiKey,
  getApiKeyPreview,
  hasApiKey,
  saveApiKey,
} from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import {
  appSettingsSchema,
  deleteApiKeyInputSchema,
  hasApiKeyInputSchema,
  saveApiKeyInputSchema,
} from './schemas';

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

/**
 * Settings IPC handlers
 */
import { os } from '@orpc/server';
import {
  deleteApiKey,
  getApiKey,
  hasApiKey,
  saveApiKey,
} from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import {
  appSettingsSchema,
  deleteApiKeyInputSchema,
  getApiKeyInputSchema,
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

export const getApiKeyHandler = os
  .input(getApiKeyInputSchema)
  .handler(({ input }) => {
    const key = getApiKey(input.provider);
    return { key };
  });

export const hasApiKeyHandler = os
  .input(hasApiKeyInputSchema)
  .handler(({ input }) => {
    return { hasKey: hasApiKey(input.provider) };
  });

export const deleteApiKeyHandler = os
  .input(deleteApiKeyInputSchema)
  .handler(({ input }) => {
    deleteApiKey(input.provider);
    return { success: true };
  });

/**
 * Settings domain router
 */
import {
  deleteApiKeyHandler,
  deleteLangfuseKeysHandler,
  fetchOpenRouterModels,
  getSettings,
  hasApiKeyHandler,
  hasLangfuseKeysHandler,
  isEncryptionAvailableHandler,
  saveApiKeyHandler,
  saveLangfuseKeysHandler,
  testLMStudioConnection,
  updateSettings,
} from './handlers';

export const settings = {
  getSettings,
  updateSettings,
  saveApiKey: saveApiKeyHandler,
  hasApiKey: hasApiKeyHandler,
  isEncryptionAvailable: isEncryptionAvailableHandler,
  deleteApiKey: deleteApiKeyHandler,
  testLMStudioConnection,
  fetchOpenRouterModels,
  saveLangfuseKeys: saveLangfuseKeysHandler,
  hasLangfuseKeys: hasLangfuseKeysHandler,
  deleteLangfuseKeys: deleteLangfuseKeysHandler,
};

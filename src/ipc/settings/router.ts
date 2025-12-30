/**
 * Settings domain router
 */
import {
  deleteApiKeyHandler,
  fetchOpenRouterModels,
  getSettings,
  hasApiKeyHandler,
  isEncryptionAvailableHandler,
  saveApiKeyHandler,
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
};

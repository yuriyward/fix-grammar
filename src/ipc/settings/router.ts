/**
 * Settings domain router
 */
import {
  deleteApiKeyHandler,
  getSettings,
  hasApiKeyHandler,
  isEncryptionAvailableHandler,
  saveApiKeyHandler,
  updateSettings,
} from './handlers';

export const settings = {
  getSettings,
  updateSettings,
  saveApiKey: saveApiKeyHandler,
  hasApiKey: hasApiKeyHandler,
  isEncryptionAvailable: isEncryptionAvailableHandler,
  deleteApiKey: deleteApiKeyHandler,
};

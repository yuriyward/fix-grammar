/**
 * Settings domain router
 */
import {
  deleteApiKeyHandler,
  getApiKeyHandler,
  getSettings,
  hasApiKeyHandler,
  saveApiKeyHandler,
  updateSettings,
} from './handlers';

export const settings = {
  getSettings,
  updateSettings,
  saveApiKey: saveApiKeyHandler,
  getApiKey: getApiKeyHandler,
  hasApiKey: hasApiKeyHandler,
  deleteApiKey: deleteApiKeyHandler,
};

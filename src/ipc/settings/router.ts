/**
 * Settings domain router
 */
import {
  deleteApiKeyHandler,
  getSettings,
  hasApiKeyHandler,
  saveApiKeyHandler,
  updateSettings,
} from './handlers';

export const settings = {
  getSettings,
  updateSettings,
  saveApiKey: saveApiKeyHandler,
  hasApiKey: hasApiKeyHandler,
  deleteApiKey: deleteApiKeyHandler,
};

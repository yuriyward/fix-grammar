/**
 * electron-store instance for persistent settings
 */
import ElectronStore from 'electron-store';
import { getDefaultModel, isValidModel } from '@/shared/config/ai-models';
import type { AppSettings } from '@/shared/types/settings';

export const store = new ElectronStore<AppSettings>({
  defaults: {
    hotkeys: {
      fixSelection: 'CommandOrControl+Shift+F',
      fixField: 'CommandOrControl+Shift+G',
      togglePopup: 'CommandOrControl+Shift+P',
      openSettings: 'CommandOrControl+,',
    },
    ai: {
      provider: 'google',
      model: getDefaultModel('google'),
      role: 'grammar',
    },
  },
});

// Migration: Fix invalid model IDs from old versions
const currentProvider = store.get('ai.provider');
const currentModel = store.get('ai.model');

if (!isValidModel(currentProvider, currentModel)) {
  store.set('ai.model', getDefaultModel(currentProvider));
}

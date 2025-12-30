/**
 * electron-store instance for persistent settings
 */
import ElectronStore from 'electron-store';
import { getDefaultModel } from '@/shared/config/ai-models';
import type { AppSettings } from '@/shared/types/settings';

export const store = new ElectronStore<AppSettings>({
  defaults: {
    hotkeys: {
      fixSelection: 'CommandOrControl+Shift+F',
      togglePopup: 'CommandOrControl+Shift+P',
    },
    ai: {
      provider: 'google',
      model: getDefaultModel('google'),
      role: 'grammar',
      reasoningEffort: 'medium',
      textVerbosity: 'medium',
      lmstudioBaseURL: 'http://localhost:1234/v1',
    },
    automation: {
      clipboardSyncDelayMs: 200,
      selectionDelayMs: 100,
    },
  },
});

/**
 * electron-store instance for persistent settings
 */
import ElectronStore from 'electron-store';
import { getDefaultModel } from '@/shared/config/ai-models';
import { DEFAULT_HOTKEYS } from '@/shared/config/hotkeys';
import type { AppSettings } from '@/shared/types/settings';

export const store = new ElectronStore<AppSettings>({
  defaults: {
    hotkeys: DEFAULT_HOTKEYS,
    ai: {
      provider: 'google',
      model: getDefaultModel('google'),
      defaultSkillId: 'grammar',
      reasoningEffort: 'medium',
      textVerbosity: 'medium',
      lmstudioBaseURL: 'http://localhost:1234/v1',
      includeOriginalPromptInChat: true,
    },
    automation: {
      clipboardSyncDelayMs: 200,
      selectionDelayMs: 100,
    },
    langfuse: {
      enabled: false,
    },
  },
});

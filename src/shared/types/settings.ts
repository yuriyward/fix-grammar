/**
 * Settings schema types
 */
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';

export interface HotkeysSettings {
  fixSelection: string;
  togglePopup: string;
}

export interface AISettings {
  provider: AIProvider;
  model: AIModel;
  role: RewriteRole;
}

export interface AutomationSettings {
  clipboardSyncDelayMs: number;
  selectionDelayMs: number;
}

export interface AppSettings {
  hotkeys: HotkeysSettings;
  ai: AISettings;
  automation: AutomationSettings;
}

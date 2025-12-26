/**
 * Settings schema types
 */
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';

export type { AIProvider, AIModel };
export type { RewriteRole };

export interface HotkeysSettings {
  fixSelection: string;
  fixField: string;
  togglePopup: string;
  openSettings: string;
}

export interface AISettings {
  provider: AIProvider;
  model: AIModel;
  role: RewriteRole;
}

export interface AppSettings {
  hotkeys: HotkeysSettings;
  ai: AISettings;
}

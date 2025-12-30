/**
 * Settings schema types
 */
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';

export interface HotkeysSettings {
  fixSelection: string;
  togglePopup: string;
}

export type ReasoningEffort =
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh';
export type TextVerbosity = 'low' | 'medium' | 'high';

export interface AISettings {
  provider: AIProvider;
  model: AIModel | string;
  role: RewriteRole;
  reasoningEffort?: ReasoningEffort;
  textVerbosity?: TextVerbosity;
  lmstudioBaseURL?: string;
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

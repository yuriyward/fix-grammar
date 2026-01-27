/**
 * Settings schema types
 */
import type { AIModel, AIProvider } from '@/shared/config/ai-models';

export interface HotkeysSettings {
  fixSelection: string;
  togglePopup: string;
  showMainWindow: string;
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
  defaultSkillId: string;
  reasoningEffort?: ReasoningEffort;
  textVerbosity?: TextVerbosity;
  lmstudioBaseURL?: string;
  openrouterExtraParams?: string;
  includeOriginalPromptInChat?: boolean;
}

export interface AutomationSettings {
  clipboardSyncDelayMs: number;
  selectionDelayMs: number;
}

export interface OpenRouterModelsCache {
  models: Array<{ id: string; name: string }>;
  timestamp: number;
}

export interface LangfuseSettings {
  enabled: boolean;
}

export interface AppSettings {
  hotkeys: HotkeysSettings;
  ai: AISettings;
  automation: AutomationSettings;
  langfuse: LangfuseSettings;
  openrouterModelsCache?: OpenRouterModelsCache;
  hasLaunchedBefore?: boolean;
}

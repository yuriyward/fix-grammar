/**
 * Centralized AI model configuration
 * This is the single source of truth for all available models
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'xai';
}

export interface ProviderConfig {
  name: string;
  models: ModelConfig[];
  defaultModel: string;
}

export const AI_PROVIDERS = {
  google: {
    name: 'Google Gemini',
    models: [
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        provider: 'google' as const,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google' as const,
      },
      {
        id: 'models/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google' as const,
      },
      {
        id: 'models/gemini-flash-latest',
        name: 'Gemini Flash (Latest)',
        provider: 'google' as const,
      },
      {
        id: 'models/gemini-flash-lite-latest',
        name: 'Gemini Flash Lite (Latest)',
        provider: 'google' as const,
      },
    ],
    defaultModel: 'gemini-3-flash-preview',
  },
  xai: {
    name: 'xAI Grok',
    models: [
      {
        id: 'grok-4-1-fast-reasoning',
        name: 'Grok 4.1 Fast (Reasoning)',
        provider: 'xai' as const,
      },
      {
        id: 'grok-4-1-fast-non-reasoning',
        name: 'Grok 4.1 Fast (Non-Reasoning)',
        provider: 'xai' as const,
      },
      {
        id: 'grok-code-fast-1',
        name: 'Grok Code Fast',
        provider: 'xai' as const,
      },
      {
        id: 'grok-4',
        name: 'Grok 4',
        provider: 'xai' as const,
      },
    ],
    defaultModel: 'grok-4-1-fast-reasoning',
  },
} as const satisfies Record<string, ProviderConfig>;

export type AIProvider = keyof typeof AI_PROVIDERS;
export type AIModel = (typeof AI_PROVIDERS)[AIProvider]['models'][number]['id'];

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: AIProvider): AIModel {
  return AI_PROVIDERS[provider].defaultModel;
}

/**
 * Get all models for a specific provider
 */
export function getModelsForProvider(provider: AIProvider): ModelConfig[] {
  return AI_PROVIDERS[provider].models;
}

/**
 * Get provider name
 */
export function getProviderName(provider: AIProvider): string {
  return AI_PROVIDERS[provider].name;
}

/**
 * Validate if a model ID is valid for a provider
 */
export function isValidModel(provider: AIProvider, modelId: string): boolean {
  return AI_PROVIDERS[provider].models.some((m) => m.id === modelId);
}

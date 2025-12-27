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
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google' as const,
      },
      {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash Thinking (Experimental)',
        provider: 'google' as const,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google' as const,
      },
    ],
    defaultModel: 'gemini-2.5-flash',
  },
  xai: {
    name: 'xAI Grok',
    models: [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        provider: 'xai' as const,
      },
      {
        id: 'grok-vision-beta',
        name: 'Grok Vision Beta',
        provider: 'xai' as const,
      },
    ],
    defaultModel: 'grok-beta',
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

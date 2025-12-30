/**
 * Centralized AI model configuration
 * This is the single source of truth for all available models
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'xai' | 'openai' | 'lmstudio' | 'openrouter';
}

export interface ProviderConfig {
  name: string;
  models: ModelConfig[];
  defaultModel: string;
}

// Model ID formats: @ai-sdk/google accepts both 'model-name' and 'models/model-name'.
// The SDK normalizes these internally to the Google API's expected 'models/' format.
// While the prefix is technically optional in @ai-sdk/google, both formats work correctly.
// See: https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
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
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google' as const,
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash (Latest)',
        provider: 'google' as const,
      },
      {
        id: 'gemini-flash-lite-latest',
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
  openai: {
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-5.1',
        name: 'GPT-5.1',
        provider: 'openai' as const,
      },
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'openai' as const,
      },
      {
        id: 'o4-mini',
        name: 'O4 Mini',
        provider: 'openai' as const,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai' as const,
      },
    ],
    defaultModel: 'gpt-5.1',
  },
  lmstudio: {
    name: 'LM Studio',
    models: [
      {
        id: 'google/gemma-3n-e4b',
        name: 'Google Gemma 3n E4B',
        provider: 'lmstudio' as const,
      },
      {
        id: 'openai/gpt-oss-20b',
        name: 'OpenAI GPT OSS 20B',
        provider: 'lmstudio' as const,
      },
      {
        id: 'gemma-3-12b-instruct',
        name: 'Gemma 3 12B Instruct',
        provider: 'lmstudio' as const,
      },
      {
        id: 'qwen3-30b-instruct',
        name: 'Qwen 3 30B Instruct',
        provider: 'lmstudio' as const,
      },
      {
        id: 'ministral-3-8b',
        name: 'Ministral 3 8B',
        provider: 'lmstudio' as const,
      },
      {
        id: 'gemma-3-4b-instruct',
        name: 'Gemma 3 4B Instruct',
        provider: 'lmstudio' as const,
      },
      {
        id: 'qwen3-8b-instruct',
        name: 'Qwen 3 8B Instruct',
        provider: 'lmstudio' as const,
      },
    ],
    defaultModel: 'google/gemma-3n-e4b',
  },
  openrouter: {
    name: 'OpenRouter',
    // Popular models - can be supplemented by fetching from API
    models: [
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'openrouter' as const,
      },
      {
        id: 'x-ai/grok-code-fast-1',
        name: 'Grok Code Fast 1',
        provider: 'openrouter' as const,
      },
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'openrouter' as const,
      },
    ],
    defaultModel: 'openai/gpt-4o',
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
 * Get user-friendly model label for display in notifications and UI
 */
export function getModelLabel(provider: AIProvider, model: AIModel): string {
  const config = AI_PROVIDERS[provider].models.find(
    (entry) => entry.id === model,
  );
  return config?.name ?? model;
}

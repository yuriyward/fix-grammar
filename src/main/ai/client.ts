/**
 * Multi-provider AI client (Google Gemini, xAI Grok, OpenAI, LM Studio, OpenRouter)
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import { type LanguageModel, type StreamTextResult, streamText } from 'ai';
import { getApiKey } from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import { AI_STREAM_TIMEOUT_MS } from '@/shared/config/ai';
import type { AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import type { ReasoningEffort, TextVerbosity } from '@/shared/types/settings';
import { sanitizeLMStudioURL } from '@/shared/utils/url-validation';
import { buildPrompt } from './prompts';

/**
 * Streams a rewritten version of the given text using the configured AI provider and model.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @param apiKey - Provider API key used to authenticate the request.
 * @param model - Provider model id (e.g. `gemini-2.5-flash`, `grok-4-1-fast-reasoning`, `gpt-5.1`).
 * @param provider - The AI provider to use ('google', 'xai', 'openai', 'lmstudio', or 'openrouter').
 * @param reasoningEffort - Optional reasoning effort for OpenAI models.
 * @param textVerbosity - Optional text verbosity for OpenAI models.
 * @param lmstudioBaseURL - Optional base URL for LM Studio server.
 * @param openrouterExtraParams - Optional JSON string with OpenRouter-specific parameters.
 * @returns An AI SDK streaming result; await `result.text` for the full rewrite.
 */
export async function rewriteText(
  text: string,
  role: RewriteRole,
  apiKey: string,
  model: string,
  provider: AIProvider,
  reasoningEffort?: ReasoningEffort,
  textVerbosity?: TextVerbosity,
  lmstudioBaseURL?: string,
  openrouterExtraParams?: string,
): Promise<StreamTextResult<Record<string, never>, never>> {
  const prompt = buildPrompt(text, role);

  // Provider factory map following Open/Closed Principle
  const providerFactories: Record<
    AIProvider,
    (apiKey: string, model: string, baseURL?: string) => LanguageModel
  > = {
    google: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
    xai: (apiKey, model) => createXai({ apiKey })(model),
    // openai() defaults to Responses API in AI SDK 5+
    openai: (apiKey, model) => createOpenAI({ apiKey })(model),
    lmstudio: (apiKey, model, baseURL) => {
      const sanitizedURL = baseURL
        ? sanitizeLMStudioURL(baseURL)
        : 'http://localhost:1234/v1';

      return createOpenAICompatible({
        name: 'lmstudio',
        baseURL: sanitizedURL,
        apiKey: apiKey || 'not-needed',
      })(model);
    },
    openrouter: (apiKey, model) =>
      createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
        headers: {
          'HTTP-Referer': 'https://github.com/ward/automations/fix-grammar',
          'X-Title': 'Fix Grammar App',
        },
      })(model),
  };

  const modelInstance = providerFactories[provider](
    apiKey,
    model,
    lmstudioBaseURL,
  );

  // Build provider-specific options for OpenAI
  const openaiOptions = {
    ...(reasoningEffort && { reasoningEffort }),
    ...(textVerbosity && { textVerbosity }),
  };

  // Build provider-specific options for OpenRouter
  const openrouterOptions = openrouterExtraParams?.trim()
    ? (() => {
        try {
          return JSON.parse(openrouterExtraParams);
        } catch {
          return {};
        }
      })()
    : {};

  // Determine which provider options to use
  // Note: This conditional logic is intentionally kept simple for now (2 providers).
  // Consider extracting to a helper function if 3+ providers need special options.
  const providerOptions =
    provider === 'openai' && Object.keys(openaiOptions).length > 0
      ? { openai: openaiOptions }
      : provider === 'openrouter' && Object.keys(openrouterOptions).length > 0
        ? { openai: openrouterOptions }
        : undefined;

  return streamText({
    model: modelInstance,
    prompt,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(AI_STREAM_TIMEOUT_MS),
    ...(providerOptions && { providerOptions }),
  });
}

/**
 * Unified wrapper that reads settings from the store and calls rewriteText.
 * This ensures consistency across IPC handlers and keyboard shortcuts.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @returns An AI SDK streaming result; await `result.text` for the full rewrite.
 * @throws Error if API key is not found for the configured provider (except LM Studio).
 */
export async function rewriteTextWithSettings(
  text: string,
  role: RewriteRole,
): Promise<StreamTextResult<Record<string, never>, never>> {
  // Get all settings from the store
  const provider = store.get('ai.provider') as AIProvider;
  const model = store.get('ai.model') as string;
  const reasoningEffort = store.get('ai.reasoningEffort') as
    | ReasoningEffort
    | undefined;
  const textVerbosity = store.get('ai.textVerbosity') as
    | TextVerbosity
    | undefined;
  const lmstudioBaseURL = store.get('ai.lmstudioBaseURL') as string | undefined;
  const openrouterExtraParams = store.get('ai.openrouterExtraParams') as
    | string
    | undefined;

  // Get API key for the current provider
  // LM Studio doesn't require API key, but other providers do
  const apiKey = getApiKey(provider) || '';
  if (!apiKey && provider !== 'lmstudio') {
    throw new Error(`API key not found for provider: ${provider}`);
  }

  // Call rewriteText with all parameters
  return rewriteText(
    text,
    role,
    apiKey,
    model,
    provider,
    reasoningEffort,
    textVerbosity,
    lmstudioBaseURL,
    openrouterExtraParams,
  );
}

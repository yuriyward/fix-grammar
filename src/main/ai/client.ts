/**
 * Multi-provider AI client (Google Gemini, xAI Grok, OpenAI)
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import { type LanguageModel, streamText } from 'ai';
import { getApiKey } from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import type { AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import type { ReasoningEffort, TextVerbosity } from '@/shared/types/settings';
import { buildPrompt } from './prompts';

/**
 * Streams a rewritten version of the given text using the configured AI provider and model.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @param apiKey - Provider API key used to authenticate the request.
 * @param model - Provider model id (e.g. `gemini-2.5-flash`, `grok-4-1-fast-reasoning`, `gpt-5.1`).
 * @param provider - The AI provider to use ('google', 'xai', or 'openai').
 * @param reasoningEffort - Optional reasoning effort for OpenAI models.
 * @param textVerbosity - Optional text verbosity for OpenAI models.
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
) {
  const prompt = buildPrompt(text, role);

  // Create the appropriate provider instance based on the selected provider
  let modelInstance: LanguageModel;
  if (provider === 'openai') {
    const openaiProvider = createOpenAI({ apiKey });
    // Explicitly use Responses API for OpenAI to ensure reasoningEffort and textVerbosity work
    modelInstance = openaiProvider.responses(model);
  } else if (provider === 'xai') {
    const xaiProvider = createXai({ apiKey });
    modelInstance = xaiProvider(model);
  } else {
    const googleProvider = createGoogleGenerativeAI({ apiKey });
    modelInstance = googleProvider(model);
  }

  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  // Build provider-specific options for OpenAI
  const openaiOptions: Record<string, unknown> = {};
  if (reasoningEffort) {
    openaiOptions.reasoningEffort = reasoningEffort;
  }
  if (textVerbosity) {
    openaiOptions.textVerbosity = textVerbosity;
  }

  return streamText({
    model: modelInstance,
    prompt,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    ...(provider === 'openai' &&
      Object.keys(openaiOptions).length > 0 && {
        providerOptions: { openai: openaiOptions },
      }),
  });
}

/**
 * Unified wrapper that reads settings from the store and calls rewriteText.
 * This ensures consistency across IPC handlers and keyboard shortcuts.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @returns An AI SDK streaming result; await `result.text` for the full rewrite.
 * @throws Error if API key is not found for the configured provider.
 */
export async function rewriteTextWithSettings(text: string, role: RewriteRole) {
  // Get all settings from the store
  const provider = store.get('ai.provider');
  const model = store.get('ai.model');
  const reasoningEffort = store.get('ai.reasoningEffort');
  const textVerbosity = store.get('ai.textVerbosity');

  // Get API key for the current provider
  const apiKey = getApiKey(provider);
  if (!apiKey) {
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
  );
}

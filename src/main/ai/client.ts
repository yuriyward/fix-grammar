/**
 * Multi-provider AI client (Google Gemini, xAI Grok)
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';
import { streamText } from 'ai';
import type { AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import { buildPrompt } from './prompts';

/**
 * Streams a rewritten version of the given text using the configured AI provider and model.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @param apiKey - Provider API key used to authenticate the request.
 * @param model - Provider model id (e.g. `gemini-2.5-flash`, `grok-4-1-fast-reasoning`).
 * @param provider - The AI provider to use ('google' or 'xai').
 * @returns An AI SDK streaming result; await `result.text` for the full rewrite.
 */
export async function rewriteText(
  text: string,
  role: RewriteRole,
  apiKey: string,
  model: string,
  provider: AIProvider,
) {
  const prompt = buildPrompt(text, role);

  // Create the appropriate provider instance based on the selected provider
  const providerInstance =
    provider === 'xai'
      ? createXai({ apiKey })
      : createGoogleGenerativeAI({ apiKey });

  const modelInstance = providerInstance(model);

  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  return streamText({
    model: modelInstance,
    prompt,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

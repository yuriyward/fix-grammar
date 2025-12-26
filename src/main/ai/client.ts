/**
 * Google Gemini AI client
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { RewriteRole } from '@/shared/types/ai';
import { buildPrompt } from './prompts';

/**
 * Streams a rewritten version of the given text using the configured AI model.
 *
 * @param text - The source text to rewrite.
 * @param role - The rewrite mode/preset (used to build the prompt).
 * @param apiKey - Provider API key used to authenticate the request.
 * @param model - Provider model id (e.g. `gemini-...`).
 * @returns An AI SDK streaming result; await `result.text` for the full rewrite.
 */
export async function rewriteText(
  text: string,
  role: RewriteRole,
  apiKey: string,
  model: string,
) {
  const prompt = buildPrompt(text, role);

  // Create the Google provider with the API key
  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  });

  const modelInstance = google(model);

  return streamText({
    model: modelInstance,
    prompt,
  });
}

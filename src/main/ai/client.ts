/**
 * Google Gemini AI client
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import type { RewriteRole } from '@/shared/types/ai';
import { buildPrompt } from './prompts';

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

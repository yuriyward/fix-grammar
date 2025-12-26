/**
 * AI IPC handlers
 */
import { os } from '@orpc/server';
import { rewriteText } from '@/main/ai/client';
import { getApiKey } from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import { rewriteInputSchema } from './schemas';

export const rewriteTextHandler = os
  .input(rewriteInputSchema)
  .handler(async ({ input }) => {
    // Get API key for current provider
    const provider = store.get('ai.provider');
    const apiKey = getApiKey(provider);

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider}`);
    }

    // Get model from settings
    const model = store.get('ai.model');

    // Rewrite text (collecting all chunks)
    const result = await rewriteText(input.text, input.role, apiKey, model);

    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    return { content: fullText };
  });

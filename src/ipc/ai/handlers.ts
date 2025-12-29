/**
 * AI IPC handlers
 */
import { os } from '@orpc/server';
import { rewriteTextWithSettings } from '@/main/ai/client';
import { rewriteInputSchema } from './schemas';

export const rewriteTextHandler = os
  .input(rewriteInputSchema)
  .handler(async ({ input }) => {
    // Rewrite text using unified function (collecting all chunks)
    const result = await rewriteTextWithSettings(input.text, input.role);

    let fullText = '';
    try {
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }
    } catch (error) {
      console.error('AI rewrite stream failed:', error);
      if (fullText.length === 0) {
        return { content: input.text };
      }
    }

    return { content: fullText };
  });

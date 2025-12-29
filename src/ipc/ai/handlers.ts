/**
 * AI IPC handlers
 */

import { os } from '@orpc/server';
import { rewriteTextWithSettings } from '@/main/ai/client';
import { parseAIError } from '@/main/ai/error-handler';
import { showNotification } from '@/main/utils/notifications';
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

      const errorDetails = parseAIError(error);
      showNotification({
        type: 'error',
        title: errorDetails.title,
        description: errorDetails.message,
      });

      if (fullText.length === 0) {
        throw new Error(`AI rewrite failed: ${errorDetails.message}`);
      }
    }

    return { content: fullText };
  });

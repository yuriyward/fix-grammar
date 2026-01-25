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
    let streamError: Error | null = null;

    try {
      for await (const chunk of result.textStream) {
        fullText += chunk;
      }
    } catch (error) {
      streamError = error instanceof Error ? error : new Error(String(error));
    }

    // If stream failed at any point, treat as complete failure
    if (streamError) {
      console.error('AI rewrite stream failed:', streamError);

      const errorDetails = parseAIError(streamError);
      showNotification({
        type: 'error',
        title: errorDetails.title,
        description: errorDetails.message,
      });

      // Include partial content length in error for debugging
      const partialInfo =
        fullText.length > 0
          ? ` (${fullText.length} chars received before failure)`
          : '';

      throw new Error(
        `AI rewrite failed: ${errorDetails.message}${partialInfo}`,
      );
    }

    return { content: fullText };
  });

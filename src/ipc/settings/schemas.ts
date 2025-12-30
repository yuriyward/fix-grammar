/**
 * Zod schemas for settings IPC
 */
import { z } from 'zod';
import { aiProviderSchema } from '@/shared/schemas/settings';
import { sanitizeLMStudioURL } from '@/shared/utils/url-validation';

// ============================================================================
// IPC-only schemas
// ============================================================================

export const saveApiKeyInputSchema = z.object({
  provider: aiProviderSchema,
  key: z.string().min(1).trim(),
});

export const hasApiKeyInputSchema = z.object({
  provider: aiProviderSchema,
});

export const deleteApiKeyInputSchema = z.object({
  provider: aiProviderSchema,
});

export const isEncryptionAvailableInputSchema = z.void();

export const testLMStudioConnectionInputSchema = z.object({
  baseURL: z
    .string()
    .trim()
    .transform((val, ctx) => {
      try {
        return sanitizeLMStudioURL(val);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Invalid URL',
        });
        return z.NEVER;
      }
    }),
});

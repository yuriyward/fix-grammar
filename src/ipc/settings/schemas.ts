/**
 * Zod schemas for settings IPC
 */
import { z } from 'zod';
import { aiProviderSchema } from '@/shared/schemas/settings';

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
  baseURL: z.string().url(),
});

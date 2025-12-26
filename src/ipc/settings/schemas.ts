/**
 * Zod schemas for settings IPC
 */
import { z } from 'zod';
import { rewriteRoleSchema } from '@/ipc/ai/schemas';
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import { AI_PROVIDERS, isValidModel } from '@/shared/config/ai-models';

const allowedProviderIds = new Set<string>(Object.keys(AI_PROVIDERS));

export const aiProviderSchema: z.ZodType<AIProvider> = z
  .string()
  .refine((value): value is AIProvider => allowedProviderIds.has(value), {
    message: 'Invalid AI provider',
  });

const allowedModelIds = new Set<string>(
  Object.values(AI_PROVIDERS).flatMap((provider) =>
    provider.models.map((model) => model.id),
  ),
);

export const aiModelSchema: z.ZodType<AIModel> = z
  .string()
  .refine((value): value is AIModel => allowedModelIds.has(value), {
    message: 'Invalid AI model',
  });

export const hotkeysSettingsSchema = z.object({
  fixSelection: z.string(),
  fixField: z.string(),
  togglePopup: z.string(),
  openSettings: z.string(),
});

export const aiSettingsSchema = z.object({
  provider: aiProviderSchema,
  model: aiModelSchema,
  role: rewriteRoleSchema,
});

const aiSettingsSchemaWithValidation = aiSettingsSchema.superRefine(
  ({ provider, model }, ctx) => {
    if (isValidModel(provider, model)) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['model'],
      message: `Model "${model}" is not valid for provider "${provider}"`,
    });
  },
);

export const appSettingsSchema = z.object({
  hotkeys: hotkeysSettingsSchema,
  ai: aiSettingsSchemaWithValidation,
});

export const saveApiKeyInputSchema = z.object({
  provider: z.string(),
  key: z.string(),
});

export const getApiKeyInputSchema = z.object({
  provider: z.string(),
});

export const hasApiKeyInputSchema = z.object({
  provider: z.string(),
});

export const deleteApiKeyInputSchema = z.object({
  provider: z.string(),
});

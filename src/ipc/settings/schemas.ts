/**
 * Zod schemas for settings IPC
 */
import { z } from 'zod';
import { rewriteRoleSchema } from '@/ipc/ai/schemas';
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import { AI_PROVIDERS, isValidModel } from '@/shared/config/ai-models';

const allowedProviderIds = new Set<string>(Object.keys(AI_PROVIDERS));

const hotkeyModifiers = new Set<string>([
  'commandorcontrol',
  'cmdorctrl',
  'command',
  'cmd',
  'control',
  'ctrl',
  'alt',
  'option',
  'altgr',
  'shift',
  'super',
  'meta',
]);

const hotkeyNamedKeys = new Set<string>([
  'plus',
  'space',
  'tab',
  'backspace',
  'delete',
  'insert',
  'return',
  'enter',
  'up',
  'down',
  'left',
  'right',
  'home',
  'end',
  'pageup',
  'pagedown',
  'escape',
  'esc',
  'volumeup',
  'volumedown',
  'volumemute',
  'medianexttrack',
  'mediaprevioustrack',
  'mediastop',
  'mediaplaypause',
  'printscreen',
]);

export function isValidHotkeyAccelerator(value: string): boolean {
  const accelerator = value.trim();
  if (accelerator.length === 0) return false;
  if (/\s/u.test(accelerator)) return false;

  const parts = accelerator.split('+');
  if (parts.length < 2) return false;
  if (parts.some((part) => part.length === 0)) return false;

  for (const modifier of parts.slice(0, -1)) {
    if (!hotkeyModifiers.has(modifier.toLowerCase())) return false;
  }

  const key = parts.at(-1);
  if (!key) return false;

  if (key.length === 1) {
    if (key === '+') return false;
    const codePoint = key.codePointAt(0);
    if (!codePoint) return false;
    return codePoint >= 0x21 && codePoint <= 0x7e;
  }

  const normalizedKey = key.toLowerCase();
  if (hotkeyNamedKeys.has(normalizedKey)) return true;

  return /^f(?:[1-9]|1\d|2[0-4])$/iu.test(key);
}

const hotkeyAcceleratorSchema = z.string();

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
  fixSelection: hotkeyAcceleratorSchema,
  togglePopup: hotkeyAcceleratorSchema,
});

const reasoningEffortSchema = z.enum([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
]);
const textVerbositySchema = z.enum(['low', 'medium', 'high']);

export const aiSettingsSchema = z.object({
  provider: aiProviderSchema,
  model: aiModelSchema,
  role: rewriteRoleSchema,
  reasoningEffort: reasoningEffortSchema.optional(),
  textVerbosity: textVerbositySchema.optional(),
});

export const automationSettingsSchema = z.object({
  clipboardSyncDelayMs: z.number().int().min(0).max(5_000),
  selectionDelayMs: z.number().int().min(0).max(5_000),
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
  automation: automationSettingsSchema,
});

export const saveApiKeyInputSchema = z.object({
  provider: z.string().min(1).trim(),
  key: z.string().min(1).trim(),
});

export const hasApiKeyInputSchema = z.object({
  provider: z.string(),
});

export const deleteApiKeyInputSchema = z.object({
  provider: z.string(),
});

export const isEncryptionAvailableInputSchema = z.void();

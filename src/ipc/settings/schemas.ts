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

export const aiSettingsSchema = z
  .object({
    provider: aiProviderSchema,
    model: aiModelSchema,
    role: rewriteRoleSchema,
    reasoningEffort: reasoningEffortSchema.optional(),
    textVerbosity: textVerbositySchema.optional(),
  })
  .superRefine(({ provider, model, reasoningEffort }, ctx) => {
    if (!isValidModel(provider, model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['model'],
        message: `Model "${model}" is not valid for provider "${provider}"`,
      });
    }

    if (reasoningEffort === 'none' && !model.startsWith('gpt-5.1')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasoningEffort'],
        message:
          'Reasoning effort "none" is only supported by GPT-5.1 series models',
      });
    }

    if (reasoningEffort === 'xhigh' && model !== 'gpt-5.1-codex-max') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasoningEffort'],
        message:
          'Reasoning effort "xhigh" is only supported by gpt-5.1-codex-max',
      });
    }
  });

export const automationSettingsSchema = z.object({
  clipboardSyncDelayMs: z.number().int().min(0).max(5_000),
  selectionDelayMs: z.number().int().min(0).max(5_000),
});

export const appSettingsSchema = z.object({
  hotkeys: hotkeysSettingsSchema,
  ai: aiSettingsSchema,
  automation: automationSettingsSchema,
});

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

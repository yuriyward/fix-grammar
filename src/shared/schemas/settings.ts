/**
 * Shared settings validation schemas
 */
import { z } from 'zod';
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import {
  AI_PROVIDERS,
  getProviderName,
  isValidModel,
} from '@/shared/config/ai-models';
import { rewriteRoleSchema } from './ai';

// ============================================================================
// Hotkey validation utilities
// ============================================================================

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

function normalizeHotkeyAcceleratorForUniqueness(accelerator: string): string {
  const modifierAliases: Record<string, string> = {
    commandorcontrol: 'commandorcontrol',
    cmdorctrl: 'commandorcontrol',
    command: 'cmd',
    cmd: 'cmd',
    control: 'ctrl',
    ctrl: 'ctrl',
    alt: 'alt',
    option: 'alt',
    altgr: 'altgr',
    shift: 'shift',
    super: 'meta',
    meta: 'meta',
  };

  const trimmed = accelerator.trim();
  const parts = trimmed.split('+');
  const key = parts.at(-1) ?? '';
  const modifiers = parts
    .slice(0, -1)
    .map(
      (modifier) =>
        modifierAliases[modifier.toLowerCase()] ?? modifier.toLowerCase(),
    )
    .sort();

  const normalizedKey = (() => {
    const lower = key.toLowerCase();
    if (lower === 'escape') return 'esc';
    if (lower === 'return') return 'enter';
    return key.length === 1 ? lower : lower;
  })();

  return [...modifiers, normalizedKey].join('+');
}

// ============================================================================
// AI Provider & Model schemas
// ============================================================================

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

// ============================================================================
// Settings schemas
// ============================================================================

const hotkeyAcceleratorSchema = z.string();

export const hotkeysSettingsSchema = z
  .object({
    fixSelection: hotkeyAcceleratorSchema,
    togglePopup: hotkeyAcceleratorSchema,
  })
  .superRefine((data, ctx) => {
    // Format validation
    for (const [field, accelerator] of Object.entries(data)) {
      if (!isValidHotkeyAccelerator(accelerator)) {
        const fieldLabel =
          field === 'fixSelection' ? 'Fix Selection' : 'Toggle Popup';
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Invalid hotkey format for ${fieldLabel}. Use format: CommandOrControl+Shift+Key`,
        });
      }
    }

    // Uniqueness validation
    const normalized = new Map<string, string>();
    for (const [field, accelerator] of Object.entries(data)) {
      const normalizedKey =
        normalizeHotkeyAcceleratorForUniqueness(accelerator);
      const existing = normalized.get(normalizedKey);

      if (existing) {
        const existingLabel =
          existing === 'fixSelection' ? 'Fix Selection' : 'Toggle Popup';
        const currentLabel =
          field === 'fixSelection' ? 'Fix Selection' : 'Toggle Popup';
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Hotkeys must be unique. ${existingLabel} and ${currentLabel} both use "${accelerator}"`,
        });
      } else {
        normalized.set(normalizedKey, field);
      }
    }
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
    model: z.string(),
    role: rewriteRoleSchema,
    reasoningEffort: reasoningEffortSchema.optional(),
    textVerbosity: textVerbositySchema.optional(),
    lmstudioBaseURL: z.string().optional(),
  })
  .superRefine(({ provider, model, reasoningEffort, lmstudioBaseURL }, ctx) => {
    // Validate model for non-LM Studio providers
    if (provider !== 'lmstudio' && !isValidModel(provider, model)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['model'],
        message: `"${model}" is not available for ${getProviderName(provider)}. Please select a valid model.`,
      });
    }

    // LM Studio requires baseURL
    if (provider === 'lmstudio') {
      if (!lmstudioBaseURL || lmstudioBaseURL.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lmstudioBaseURL'],
          message: 'Base URL is required when using LM Studio',
        });
      } else {
        // Validate URL format
        try {
          new URL(lmstudioBaseURL);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lmstudioBaseURL'],
            message:
              'Please enter a valid URL (e.g., http://localhost:1234/v1)',
          });
        }
      }
    }

    if (provider === 'openai') {
      if (reasoningEffort === 'none' && !model.startsWith('gpt-5.1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reasoningEffort'],
          message: 'Reasoning effort "none" requires a GPT-5.1 model',
        });
      }

      if (reasoningEffort === 'xhigh' && model !== 'gpt-5.1-codex-max') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reasoningEffort'],
          message:
            'Reasoning effort "extra high" is only available for gpt-5.1-codex-max',
        });
      }
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

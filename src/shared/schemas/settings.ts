/**
 * Shared settings validation schemas
 */
import { z } from 'zod';
import type { AIModel, AIProvider } from '@/shared/config/ai-models';
import { AI_PROVIDERS } from '@/shared/config/ai-models';
import { HOTKEY_MODIFIERS, HOTKEY_NAMED_KEYS } from '@/shared/config/hotkeys';
import { rewriteRoleSchema } from './ai';

// ============================================================================
// Hotkey validation utilities
// ============================================================================

export function isValidHotkeyAccelerator(value: string): boolean {
  const accelerator = value.trim();
  if (accelerator.length === 0) return false;
  if (/\s/u.test(accelerator)) return false;

  const parts = accelerator.split('+');
  if (parts.length < 2) return false;
  if (parts.some((part) => part.length === 0)) return false;

  for (const modifier of parts.slice(0, -1)) {
    if (!HOTKEY_MODIFIERS.has(modifier.toLowerCase())) return false;
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
  if (HOTKEY_NAMED_KEYS.has(normalizedKey)) return true;

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

// Type for hotkey settings data
type HotkeySettingsData = {
  fixSelection: string;
  togglePopup: string;
};

const HOTKEY_FIELD_LABELS: Record<string, string> = {
  fixSelection: 'Fix Selection',
  togglePopup: 'Toggle Popup',
};

// Helper to get human-readable field label
function getHotkeyFieldLabel(field: string): string {
  return HOTKEY_FIELD_LABELS[field] ?? field;
}

// Validates format of all hotkey accelerators
function validateHotkeyFormats(
  data: HotkeySettingsData,
  ctx: z.RefinementCtx,
): void {
  for (const [field, accelerator] of Object.entries(data)) {
    if (!isValidHotkeyAccelerator(accelerator)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `Invalid hotkey format for ${getHotkeyFieldLabel(field)}. Use format: CommandOrControl+Shift+Key`,
      });
    }
  }
}

// Validates uniqueness of hotkey accelerators
function validateHotkeyUniqueness(
  data: HotkeySettingsData,
  ctx: z.RefinementCtx,
): void {
  const normalized = new Map<string, string>();

  for (const [field, accelerator] of Object.entries(data)) {
    const normalizedKey = normalizeHotkeyAcceleratorForUniqueness(accelerator);
    const existing = normalized.get(normalizedKey);

    if (existing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `Hotkeys must be unique. ${getHotkeyFieldLabel(existing)} and ${getHotkeyFieldLabel(field)} both use "${accelerator}"`,
      });
    } else {
      normalized.set(normalizedKey, field);
    }
  }
}

// ============================================================================
// AI Provider & Model schemas
// ============================================================================

const allowedProviderIds = new Set<string>(Object.keys(AI_PROVIDERS));

export const aiProviderSchema = z
  .string()
  .refine((value): value is AIProvider => allowedProviderIds.has(value), {
    message: 'Invalid AI provider',
  });

const allowedModelIds = new Set<string>(
  Object.values(AI_PROVIDERS).flatMap((provider) =>
    provider.models.map((model) => model.id),
  ),
);

export const aiModelSchema = z
  .string()
  .refine((value): value is AIModel => allowedModelIds.has(value), {
    message: 'Invalid AI model',
  });

// ============================================================================
// AI validation utilities
// ============================================================================

// Type for AI settings data used in validation
export type AISettingsData = {
  provider: AIProvider;
  model: string;
  reasoningEffort?: string | undefined;
  lmstudioBaseURL?: string | undefined;
  openrouterExtraParams?: string | undefined;
};

// Provider-specific validator function type
export type ProviderValidator = (
  data: AISettingsData,
  ctx: z.RefinementCtx,
) => void;

// ============================================================================
// Provider-specific validation registry
// ============================================================================

/**
 * Registry for provider-specific validation functions.
 * Each provider can register its own validation logic without
 * modifying the base schema.
 */
const providerValidators: Map<AIProvider, ProviderValidator[]> = new Map();

/**
 * Register a validation function for a specific provider.
 * Multiple validators can be registered per provider.
 */
export function registerProviderValidator(
  provider: AIProvider,
  validator: ProviderValidator,
): void {
  const existing = providerValidators.get(provider) ?? [];
  providerValidators.set(provider, [...existing, validator]);
}

/**
 * Run all registered validators for the given provider.
 */
function runProviderValidators(
  data: AISettingsData,
  ctx: z.RefinementCtx,
): void {
  const validators = providerValidators.get(data.provider);
  if (validators) {
    for (const validator of validators) {
      validator(data, ctx);
    }
  }
}

// ============================================================================
// LM Studio provider validation
// ============================================================================

function validateLMStudioBaseURL(
  data: AISettingsData,
  ctx: z.RefinementCtx,
): void {
  const { lmstudioBaseURL } = data;

  if (!lmstudioBaseURL || lmstudioBaseURL.trim() === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lmstudioBaseURL'],
      message: 'Base URL is required when using LM Studio',
    });
    return;
  }

  try {
    new URL(lmstudioBaseURL);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lmstudioBaseURL'],
      message: 'Please enter a valid URL (e.g., http://localhost:1234/v1)',
    });
  }
}

// Register LM Studio validators
registerProviderValidator('lmstudio', validateLMStudioBaseURL);

// ============================================================================
// OpenAI provider validation
// ============================================================================

function validateOpenAIReasoningEffort(
  data: AISettingsData,
  ctx: z.RefinementCtx,
): void {
  const { model, reasoningEffort } = data;

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

// Register OpenAI validators
registerProviderValidator('openai', validateOpenAIReasoningEffort);

// ============================================================================
// OpenRouter provider validation
// ============================================================================

function validateOpenRouterExtraParams(
  data: AISettingsData,
  ctx: z.RefinementCtx,
): void {
  const { openrouterExtraParams } = data;

  if (!openrouterExtraParams || openrouterExtraParams.trim() === '') {
    return;
  }

  try {
    JSON.parse(openrouterExtraParams);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['openrouterExtraParams'],
      message:
        'Invalid JSON format. Please enter valid JSON (e.g., {"temperature": 0.7})',
    });
  }
}

// Register OpenRouter validators
registerProviderValidator('openrouter', validateOpenRouterExtraParams);

// ============================================================================
// Settings schemas
// ============================================================================

export const hotkeyAcceleratorSchema = z.string().trim();

export const hotkeysSettingsSchema = z
  .object({
    fixSelection: hotkeyAcceleratorSchema,
    togglePopup: hotkeyAcceleratorSchema,
  })
  .superRefine((data, ctx) => {
    validateHotkeyFormats(data, ctx);
    validateHotkeyUniqueness(data, ctx);
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
    openrouterExtraParams: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Provider-specific validations from registry
    // Cast is safe because aiProviderSchema validates the provider
    runProviderValidators(data as AISettingsData, ctx);
  });

export const automationSettingsSchema = z.object({
  clipboardSyncDelayMs: z.number().int().min(0).max(5_000),
  selectionDelayMs: z.number().int().min(0).max(5_000),
});

export const openrouterModelsCacheSchema = z.object({
  models: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  timestamp: z.number(),
});

export const appSettingsSchema = z.object({
  hotkeys: hotkeysSettingsSchema,
  ai: aiSettingsSchema,
  automation: automationSettingsSchema,
  openrouterModelsCache: openrouterModelsCacheSchema.optional(),
});

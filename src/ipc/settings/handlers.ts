/**
 * Settings IPC handlers
 */
import { os } from '@orpc/server';
import {
  deleteApiKey,
  getApiKeyPreview,
  hasApiKey,
  isEncryptionAvailable,
  saveApiKey,
} from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import type { HotkeysSettings } from '@/shared/types/settings';
import {
  appSettingsSchema,
  deleteApiKeyInputSchema,
  hasApiKeyInputSchema,
  isEncryptionAvailableInputSchema,
  isValidHotkeyAccelerator,
  saveApiKeyInputSchema,
  testLMStudioConnectionInputSchema,
} from './schemas';

const hotkeyLabels = {
  fixSelection: 'Fix Selection',
  togglePopup: 'Toggle Popup',
} as const satisfies Record<keyof HotkeysSettings, string>;

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

function validateHotkeys(hotkeys: HotkeysSettings): void {
  for (const [id, accelerator] of Object.entries(hotkeys) as Array<
    [keyof HotkeysSettings, string]
  >) {
    if (isValidHotkeyAccelerator(accelerator)) continue;
    throw new Error(
      `Invalid hotkey for "${hotkeyLabels[id]}": "${accelerator}"`,
    );
  }

  const seen = new Map<
    string,
    { id: keyof HotkeysSettings; accelerator: string }
  >();

  for (const [id, accelerator] of Object.entries(hotkeys) as Array<
    [keyof HotkeysSettings, string]
  >) {
    const normalized = normalizeHotkeyAcceleratorForUniqueness(accelerator);
    const existing = seen.get(normalized);
    if (!existing) {
      seen.set(normalized, { id, accelerator });
      continue;
    }

    throw new Error(
      `Hotkeys must be unique: "${hotkeyLabels[existing.id]}" and "${hotkeyLabels[id]}" both use "${existing.accelerator}"`,
    );
  }
}

export const getSettings = os.handler(() => {
  return store.store;
});

export const updateSettings = os
  .input(appSettingsSchema)
  .handler(({ input }) => {
    const hotkeys: HotkeysSettings = {
      fixSelection: input.hotkeys.fixSelection.trim(),
      togglePopup: input.hotkeys.togglePopup.trim(),
    };

    validateHotkeys(hotkeys);

    store.set({ ...input, hotkeys });
    return store.store;
  });

export const saveApiKeyHandler = os
  .input(saveApiKeyInputSchema)
  .handler(({ input }) => {
    saveApiKey(input.provider, input.key);
    return { success: true };
  });

export const hasApiKeyHandler = os
  .input(hasApiKeyInputSchema)
  .handler(({ input }) => {
    const hasKey = hasApiKey(input.provider);
    return {
      hasKey,
      preview: hasKey ? getApiKeyPreview(input.provider) : null,
    };
  });

export const deleteApiKeyHandler = os
  .input(deleteApiKeyInputSchema)
  .handler(({ input }) => {
    deleteApiKey(input.provider);
    return { success: true };
  });

export const isEncryptionAvailableHandler = os
  .input(isEncryptionAvailableInputSchema)
  .handler(() => {
    return { available: isEncryptionAvailable() };
  });

export const testLMStudioConnection = os
  .input(testLMStudioConnectionInputSchema)
  .handler(async ({ input }) => {
    try {
      const response = await fetch(`${input.baseURL}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Server responded with status ${response.status}`,
        };
      }

      const data = (await response.json()) as {
        data?: Array<{ id: string }>;
      };
      const modelCount = data.data?.length || 0;

      return {
        success: true,
        message: `Connected successfully. Found ${modelCount} model(s).`,
        models: data.data?.map((m) => m.id) || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  });

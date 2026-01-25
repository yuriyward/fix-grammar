/**
 * Zod schemas for shortcuts IPC
 */
import { z } from 'zod';
import { hotkeyAcceleratorSchema } from '@/shared/schemas/settings';

export const shortcutActionSchema = z.enum(['fixSelection', 'togglePopup']);

export const registerShortcutInputSchema = z.object({
  action: shortcutActionSchema,
  accelerator: hotkeyAcceleratorSchema,
});

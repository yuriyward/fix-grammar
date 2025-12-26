/**
 * Zod schemas for shortcuts IPC
 */
import { z } from 'zod';

export const shortcutActionSchema = z.enum([
  'fixSelection',
  'fixField',
  'togglePopup',
  'openSettings',
]);

export const registerShortcutInputSchema = z.object({
  action: shortcutActionSchema,
  accelerator: z.string(),
});

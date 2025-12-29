/**
 * Zod schemas for permissions IPC
 */
import z from 'zod';

export const requestAccessibilityAccessSchema = z.object({
  prompt: z.boolean().default(true),
});

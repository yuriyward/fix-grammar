/**
 * Zod schemas for automation IPC
 */
import { z } from 'zod';

export const captureModeSchema = z.enum(['selection', 'field']);

export const captureTextInputSchema = z.object({
  mode: captureModeSchema,
});

export const replaceTextInputSchema = z.object({
  text: z.string(),
});

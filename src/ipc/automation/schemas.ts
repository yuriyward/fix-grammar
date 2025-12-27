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

export const calibrateDelaysInputSchema = z.object({
  expectedText: z.string().min(1).max(50_000),
});

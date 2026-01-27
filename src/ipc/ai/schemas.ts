/**
 * Zod schemas for AI IPC
 */
import { z } from 'zod';

const MAX_REWRITE_TEXT_LENGTH = 10_000;

export const rewriteInputSchema = z.object({
  text: z.string().min(1).max(MAX_REWRITE_TEXT_LENGTH),
  skillId: z.string().min(1),
});

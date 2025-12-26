/**
 * Zod schemas for AI IPC
 */
import { z } from 'zod';

export const rewriteRoleSchema = z.enum(['grammar', 'grammar-tone']);

export const rewriteInputSchema = z.object({
  text: z.string().min(1).max(10000),
  role: rewriteRoleSchema,
});

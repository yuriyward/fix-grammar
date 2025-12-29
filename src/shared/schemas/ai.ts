/**
 * Shared AI-related Zod schemas
 */
import { z } from 'zod';

export const rewriteRoleSchema = z.enum(['grammar', 'grammar-tone']);

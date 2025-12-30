/**
 * Shared AI-related Zod schemas
 */
import { z } from 'zod';

export const rewriteRoleSchema = z.enum(['grammar', 'grammar-tone']);

/**
 * Schema for OpenRouter extra parameters.
 * Validates that the input is a plain object (not an array or primitive).
 * Uses a custom refinement to ensure the parsed JSON is a valid object
 * that can be safely passed to the AI SDK's providerOptions.
 *
 * @see https://openrouter.ai/docs/guides/overview/models (supported_parameters)
 */
export const openrouterExtraParamsSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (val): val is Record<string, unknown> => {
      // Ensure it's a plain object (not null, array, or other types)
      return (
        val !== null &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        Object.getPrototypeOf(val) === Object.prototype
      );
    },
    { message: 'OpenRouter extra params must be a plain object' },
  );

export type OpenrouterExtraParams = z.infer<typeof openrouterExtraParamsSchema>;

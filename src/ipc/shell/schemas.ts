/**
 * Zod schemas for shell IPC
 */
import z from 'zod';

const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

export const openExternalLinkInputSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ALLOWED_PROTOCOLS.includes(
            parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number],
          );
        } catch {
          return false;
        }
      },
      { message: 'URL must use http: or https: protocol' },
    ),
});

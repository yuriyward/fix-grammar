/**
 * Zod schemas for shell IPC
 */
import z from 'zod';
import { validateExternalUrl } from '@/shared/utils/url-validation';

export const openExternalLinkInputSchema = z.object({
  url: z.string().superRefine((url, ctx) => {
    const result = validateExternalUrl(url);
    if (!result.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error });
    }
  }),
});

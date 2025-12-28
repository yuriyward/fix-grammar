/**
 * Zod schemas for notifications IPC
 */
import { z } from 'zod';

export const notificationIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * Zod schemas for window IPC
 */
import { z } from 'zod';

/** Schema for window state values */
export const windowStateSchema = z.enum(['maximized', 'minimized', 'normal']);

/** Schema for setting window bounds */
export const setWindowBoundsSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

/** Schema for window action results (void operations) */
export const windowActionResultSchema = z.void();

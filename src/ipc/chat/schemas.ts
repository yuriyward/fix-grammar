/**
 * Zod schemas for chat IPC
 */
import { z } from 'zod';

export const createConversationInputSchema = z.object({
  firstMessage: z.string().optional(),
  sourceApp: z.string().optional(),
  sourceText: z.string().optional(),
});

export const getConversationInputSchema = z.object({
  id: z.string().uuid(),
});

export const deleteConversationInputSchema = z.object({
  id: z.string().uuid(),
});

export const sendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1),
});

export const broadcastSelectionInputSchema = z.object({
  conversationId: z.string().nullable(),
});

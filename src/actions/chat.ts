/**
 * Chat IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { Conversation, ConversationSummary } from '@/shared/types/chat';

export async function createConversation(options?: {
  firstMessage?: string;
  sourceApp?: string;
  sourceText?: string;
}): Promise<Conversation> {
  return ipc.client.chat.createConversation(options ?? {});
}

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  return ipc.client.chat.getConversation({ id });
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return ipc.client.chat.listConversations();
}

export async function deleteConversation(
  id: string,
): Promise<{ success: boolean }> {
  return ipc.client.chat.deleteConversation({ id });
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ userMessageId: string; assistantMessageId: string }> {
  return ipc.client.chat.sendMessage({ conversationId, content });
}

export async function getLastConversationId(): Promise<string | null> {
  const result = await ipc.client.chat.getLastConversationId();
  return result.conversationId;
}

export async function broadcastSelection(
  conversationId: string | null,
): Promise<{ success: boolean }> {
  return ipc.client.chat.broadcastSelection({ conversationId });
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<{ success: boolean }> {
  return ipc.client.chat.deleteMessage({ conversationId, messageId });
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string,
): Promise<{
  editedMessageId: string;
  assistantMessageId: string;
  truncatedCount: number;
}> {
  return ipc.client.chat.editMessage({ conversationId, messageId, content });
}

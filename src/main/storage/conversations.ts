/**
 * Persistent conversation storage using electron-store
 */
import { randomUUID } from 'node:crypto';
import ElectronStore from 'electron-store';
import type {
  ChatMessage,
  Conversation,
  ConversationSummary,
} from '@/shared/types/chat';

interface ConversationsSchema {
  conversations: Record<string, Conversation>;
  order: string[]; // IDs in creation order (oldest first)
}

const MAX_CONVERSATIONS = 100;

const store = new ElectronStore<ConversationsSchema>({
  name: 'conversations',
  defaults: {
    conversations: {},
    order: [],
  },
});

function generateTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 50) return trimmed;
  return `${trimmed.slice(0, 47)}...`;
}

export function createConversation(
  firstMessage?: string,
  sourceApp?: string,
  sourceText?: string,
): Conversation {
  const id = randomUUID();
  const now = Date.now();

  const conversation: Conversation = {
    id,
    title: firstMessage ? generateTitle(firstMessage) : 'New Conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
    ...(sourceApp && { sourceApp }),
    ...(sourceText && { sourceText }),
  };

  const conversations = store.get('conversations');
  const order = store.get('order');

  conversations[id] = conversation;
  order.push(id);

  // Enforce limit: remove oldest conversations
  while (order.length > MAX_CONVERSATIONS) {
    const oldestId = order.shift();
    if (oldestId) {
      delete conversations[oldestId];
    }
  }

  store.set('conversations', conversations);
  store.set('order', order);

  return conversation;
}

export function getConversation(id: string): Conversation | null {
  const conversations = store.get('conversations');
  return conversations[id] ?? null;
}

export function listConversations(): ConversationSummary[] {
  const conversations = store.get('conversations');
  const order = store.get('order');

  // Return in reverse order (newest first)
  return order
    .slice()
    .reverse()
    .map((id) => {
      const conv = conversations[id];
      if (!conv) return null;
      return {
        id: conv.id,
        title: conv.title,
        messageCount: conv.messages.length,
        updatedAt: conv.updatedAt,
      };
    })
    .filter((c): c is ConversationSummary => c !== null);
}

export function deleteConversation(id: string): boolean {
  const conversations = store.get('conversations');
  const order = store.get('order');

  if (!conversations[id]) return false;

  delete conversations[id];
  const newOrder = order.filter((oid) => oid !== id);

  store.set('conversations', conversations);
  store.set('order', newOrder);

  return true;
}

export function addMessageToConversation(
  conversationId: string,
  role: ChatMessage['role'],
  content: string,
): ChatMessage | null {
  const conversations = store.get('conversations');
  const conversation = conversations[conversationId];

  if (!conversation) return null;

  const message: ChatMessage = {
    id: randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };

  conversation.messages.push(message);
  conversation.updatedAt = message.createdAt;

  // Update title from first user message if still default
  if (
    conversation.title === 'New Conversation' &&
    role === 'user' &&
    conversation.messages.length === 1
  ) {
    conversation.title = generateTitle(content);
  }

  store.set('conversations', conversations);

  return message;
}

export function updateMessageContent(
  conversationId: string,
  messageId: string,
  content: string,
): boolean {
  const conversations = store.get('conversations');
  const conversation = conversations[conversationId];

  if (!conversation) return false;

  const message = conversation.messages.find((m) => m.id === messageId);
  if (!message) return false;

  message.content = content;
  conversation.updatedAt = Date.now();

  store.set('conversations', conversations);

  return true;
}

export function clearAllConversations(): void {
  store.set('conversations', {});
  store.set('order', []);
}

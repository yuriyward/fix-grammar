/**
 * Chat and conversation types
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  sourceApp?: string;
  sourceText?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: number;
}

export interface ChatStreamChunk {
  conversationId: string;
  messageId: string;
  type: 'delta' | 'complete' | 'error';
  content: string;
}

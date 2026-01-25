/**
 * Custom hook for chat - delegates to Zustand store
 */
import { useEffect } from 'react';
import { useChatStore } from '@/renderer/stores/chat-store';
import type { ChatMessage, ConversationSummary } from '@/shared/types/chat';

interface UseChatOptions {
  conversationId?: string;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversations: ConversationSummary[];
  send: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  newConversation: (options?: {
    firstMessage?: string;
    sourceApp?: string;
    sourceText?: string;
  }) => Promise<string>;
  clearConversation: () => void;
  refreshConversations: () => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const store = useChatStore();

  useEffect(() => {
    if (
      options.conversationId &&
      options.conversationId !== store.selectedConversationId
    ) {
      store.selectConversation(options.conversationId);
    }
  }, [
    options.conversationId,
    store.selectedConversationId,
    store.selectConversation,
  ]);

  useEffect(() => {
    if (options.onError && store.error) {
      options.onError(store.error);
    }
  }, [store.error, options.onError]);

  const loadConversation = async (id: string) => {
    await store.selectConversation(id);
  };

  const clearConversation = () => {
    store.selectConversation(null);
  };

  return {
    messages: store.messages,
    isLoading: store.isLoading,
    error: store.error,
    conversationId: store.selectedConversationId,
    conversations: store.conversations,
    send: store.sendMessage,
    loadConversation,
    newConversation: store.createConversation,
    clearConversation,
    refreshConversations: store.fetchConversations,
  };
}

/**
 * Custom hook for chat - delegates to Zustand store
 */
import { useEffect } from 'react';
import {
  type ConversationContext,
  useChatStore,
} from '@/renderer/stores/chat-store';
import type { ChatMessage, ConversationSummary } from '@/shared/types/chat';

interface UseChatOptions {
  conversationId?: string;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  context: ConversationContext | null;
  isLoading: boolean;
  error: string | null;
  conversationId: string | null;
  conversations: ConversationSummary[];
  editingMessageId: string | null;
  send: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  newConversation: (options?: {
    firstMessage?: string;
    sourceApp?: string;
    sourceText?: string;
  }) => Promise<string>;
  clearConversation: () => void;
  refreshConversations: () => Promise<void>;
  startEdit: (messageId: string) => void;
  cancelEdit: () => void;
  submitEdit: (content: string) => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const store = useChatStore();

  useEffect(() => {
    const { selectedConversationId, selectConversation } =
      useChatStore.getState();
    if (
      options.conversationId &&
      options.conversationId !== selectedConversationId
    ) {
      selectConversation(options.conversationId);
    }
  }, [options.conversationId]);

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
    context: store.context,
    isLoading: store.isLoading,
    error: store.error,
    conversationId: store.selectedConversationId,
    conversations: store.conversations,
    editingMessageId: store.editingMessageId,
    send: store.sendMessage,
    loadConversation,
    newConversation: store.createConversation,
    clearConversation,
    refreshConversations: store.fetchConversations,
    startEdit: store.startEditMessage,
    cancelEdit: store.cancelEditMessage,
    submitEdit: store.submitEditMessage,
  };
}

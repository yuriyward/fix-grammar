/**
 * Zustand store for cross-window chat state sync
 */
import { create } from 'zustand';
import {
  broadcastSelection,
  createConversation as createConversationAction,
  deleteConversation as deleteConversationAction,
  getConversation,
  listConversations,
  sendMessage as sendMessageAction,
} from '@/actions/chat';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  ChatMessage,
  ChatStreamChunk,
  ConversationSummary,
} from '@/shared/types/chat';

interface ChatStore {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  streamingContent: Map<string, string>;

  fetchConversations: () => Promise<void>;
  selectConversation: (
    id: string | null,
    options?: { broadcast?: boolean },
  ) => Promise<void>;
  createConversation: (options?: {
    firstMessage?: string;
    sourceApp?: string;
    sourceText?: string;
  }) => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  handleStreamChunk: (chunk: ChatStreamChunk) => void;

  _handleConversationsChanged: () => void;
  _handleConversationSelected: (id: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  messages: [],
  isLoading: false,
  error: null,
  streamingContent: new Map(),

  fetchConversations: async () => {
    const convs = await listConversations();
    set({ conversations: convs });
  },

  selectConversation: async (id, options = { broadcast: true }) => {
    if (id === null) {
      set({ selectedConversationId: null, messages: [], error: null });
      if (options.broadcast) {
        await broadcastSelection(null);
      }
      return;
    }

    const conv = await getConversation(id);
    if (conv) {
      set({
        selectedConversationId: conv.id,
        messages: conv.messages,
        error: null,
      });
      if (options.broadcast) {
        await broadcastSelection(conv.id);
      }
    }
  },

  createConversation: async (options) => {
    const conv = await createConversationAction(options);
    set({
      selectedConversationId: conv.id,
      messages: [],
      error: null,
    });
    return conv.id;
  },

  deleteConversation: async (id) => {
    const { selectedConversationId } = get();
    await deleteConversationAction(id);

    if (selectedConversationId === id) {
      set({ selectedConversationId: null, messages: [], error: null });
    }
  },

  sendMessage: async (content) => {
    const state = get();
    if (!content.trim()) return;

    let conversationId = state.selectedConversationId;

    if (!conversationId) {
      conversationId = await state.createConversation({
        firstMessage: content,
      });
    }

    set({ isLoading: true, error: null });

    const optimisticUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, optimisticUserMessage] }));

    try {
      await sendMessageAction(conversationId, content);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send message';
      set({ error: errorMsg, isLoading: false });
    }
  },

  handleStreamChunk: (chunk) => {
    const { selectedConversationId, streamingContent } = get();

    if (chunk.conversationId !== selectedConversationId) return;

    if (chunk.type === 'delta') {
      const currentContent = streamingContent.get(chunk.messageId) ?? '';
      const newContent = currentContent + chunk.content;
      streamingContent.set(chunk.messageId, newContent);

      set((state) => {
        const existingIndex = state.messages.findIndex(
          (m) => m.id === chunk.messageId,
        );
        if (existingIndex >= 0) {
          return {
            messages: state.messages.map((m, i) =>
              i === existingIndex ? { ...m, content: newContent } : m,
            ),
          };
        }
        return {
          messages: [
            ...state.messages,
            {
              id: chunk.messageId,
              role: 'assistant' as const,
              content: newContent,
              createdAt: Date.now(),
            },
          ],
        };
      });
    } else if (chunk.type === 'complete') {
      streamingContent.delete(chunk.messageId);
      set({ isLoading: false });
      get().fetchConversations();
    } else if (chunk.type === 'error') {
      streamingContent.delete(chunk.messageId);
      set({ error: chunk.content, isLoading: false });
    }
  },

  _handleConversationsChanged: () => {
    const { selectedConversationId } = get();
    get().fetchConversations();
    // Also refresh current conversation's messages if one is selected
    if (selectedConversationId) {
      get().selectConversation(selectedConversationId, { broadcast: false });
    }
  },

  _handleConversationSelected: (id) => {
    const { selectedConversationId } = get();
    if (id !== selectedConversationId) {
      get().selectConversation(id, { broadcast: false });
    }
  },
}));

let initialized = false;

export function initializeChatStoreSync() {
  if (initialized) return;
  initialized = true;

  const store = useChatStore.getState();

  store.fetchConversations();

  const handleConversationsChanged = () => {
    useChatStore.getState()._handleConversationsChanged();
  };

  const handleConversationSelected = (event: Event) => {
    const customEvent = event as CustomEvent<{ conversationId: string | null }>;
    useChatStore
      .getState()
      ._handleConversationSelected(customEvent.detail.conversationId);
  };

  const handleStreamChunk = (event: Event) => {
    const customEvent = event as CustomEvent<ChatStreamChunk>;
    useChatStore.getState().handleStreamChunk(customEvent.detail);
  };

  window.addEventListener(
    IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED,
    handleConversationsChanged,
  );
  window.addEventListener(
    IPC_CHANNELS.CHAT_CONVERSATION_SELECTED,
    handleConversationSelected,
  );
  window.addEventListener(IPC_CHANNELS.CHAT_STREAM, handleStreamChunk);
}

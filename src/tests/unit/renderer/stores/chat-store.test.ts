/**
 * Chat store tests
 */
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation } from '@/shared/types/chat';

const mockListConversations = vi.fn();
const mockGetConversation = vi.fn();
const mockCreateConversation = vi.fn();
const mockDeleteConversation = vi.fn();
const mockSendMessage = vi.fn();
const mockEditMessage = vi.fn();
const mockBroadcastSelection = vi.fn();

const mockGetSkill = vi.fn();

vi.mock('@/actions/skills', () => ({
  getSkill: (id: string) => mockGetSkill(id),
}));

vi.mock('@/actions/chat', () => ({
  listConversations: () => mockListConversations(),
  getConversation: (id: string) => mockGetConversation(id),
  createConversation: (opts: unknown) => mockCreateConversation(opts),
  deleteConversation: (id: string) => mockDeleteConversation(id),
  sendMessage: (convId: string, content: string) =>
    mockSendMessage(convId, content),
  editMessage: (convId: string, msgId: string, content: string) =>
    mockEditMessage(convId, msgId, content),
  broadcastSelection: (id: string | null) => mockBroadcastSelection(id),
}));

describe('Chat store', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    mockListConversations.mockResolvedValue([]);
    mockGetConversation.mockResolvedValue(null);
    mockCreateConversation.mockResolvedValue({ id: 'new-conv-id' });
    mockDeleteConversation.mockResolvedValue({ success: true });
    mockSendMessage.mockResolvedValue({
      userMessageId: 'user-msg-id',
      assistantMessageId: 'assistant-msg-id',
    });
    mockEditMessage.mockResolvedValue({
      editedMessageId: 'edited-msg-id',
      assistantMessageId: 'new-assistant-msg-id',
      truncatedCount: 1,
    });
    mockBroadcastSelection.mockResolvedValue({ success: true });
    mockGetSkill.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Grammar Fix',
      description: 'Fix grammar errors',
      prompt: 'Fix grammar errors',
      builtIn: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  async function getStore() {
    const { useChatStore } = await import('@/renderer/stores/chat-store');
    return useChatStore;
  }

  describe('initial state', () => {
    it('has correct default values', async () => {
      const useChatStore = await getStore();
      const state = useChatStore.getState();

      expect(state.conversations).toEqual([]);
      expect(state.selectedConversationId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.context).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.editingMessageId).toBeNull();
    });
  });

  describe('fetchConversations', () => {
    it('fetches and sets conversations', async () => {
      const mockConvs = [
        { id: '1', title: 'First', messageCount: 2, updatedAt: Date.now() },
        { id: '2', title: 'Second', messageCount: 1, updatedAt: Date.now() },
      ];
      mockListConversations.mockResolvedValue(mockConvs);

      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().fetchConversations();
      });

      expect(useChatStore.getState().conversations).toEqual(mockConvs);
    });
  });

  describe('selectConversation', () => {
    it('selects conversation and loads messages', async () => {
      const mockConv: Conversation = {
        id: 'conv-1',
        title: 'Test',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            createdAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sourceText: 'Original',
        sourceSkillId: '00000000-0000-4000-8000-000000000001',
        sourceSkillPrompt: 'Fix grammar errors',
        sourceApp: 'TestApp',
      };
      mockGetConversation.mockResolvedValue(mockConv);

      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().selectConversation('conv-1');
      });

      const state = useChatStore.getState();
      expect(state.selectedConversationId).toBe('conv-1');
      expect(state.messages).toEqual(mockConv.messages);
      expect(state.context).toEqual({
        sourceText: 'Original',
        sourceApp: 'TestApp',
        sourceSkillId: '00000000-0000-4000-8000-000000000001',
        sourceSkillName: 'Grammar Fix',
        sourceSkillPrompt: 'Fix grammar errors',
      });
      expect(mockBroadcastSelection).toHaveBeenCalledWith('conv-1');
    });

    it('clears state when selecting null', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().selectConversation(null);
      });

      const state = useChatStore.getState();
      expect(state.selectedConversationId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.context).toBeNull();
      expect(mockBroadcastSelection).toHaveBeenCalledWith(null);
    });

    it('does not broadcast when broadcast option is false', async () => {
      const mockConv: Conversation = {
        id: 'conv-1',
        title: 'Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockGetConversation.mockResolvedValue(mockConv);

      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore
          .getState()
          .selectConversation('conv-1', { broadcast: false });
      });

      expect(mockBroadcastSelection).not.toHaveBeenCalled();
    });
  });

  describe('createConversation', () => {
    it('creates conversation and sets it as selected', async () => {
      const useChatStore = await getStore();

      let convId = '';
      await act(async () => {
        convId = await useChatStore.getState().createConversation({
          firstMessage: 'Hello',
          sourceApp: 'TestApp',
        });
      });

      expect(convId).toBe('new-conv-id');
      expect(mockCreateConversation).toHaveBeenCalledWith({
        firstMessage: 'Hello',
        sourceApp: 'TestApp',
      });
      expect(useChatStore.getState().selectedConversationId).toBe(
        'new-conv-id',
      );
    });
  });

  describe('deleteConversation', () => {
    it('deletes conversation and clears selection if it was selected', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'conv-to-delete' });
        await useChatStore.getState().deleteConversation('conv-to-delete');
      });

      expect(mockDeleteConversation).toHaveBeenCalledWith('conv-to-delete');
      expect(useChatStore.getState().selectedConversationId).toBeNull();
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('does not clear selection if different conversation deleted', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'other-conv' });
        await useChatStore.getState().deleteConversation('conv-to-delete');
      });

      expect(useChatStore.getState().selectedConversationId).toBe('other-conv');
    });
  });

  describe('sendMessage', () => {
    it('does nothing for empty message', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().sendMessage('   ');
      });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('creates conversation if none selected', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().sendMessage('Hello');
      });

      expect(mockCreateConversation).toHaveBeenCalledWith({
        firstMessage: 'Hello',
      });
    });

    it('adds optimistic user message and sends', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'conv-1' });
        await useChatStore.getState().sendMessage('Hello');
      });

      expect(mockSendMessage).toHaveBeenCalledWith('conv-1', 'Hello');
      expect(useChatStore.getState().isLoading).toBe(true);
    });

    it('sets error on failure', async () => {
      mockSendMessage.mockRejectedValue(new Error('API Error'));
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'conv-1' });
        await useChatStore.getState().sendMessage('Hello');
      });

      expect(useChatStore.getState().error).toBe('API Error');
      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('handleStreamChunk', () => {
    it('ignores chunks for different conversation', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          messages: [],
        });
        useChatStore.getState().handleStreamChunk({
          conversationId: 'conv-2',
          messageId: 'msg-1',
          type: 'delta',
          content: 'Hello',
        });
      });

      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('appends delta content to new message', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          messages: [],
        });
        useChatStore.getState().handleStreamChunk({
          conversationId: 'conv-1',
          messageId: 'msg-1',
          type: 'delta',
          content: 'Hello',
        });
      });

      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(1);
      expect(messages[0]?.content).toBe('Hello');
      expect(messages[0]?.role).toBe('assistant');
    });

    it('appends delta content to existing message', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          messages: [
            {
              id: 'msg-1',
              role: 'assistant',
              content: 'Hello',
              createdAt: Date.now(),
            },
          ],
          streamingContent: new Map([['msg-1', 'Hello']]),
        });
        useChatStore.getState().handleStreamChunk({
          conversationId: 'conv-1',
          messageId: 'msg-1',
          type: 'delta',
          content: ' World',
        });
      });

      expect(useChatStore.getState().messages[0]?.content).toBe('Hello World');
    });

    it('handles complete chunk', async () => {
      mockListConversations.mockResolvedValue([]);
      const mockConv: Conversation = {
        id: 'conv-1',
        title: 'Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockGetConversation.mockResolvedValue(mockConv);

      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          isLoading: true,
        });
        useChatStore.getState().handleStreamChunk({
          conversationId: 'conv-1',
          messageId: 'msg-1',
          type: 'complete',
          content: 'Final content',
        });
      });

      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('handles error chunk', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          isLoading: true,
        });
        useChatStore.getState().handleStreamChunk({
          conversationId: 'conv-1',
          messageId: 'msg-1',
          type: 'error',
          content: 'Something went wrong',
        });
      });

      expect(useChatStore.getState().error).toBe('Something went wrong');
      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('edit message', () => {
    it('sets editing message id', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.getState().startEditMessage('msg-1');
      });

      expect(useChatStore.getState().editingMessageId).toBe('msg-1');
      expect(useChatStore.getState().error).toBeNull();
    });

    it('cancels edit', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ editingMessageId: 'msg-1' });
        useChatStore.getState().cancelEditMessage();
      });

      expect(useChatStore.getState().editingMessageId).toBeNull();
    });

    it('does nothing if no conversation or message selected', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        await useChatStore.getState().submitEditMessage('New content');
      });

      expect(mockEditMessage).not.toHaveBeenCalled();
    });

    it('submits edit and truncates messages', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          editingMessageId: 'msg-1',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Original',
              createdAt: Date.now(),
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Response',
              createdAt: Date.now(),
            },
          ],
        });
        await useChatStore.getState().submitEditMessage('Edited content');
      });

      expect(mockEditMessage).toHaveBeenCalledWith(
        'conv-1',
        'msg-1',
        'Edited content',
      );
      expect(useChatStore.getState().editingMessageId).toBeNull();
      expect(useChatStore.getState().isLoading).toBe(true);

      // Messages should be truncated to just the edited message
      const messages = useChatStore.getState().messages;
      expect(messages.length).toBe(1);
      expect(messages[0]?.content).toBe('Edited content');
    });

    it('sets error on edit failure', async () => {
      mockEditMessage.mockRejectedValue(new Error('Edit failed'));
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({
          selectedConversationId: 'conv-1',
          editingMessageId: 'msg-1',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Original',
              createdAt: Date.now(),
            },
          ],
        });
        await useChatStore.getState().submitEditMessage('Edited');
      });

      expect(useChatStore.getState().error).toBe('Edit failed');
      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('internal handlers', () => {
    it('_handleConversationsChanged refreshes conversations', async () => {
      mockListConversations.mockResolvedValue([
        { id: '1', title: 'New', messageCount: 0, updatedAt: Date.now() },
      ]);

      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.getState()._handleConversationsChanged();
      });

      // Allow async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockListConversations).toHaveBeenCalled();
    });

    it('_handleConversationSelected selects different conversation', async () => {
      const mockConv: Conversation = {
        id: 'conv-2',
        title: 'Selected',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockGetConversation.mockResolvedValue(mockConv);

      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'conv-1' });
        useChatStore.getState()._handleConversationSelected('conv-2');
      });

      // Allow async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(useChatStore.getState().selectedConversationId).toBe('conv-2');
    });

    it('_handleConversationSelected ignores same conversation', async () => {
      const useChatStore = await getStore();

      await act(async () => {
        useChatStore.setState({ selectedConversationId: 'conv-1' });
        useChatStore.getState()._handleConversationSelected('conv-1');
      });

      // selectConversation should not be called with broadcast: false
      // since we're already on this conversation
      expect(mockGetConversation).not.toHaveBeenCalled();
    });
  });
});

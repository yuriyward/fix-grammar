/**
 * Chat IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAllConversations } from '@/main/storage/conversations';

const { mockWindowManager, mockBroadcast } = vi.hoisted(() => {
  const mockBroadcast = vi.fn();
  return {
    mockWindowManager: { broadcast: mockBroadcast },
    mockBroadcast,
  };
});

vi.mock('@/main/windows/window-manager', () => ({
  windowManager: mockWindowManager,
}));

vi.mock('@/main/storage/context', () => ({
  getLastConversationId: vi.fn(() => null),
}));

describe('Chat IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllConversations();
  });

  describe('createConversation', () => {
    it('creates a new conversation and broadcasts change', async () => {
      const { createConversation } = await import('@/ipc/chat/handlers');
      const callCreateConversation = createProcedureClient(createConversation);

      const result = await callCreateConversation({});

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Conversation');
      expect(mockBroadcast).toHaveBeenCalledWith('chat:conversations-changed');
    });

    it('creates conversation with first message as title', async () => {
      const { createConversation } = await import('@/ipc/chat/handlers');
      const callCreateConversation = createProcedureClient(createConversation);

      const result = await callCreateConversation({
        firstMessage: 'Hello world',
      });

      expect(result.title).toBe('Hello world');
    });

    it('creates conversation with source context', async () => {
      const { createConversation } = await import('@/ipc/chat/handlers');
      const callCreateConversation = createProcedureClient(createConversation);

      const result = await callCreateConversation({
        firstMessage: 'Fix this',
        sourceApp: 'TextEdit',
        sourceText: 'Original text',
      });

      expect(result.sourceApp).toBe('TextEdit');
      expect(result.sourceText).toBe('Original text');
    });
  });

  describe('getConversation', () => {
    it('returns existing conversation', async () => {
      const { createConversation, getConversation } = await import(
        '@/ipc/chat/handlers'
      );
      const callCreateConversation = createProcedureClient(createConversation);
      const callGetConversation = createProcedureClient(getConversation);

      const created = await callCreateConversation({
        firstMessage: 'Test',
      });
      const result = await callGetConversation({ id: created.id });

      expect(result?.id).toBe(created.id);
      expect(result?.title).toBe('Test');
    });

    it('returns null for non-existent conversation', async () => {
      const { getConversation } = await import('@/ipc/chat/handlers');
      const callGetConversation = createProcedureClient(getConversation);

      const result = await callGetConversation({
        id: '00000000-0000-0000-0000-000000000000',
      });

      expect(result).toBeNull();
    });
  });

  describe('listConversationsHandler', () => {
    it('returns empty array when no conversations', async () => {
      const { listConversationsHandler } = await import('@/ipc/chat/handlers');
      const callListConversations = createProcedureClient(
        listConversationsHandler,
      );

      const result = await callListConversations(undefined);

      expect(result).toEqual([]);
    });

    it('returns conversation summaries', async () => {
      const { createConversation, listConversationsHandler } = await import(
        '@/ipc/chat/handlers'
      );
      const callCreateConversation = createProcedureClient(createConversation);
      const callListConversations = createProcedureClient(
        listConversationsHandler,
      );

      await callCreateConversation({ firstMessage: 'First' });
      await callCreateConversation({ firstMessage: 'Second' });

      const result = await callListConversations(undefined);

      expect(result.length).toBe(2);
      expect(result[0]?.title).toBe('Second');
      expect(result[1]?.title).toBe('First');
    });
  });

  describe('deleteConversation', () => {
    it('deletes existing conversation and broadcasts change', async () => {
      const { createConversation, deleteConversation } = await import(
        '@/ipc/chat/handlers'
      );
      const callCreateConversation = createProcedureClient(createConversation);
      const callDeleteConversation = createProcedureClient(deleteConversation);

      const created = await callCreateConversation({});
      mockBroadcast.mockClear();

      const result = await callDeleteConversation({ id: created.id });

      expect(result.success).toBe(true);
      expect(mockBroadcast).toHaveBeenCalledWith('chat:conversations-changed');
    });

    it('returns false for non-existent conversation', async () => {
      const { deleteConversation } = await import('@/ipc/chat/handlers');
      const callDeleteConversation = createProcedureClient(deleteConversation);

      const result = await callDeleteConversation({
        id: '00000000-0000-0000-0000-000000000000',
      });

      expect(result.success).toBe(false);
      expect(mockBroadcast).not.toHaveBeenCalledWith(
        'chat:conversations-changed',
      );
    });
  });

  describe('broadcastSelection', () => {
    it('broadcasts conversation selection', async () => {
      const { broadcastSelection } = await import('@/ipc/chat/handlers');
      const callBroadcastSelection = createProcedureClient(broadcastSelection);

      const result = await callBroadcastSelection({
        conversationId: 'test-id',
      });

      expect(result.success).toBe(true);
      expect(mockBroadcast).toHaveBeenCalledWith('chat:conversation-selected', {
        conversationId: 'test-id',
      });
    });

    it('broadcasts null selection', async () => {
      const { broadcastSelection } = await import('@/ipc/chat/handlers');
      const callBroadcastSelection = createProcedureClient(broadcastSelection);

      const result = await callBroadcastSelection({ conversationId: null });

      expect(result.success).toBe(true);
      expect(mockBroadcast).toHaveBeenCalledWith('chat:conversation-selected', {
        conversationId: null,
      });
    });
  });

  describe('getLastConversationIdHandler', () => {
    it('returns null when no last conversation', async () => {
      const { getLastConversationIdHandler } = await import(
        '@/ipc/chat/handlers'
      );
      const callGetLastConversationId = createProcedureClient(
        getLastConversationIdHandler,
      );

      const result = await callGetLastConversationId(undefined);

      expect(result).toEqual({ conversationId: null });
    });
  });
});

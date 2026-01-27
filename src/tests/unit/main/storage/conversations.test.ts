/**
 * Conversation storage tests
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addMessageToConversation,
  clearAllConversations,
  createConversation,
  deleteConversation,
  editMessageAndTruncate,
  getConversation,
  listConversations,
  updateMessageContent,
} from '@/main/storage/conversations';

describe('Conversation storage', () => {
  beforeEach(() => {
    clearAllConversations();
  });

  describe('createConversation', () => {
    it('creates a conversation with default title', () => {
      const conv = createConversation();

      expect(conv.id).toBeDefined();
      expect(conv.title).toBe('New Conversation');
      expect(conv.messages).toEqual([]);
      expect(conv.createdAt).toBeDefined();
      expect(conv.updatedAt).toBeDefined();
    });

    it('creates a conversation with title from first message', () => {
      const conv = createConversation('Hello, how are you?');

      expect(conv.title).toBe('Hello, how are you?');
    });

    it('truncates long titles to 50 characters', () => {
      const longMessage =
        'This is a very long message that should be truncated because it exceeds fifty characters';
      const conv = createConversation(longMessage);

      expect(conv.title).toBe(
        'This is a very long message that should be trun...',
      );
      expect(conv.title.length).toBe(50);
    });

    it('stores source context when provided', () => {
      const conv = createConversation(
        'Fix this text',
        'TextEdit',
        'Original text here',
        '00000000-0000-4000-8000-000000000001',
      );

      expect(conv.sourceApp).toBe('TextEdit');
      expect(conv.sourceText).toBe('Original text here');
      expect(conv.sourceSkillId).toBe('00000000-0000-4000-8000-000000000001');
    });

    it('enforces maximum conversation limit', () => {
      // Create 101 conversations (exceeds MAX_CONVERSATIONS of 100)
      for (let i = 0; i < 101; i++) {
        createConversation(`Message ${i}`);
      }

      const conversations = listConversations();
      expect(conversations.length).toBe(100);
    });
  });

  describe('getConversation', () => {
    it('returns conversation by id', () => {
      const created = createConversation('Test message');
      const retrieved = getConversation(created.id);

      expect(retrieved).toEqual(created);
    });

    it('returns null for non-existent id', () => {
      const result = getConversation('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('listConversations', () => {
    it('returns empty array when no conversations exist', () => {
      const result = listConversations();

      expect(result).toEqual([]);
    });

    it('returns conversations in reverse chronological order', () => {
      const conv1 = createConversation('First');
      const conv2 = createConversation('Second');
      const conv3 = createConversation('Third');

      const list = listConversations();

      expect(list[0]?.id).toBe(conv3.id);
      expect(list[1]?.id).toBe(conv2.id);
      expect(list[2]?.id).toBe(conv1.id);
    });

    it('returns conversation summaries with correct properties', () => {
      const conv = createConversation('Test');
      addMessageToConversation(conv.id, 'user', 'Hello');
      addMessageToConversation(conv.id, 'assistant', 'Hi there');

      const list = listConversations();

      expect(list[0]).toEqual({
        id: conv.id,
        title: 'Test',
        messageCount: 2,
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('deleteConversation', () => {
    it('deletes existing conversation', () => {
      const conv = createConversation('Test');

      const result = deleteConversation(conv.id);

      expect(result).toBe(true);
      expect(getConversation(conv.id)).toBeNull();
    });

    it('returns false for non-existent conversation', () => {
      const result = deleteConversation('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('addMessageToConversation', () => {
    it('adds user message to conversation', () => {
      const conv = createConversation();
      const message = addMessageToConversation(conv.id, 'user', 'Hello');

      expect(message).not.toBeNull();
      expect(message?.role).toBe('user');
      expect(message?.content).toBe('Hello');
      expect(message?.id).toBeDefined();
      expect(message?.createdAt).toBeDefined();
    });

    it('adds assistant message to conversation', () => {
      const conv = createConversation();
      const message = addMessageToConversation(
        conv.id,
        'assistant',
        'Hi there',
      );

      expect(message?.role).toBe('assistant');
      expect(message?.content).toBe('Hi there');
    });

    it('returns null for non-existent conversation', () => {
      const result = addMessageToConversation('non-existent', 'user', 'Hello');

      expect(result).toBeNull();
    });

    it('updates conversation title from first user message', () => {
      const conv = createConversation();
      addMessageToConversation(conv.id, 'user', 'New title from message');

      const updated = getConversation(conv.id);
      expect(updated?.title).toBe('New title from message');
    });

    it('does not update title if already set', () => {
      const conv = createConversation('Original title');
      addMessageToConversation(conv.id, 'user', 'Should not change title');

      const updated = getConversation(conv.id);
      expect(updated?.title).toBe('Original title');
    });

    it('updates conversation updatedAt timestamp', () => {
      const conv = createConversation();
      const originalUpdatedAt = conv.updatedAt;

      // Small delay to ensure different timestamp
      const message = addMessageToConversation(conv.id, 'user', 'Hello');
      const updated = getConversation(conv.id);

      expect(updated?.updatedAt).toBe(message?.createdAt);
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe('updateMessageContent', () => {
    it('updates existing message content', () => {
      const conv = createConversation();
      const message = addMessageToConversation(conv.id, 'user', 'Original');

      const result = updateMessageContent(
        conv.id,
        message?.id ?? '',
        'Updated',
      );

      expect(result).toBe(true);
      const updated = getConversation(conv.id);
      expect(updated?.messages[0]?.content).toBe('Updated');
    });

    it('returns false for non-existent conversation', () => {
      const result = updateMessageContent('non-existent', 'msg-id', 'Content');

      expect(result).toBe(false);
    });

    it('returns false for non-existent message', () => {
      const conv = createConversation();

      const result = updateMessageContent(conv.id, 'non-existent', 'Content');

      expect(result).toBe(false);
    });
  });

  describe('editMessageAndTruncate', () => {
    it('edits user message and truncates following messages', () => {
      const conv = createConversation();
      const msg1 = addMessageToConversation(conv.id, 'user', 'First');
      addMessageToConversation(conv.id, 'assistant', 'Response 1');
      addMessageToConversation(conv.id, 'user', 'Second');
      addMessageToConversation(conv.id, 'assistant', 'Response 2');

      const result = editMessageAndTruncate(
        conv.id,
        msg1?.id ?? '',
        'Edited first',
      );

      expect(result).toEqual({ success: true, truncatedCount: 3 });
      const updated = getConversation(conv.id);
      expect(updated?.messages.length).toBe(1);
      expect(updated?.messages[0]?.content).toBe('Edited first');
    });

    it('returns null for non-existent conversation', () => {
      const result = editMessageAndTruncate(
        'non-existent',
        'msg-id',
        'Content',
      );

      expect(result).toBeNull();
    });

    it('returns null for non-existent message', () => {
      const conv = createConversation();

      const result = editMessageAndTruncate(conv.id, 'non-existent', 'Content');

      expect(result).toBeNull();
    });

    it('returns null when trying to edit assistant message', () => {
      const conv = createConversation();
      addMessageToConversation(conv.id, 'user', 'User message');
      const assistantMsg = addMessageToConversation(
        conv.id,
        'assistant',
        'Assistant message',
      );

      const result = editMessageAndTruncate(
        conv.id,
        assistantMsg?.id ?? '',
        'Edited',
      );

      expect(result).toBeNull();
    });

    it('returns zero truncated count when editing last message', () => {
      const conv = createConversation();
      const msg = addMessageToConversation(conv.id, 'user', 'Only message');

      const result = editMessageAndTruncate(conv.id, msg?.id ?? '', 'Edited');

      expect(result).toEqual({ success: true, truncatedCount: 0 });
    });
  });

  describe('clearAllConversations', () => {
    it('removes all conversations', () => {
      createConversation('First');
      createConversation('Second');
      createConversation('Third');

      clearAllConversations();

      expect(listConversations()).toEqual([]);
    });
  });
});

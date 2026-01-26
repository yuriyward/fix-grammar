/**
 * Chat IPC handlers
 */

import { os } from '@orpc/server';
import type { ModelMessage } from 'ai';
import { streamText } from 'ai';
import { createModelInstance } from '@/main/ai/client';
import { parseAIError } from '@/main/ai/error-handler';
import { extractTokenUsage, traceChat } from '@/main/ai/langfuse';
import { buildPrompt } from '@/main/ai/prompts';
import { getApiKey } from '@/main/storage/api-keys';
import { getLastConversationId } from '@/main/storage/context';
import {
  addMessageToConversation,
  createConversation as createConv,
  deleteConversation as deleteConv,
  deleteMessageFromConversation,
  editMessageAndTruncate,
  getConversation as getConv,
  listConversations as listConvs,
  updateMessageContent,
} from '@/main/storage/conversations';
import { store } from '@/main/storage/settings';
import { windowManager } from '@/main/windows/window-manager';
import { AI_STREAM_TIMEOUT_MS } from '@/shared/config/ai';
import type { AIProvider } from '@/shared/config/ai-models';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  ChatMessage,
  ChatStreamChunk,
  Conversation,
} from '@/shared/types/chat';
import {
  broadcastSelectionInputSchema,
  createConversationInputSchema,
  deleteConversationInputSchema,
  deleteMessageInputSchema,
  editMessageInputSchema,
  getConversationInputSchema,
  sendMessageInputSchema,
} from './schemas';

const CHAT_SYSTEM_PROMPT = `You are a helpful assistant specialized in grammar and writing. You help users improve their text, answer questions about grammar and style, and provide writing assistance.

When correcting text:
- Clearly explain what changes you made and why
- Be educational but concise
- Maintain the user's voice and intent

When asked general questions, provide clear and helpful responses.`;

function convertToModelMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function buildSystemPrompt(conversation: Conversation): string {
  const includeOriginalPrompt = store.get('ai.includeOriginalPromptInChat');
  const { sourceText, sourceRole } = conversation;

  if (includeOriginalPrompt && sourceText && sourceRole) {
    return `${CHAT_SYSTEM_PROMPT}\n\n---\nOriginal correction context:\n${buildPrompt(sourceText, sourceRole)}`;
  }
  return CHAT_SYSTEM_PROMPT;
}

async function streamAIResponse(
  conversationId: string,
  assistantMessageId: string,
  modelMessages: ModelMessage[],
  systemPrompt: string,
): Promise<void> {
  const provider = store.get('ai.provider') as AIProvider;
  const model = store.get('ai.model') as string;
  const lmstudioBaseURL = store.get('ai.lmstudioBaseURL') as string | undefined;

  const apiKey = getApiKey(provider) || '';
  if (!apiKey && provider !== 'lmstudio') {
    throw new Error(`API key not found for provider: ${provider}`);
  }

  const modelInstance = createModelInstance(
    provider,
    apiKey,
    model,
    lmstudioBaseURL,
  );

  const result = streamText({
    model: modelInstance,
    system: systemPrompt,
    messages: modelMessages,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(AI_STREAM_TIMEOUT_MS),
  });

  let fullContent = '';
  const resolvedResult = await result;

  for await (const chunk of resolvedResult.textStream) {
    fullContent += chunk;

    const streamChunk: ChatStreamChunk = {
      conversationId,
      messageId: assistantMessageId,
      type: 'delta',
      content: chunk,
    };

    windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, streamChunk);
  }

  updateMessageContent(conversationId, assistantMessageId, fullContent);

  const usage = extractTokenUsage(await resolvedResult.usage);

  traceChat({
    messages: modelMessages.map((m) => ({
      role: m.role,
      content: String(m.content),
    })),
    systemPrompt,
    output: fullContent,
    model,
    provider,
    conversationId,
    ...(usage && { usage }),
  });

  const completeChunk: ChatStreamChunk = {
    conversationId,
    messageId: assistantMessageId,
    type: 'complete',
    content: fullContent,
  };
  windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, completeChunk);
  windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);
}

function broadcastError(
  conversationId: string,
  messageId: string,
  error: unknown,
): never {
  const errorDetails = parseAIError(error);

  // Delete empty assistant message from storage before broadcasting error.
  // The error chunk still references messageId so the renderer can identify
  // which pending message failed, even though it's no longer persisted.
  deleteMessageFromConversation(conversationId, messageId);

  const errorChunk: ChatStreamChunk = {
    conversationId,
    messageId,
    type: 'error',
    content: errorDetails.message,
  };
  windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, errorChunk);

  throw new Error(errorDetails.message);
}

export const createConversation = os
  .input(createConversationInputSchema)
  .handler(({ input }) => {
    const conversation = createConv(
      input.firstMessage,
      input.sourceApp,
      input.sourceText,
    );
    windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);
    return conversation;
  });

export const getConversation = os
  .input(getConversationInputSchema)
  .handler(({ input }): Conversation | null => {
    return getConv(input.id);
  });

export const listConversationsHandler = os.handler(() => {
  return listConvs();
});

export const getLastConversationIdHandler = os.handler(() => {
  return { conversationId: getLastConversationId() ?? null };
});

export const deleteConversation = os
  .input(deleteConversationInputSchema)
  .handler(({ input }) => {
    const success = deleteConv(input.id);
    if (success) {
      windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);
    }
    return { success };
  });

export const sendMessage = os
  .input(sendMessageInputSchema)
  .handler(async ({ input }) => {
    const { conversationId, content } = input;

    const userMessage = addMessageToConversation(
      conversationId,
      'user',
      content,
    );
    if (!userMessage) {
      throw new Error('Conversation not found');
    }

    const conversation = getConv(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const assistantMessage = addMessageToConversation(
      conversationId,
      'assistant',
      '',
    );
    if (!assistantMessage) {
      throw new Error('Failed to create assistant message');
    }

    const modelMessages = convertToModelMessages(conversation.messages);
    const systemPrompt = buildSystemPrompt(conversation);

    try {
      await streamAIResponse(
        conversationId,
        assistantMessage.id,
        modelMessages,
        systemPrompt,
      );

      return {
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      };
    } catch (error) {
      broadcastError(conversationId, assistantMessage.id, error);
    }
  });

export const deleteMessage = os
  .input(deleteMessageInputSchema)
  .handler(({ input }) => {
    const success = deleteMessageFromConversation(
      input.conversationId,
      input.messageId,
    );
    if (success) {
      windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);
    }
    return { success };
  });

export const broadcastSelection = os
  .input(broadcastSelectionInputSchema)
  .handler(({ input }) => {
    windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATION_SELECTED, {
      conversationId: input.conversationId,
    });
    return { success: true };
  });

export const editMessage = os
  .input(editMessageInputSchema)
  .handler(async ({ input }) => {
    const { conversationId, messageId, content } = input;

    const result = editMessageAndTruncate(conversationId, messageId, content);
    if (!result) {
      throw new Error('Message not found or conversation not found');
    }

    windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);

    const conversation = getConv(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const assistantMessage = addMessageToConversation(
      conversationId,
      'assistant',
      '',
    );
    if (!assistantMessage) {
      throw new Error('Failed to create assistant message');
    }

    const modelMessages = convertToModelMessages(conversation.messages);
    const systemPrompt = buildSystemPrompt(conversation);

    try {
      await streamAIResponse(
        conversationId,
        assistantMessage.id,
        modelMessages,
        systemPrompt,
      );

      return {
        editedMessageId: messageId,
        assistantMessageId: assistantMessage.id,
        truncatedCount: result.truncatedCount,
      };
    } catch (error) {
      broadcastError(conversationId, assistantMessage.id, error);
    }
  });

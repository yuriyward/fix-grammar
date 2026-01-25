/**
 * Chat IPC handlers
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createXai } from '@ai-sdk/xai';
import { os } from '@orpc/server';
import type { LanguageModel, ModelMessage } from 'ai';
import { streamText } from 'ai';
import { parseAIError } from '@/main/ai/error-handler';
import { getApiKey } from '@/main/storage/api-keys';
import { getLastConversationId } from '@/main/storage/context';
import {
  addMessageToConversation,
  createConversation as createConv,
  deleteConversation as deleteConv,
  getConversation as getConv,
  listConversations as listConvs,
  updateMessageContent,
} from '@/main/storage/conversations';
import { store } from '@/main/storage/settings';
import { windowManager } from '@/main/windows/window-manager';
import { AI_STREAM_TIMEOUT_MS } from '@/shared/config/ai';
import type { AIProvider } from '@/shared/config/ai-models';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type { ChatMessage, Conversation } from '@/shared/types/chat';
import { sanitizeLMStudioURL } from '@/shared/utils/url-validation';
import type { ChatStreamChunk } from './schemas';
import {
  broadcastSelectionInputSchema,
  createConversationInputSchema,
  deleteConversationInputSchema,
  getConversationInputSchema,
  sendMessageInputSchema,
} from './schemas';

const CHAT_SYSTEM_PROMPT = `You are a helpful assistant specialized in grammar and writing. You help users improve their text, answer questions about grammar and style, and provide writing assistance.

When correcting text:
- Clearly explain what changes you made and why
- Be educational but concise
- Maintain the user's voice and intent

When asked general questions, provide clear and helpful responses.`;

function buildModelInstance(
  provider: AIProvider,
  apiKey: string,
  model: string,
  lmstudioBaseURL?: string,
): LanguageModel {
  const providerFactories: Record<
    AIProvider,
    (apiKey: string, model: string, baseURL?: string) => LanguageModel
  > = {
    google: (apiKey, model) => createGoogleGenerativeAI({ apiKey })(model),
    xai: (apiKey, model) => createXai({ apiKey })(model),
    openai: (apiKey, model) => createOpenAI({ apiKey })(model),
    lmstudio: (apiKey, model, baseURL) => {
      const sanitizedURL = baseURL
        ? sanitizeLMStudioURL(baseURL)
        : 'http://localhost:1234/v1';
      return createOpenAICompatible({
        name: 'lmstudio',
        baseURL: sanitizedURL,
        apiKey: apiKey || 'not-needed',
      })(model);
    },
    openrouter: (apiKey, model) =>
      createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
        headers: {
          'HTTP-Referer': 'https://github.com/ward/automations/fix-grammar',
          'X-Title': 'Fix Grammar App',
        },
      })(model),
  };

  return providerFactories[provider](apiKey, model, lmstudioBaseURL);
}

function convertToModelMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
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

    // Add user message
    const userMessage = addMessageToConversation(
      conversationId,
      'user',
      content,
    );
    if (!userMessage) {
      throw new Error('Conversation not found');
    }

    // Get conversation for context
    const conversation = getConv(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get AI settings
    const provider = store.get('ai.provider') as AIProvider;
    const model = store.get('ai.model') as string;
    const lmstudioBaseURL = store.get('ai.lmstudioBaseURL') as
      | string
      | undefined;

    const apiKey = getApiKey(provider) || '';
    if (!apiKey && provider !== 'lmstudio') {
      throw new Error(`API key not found for provider: ${provider}`);
    }

    // Create placeholder assistant message
    const assistantMessage = addMessageToConversation(
      conversationId,
      'assistant',
      '',
    );
    if (!assistantMessage) {
      throw new Error('Failed to create assistant message');
    }

    // Build messages for AI
    const modelMessages = convertToModelMessages(conversation.messages);

    // Start streaming
    const modelInstance = buildModelInstance(
      provider,
      apiKey,
      model,
      lmstudioBaseURL,
    );

    try {
      const result = streamText({
        model: modelInstance,
        system: CHAT_SYSTEM_PROMPT,
        messages: modelMessages,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(AI_STREAM_TIMEOUT_MS),
      });

      let fullContent = '';

      // Stream chunks via IPC
      const stream = (await result).textStream;
      for await (const chunk of stream) {
        fullContent += chunk;

        const streamChunk: ChatStreamChunk = {
          conversationId,
          messageId: assistantMessage.id,
          type: 'delta',
          content: chunk,
        };

        windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, streamChunk);
      }

      // Update message with full content
      updateMessageContent(conversationId, assistantMessage.id, fullContent);

      // Send completion
      const completeChunk: ChatStreamChunk = {
        conversationId,
        messageId: assistantMessage.id,
        type: 'complete',
        content: fullContent,
      };
      windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, completeChunk);

      // Notify all windows that conversations changed (updatedAt timestamp)
      windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATIONS_CHANGED);

      return {
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
      };
    } catch (error) {
      const errorDetails = parseAIError(error);

      // Send error chunk
      const errorChunk: ChatStreamChunk = {
        conversationId,
        messageId: assistantMessage.id,
        type: 'error',
        content: errorDetails.message,
      };
      windowManager.broadcast(IPC_CHANNELS.CHAT_STREAM, errorChunk);

      throw new Error(errorDetails.message);
    }
  });

export const broadcastSelection = os
  .input(broadcastSelectionInputSchema)
  .handler(({ input }) => {
    windowManager.broadcast(IPC_CHANNELS.CHAT_CONVERSATION_SELECTED, {
      conversationId: input.conversationId,
    });
    return { success: true };
  });

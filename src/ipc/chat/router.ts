/**
 * Chat domain router
 */
import {
  broadcastSelection,
  createConversation,
  deleteConversation,
  getConversation,
  getLastConversationIdHandler,
  listConversationsHandler,
  sendMessage,
} from './handlers';

export const chat = {
  createConversation,
  getConversation,
  listConversations: listConversationsHandler,
  getLastConversationId: getLastConversationIdHandler,
  deleteConversation,
  sendMessage,
  broadcastSelection,
};

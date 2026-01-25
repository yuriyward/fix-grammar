/**
 * Chat domain router
 */
import {
  broadcastSelection,
  createConversation,
  deleteConversation,
  deleteMessage,
  editMessage,
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
  deleteMessage,
  sendMessage,
  editMessage,
  broadcastSelection,
};

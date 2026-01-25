/**
 * Chat domain router
 */
import {
  broadcastSelection,
  createConversation,
  deleteConversation,
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
  sendMessage,
  editMessage,
  broadcastSelection,
};

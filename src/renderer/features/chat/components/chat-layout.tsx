/**
 * Full chat layout with sidebar, messages, and input
 */
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { deleteConversation } from '@/actions/chat';
import { useChat } from '../hooks/use-chat';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ChatSidebar } from './chat-sidebar';

export function ChatLayout() {
  const navigate = useNavigate();
  const {
    messages,
    context,
    isLoading,
    error,
    conversationId,
    conversations,
    editingMessageId,
    send,
    deleteMessage,
    loadConversation,
    clearConversation,
    refreshConversations,
    startEdit,
    cancelEdit,
    submitEdit,
  } = useChat();

  // Auto-load the latest conversation on mount
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (!hasAutoLoaded.current && conversations.length > 0 && !conversationId) {
      const latestConversation = conversations[0];
      if (latestConversation) {
        loadConversation(latestConversation.id);
        hasAutoLoaded.current = true;
      }
    }
  }, [conversations, conversationId, loadConversation]);

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (id === conversationId) {
      clearConversation();
      // Load the next available conversation
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0 && remaining[0]) {
        loadConversation(remaining[0].id);
      }
    }
    await refreshConversations();
  };

  return (
    <div className="flex h-full">
      <ChatSidebar
        conversations={conversations}
        selectedId={conversationId}
        onSelect={loadConversation}
        onNew={clearConversation}
        onDelete={handleDelete}
        onSettings={() => navigate({ to: '/settings' })}
        onSkills={() => navigate({ to: '/skills' })}
      />

      <div className="flex flex-1 flex-col">
        <ChatMessages
          messages={messages}
          context={context}
          isLoading={isLoading}
          editingMessageId={editingMessageId}
          onDeleteMessage={deleteMessage}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSubmitEdit={submitEdit}
        />

        {error && (
          <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <ChatInput
          onSend={send}
          isLoading={isLoading}
          placeholder="Ask me to help improve your writing..."
        />
      </div>
    </div>
  );
}

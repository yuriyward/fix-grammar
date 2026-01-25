/**
 * Simplified popup chat component (messages + input only)
 */
import { useEffect, useState } from 'react';
import { getLastConversationId } from '@/actions/chat';
import { useChat } from '../hooks/use-chat';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

interface PopupChatProps {
  conversationId?: string;
}

export function PopupChat({
  conversationId: initialConversationId,
}: PopupChatProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId,
  );

  // Load the last conversation on mount if no conversationId provided
  useEffect(() => {
    if (!initialConversationId) {
      getLastConversationId().then((id) => {
        if (id) setConversationId(id);
      });
    }
  }, [initialConversationId]);

  const {
    messages,
    context,
    isLoading,
    error,
    editingMessageId,
    send,
    loadConversation,
    startEdit,
    cancelEdit,
    submitEdit,
  } = useChat(conversationId ? { conversationId } : {});

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  return (
    <div className="flex h-full flex-col">
      <ChatMessages
        messages={messages}
        context={context}
        isLoading={isLoading}
        className="flex-1"
        editingMessageId={editingMessageId}
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
        placeholder="Enter your instruction..."
      />
    </div>
  );
}

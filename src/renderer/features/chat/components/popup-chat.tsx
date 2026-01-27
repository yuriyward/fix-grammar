/**
 * Simplified popup chat component (messages + input only)
 */
import { useCallback, useEffect, useState } from 'react';
import { getLastConversationId } from '@/actions/chat';
import { getSettings, updateSettings } from '@/actions/settings';
import { SkillSelector } from '@/renderer/components/skill-selector';
import { useChatStore } from '@/renderer/stores/chat-store';
import type { AppSettings } from '@/shared/types/settings';
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
  const [skillId, setSkillId] = useState('');
  const [settingsSnapshot, setSettingsSnapshot] = useState<AppSettings | null>(
    null,
  );

  // Load settings + last conversation on mount
  useEffect(() => {
    getSettings().then((s) => {
      setSkillId(s.ai.defaultSkillId);
      setSettingsSnapshot(s);
    });

    if (!initialConversationId) {
      getLastConversationId().then((id) => {
        if (id) setConversationId(id);
      });
    }
  }, [initialConversationId]);

  const handleSkillChange = useCallback(
    (newSkillId: string) => {
      setSkillId(newSkillId);
      // Persist so the keyboard shortcut uses this skill
      if (settingsSnapshot) {
        const updated = {
          ...settingsSnapshot,
          ai: { ...settingsSnapshot.ai, defaultSkillId: newSkillId },
        };
        setSettingsSnapshot(updated);
        updateSettings(updated);
      }
      // New skill = new conversation
      setConversationId(undefined);
      useChatStore.getState().selectConversation(null);
    },
    [settingsSnapshot],
  );

  const {
    messages,
    context,
    isLoading,
    error,
    editingMessageId,
    send,
    deleteMessage,
    startEdit,
    cancelEdit,
    submitEdit,
  } = useChat(conversationId ? { conversationId } : {});

  useEffect(() => {
    if (conversationId) {
      useChatStore.getState().selectConversation(conversationId);
    }
  }, [conversationId]);

  return (
    <div className="flex h-full flex-col">
      <div
        className="draglayer flex items-center gap-2 border-b px-2 py-1.5"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          className="flex-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {skillId && (
            <SkillSelector
              value={skillId}
              onValueChange={handleSkillChange}
              size="sm"
            />
          )}
        </div>
      </div>

      <ChatMessages
        messages={messages}
        context={context}
        isLoading={isLoading}
        className="flex-1"
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
        placeholder="Enter your instruction..."
      />
    </div>
  );
}

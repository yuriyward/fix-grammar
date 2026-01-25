/**
 * Chat messages display component using AI SDK Elements
 */
import { Bot, Check, ChevronRight, Copy, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/renderer/components/ai-elements/conversation';
import { Loader } from '@/renderer/components/ai-elements/loader';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/renderer/components/ai-elements/message';
import { Button } from '@/renderer/components/ui/button';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';
import { Textarea } from '@/renderer/components/ui/textarea';
import { cn } from '@/renderer/lib/tailwind';
import type { ConversationContext } from '@/renderer/stores/chat-store';
import { ROLE_PROMPTS } from '@/shared/config/prompts';
import type { ChatMessage } from '@/shared/types/chat';

interface MessageEditFormProps {
  initialContent: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}

function MessageEditForm({
  initialContent,
  onSubmit,
  onCancel,
}: MessageEditFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      await onSubmit(content.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-20 w-full resize-none"
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!content.trim()}>
          Save & Submit
        </Button>
      </div>
    </form>
  );
}

function useCopyMessage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return { copiedId, copy };
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  context?: ConversationContext | null;
  editingMessageId?: string | null;
  onDeleteMessage?: (messageId: string) => void;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: (content: string) => Promise<void>;
}

export function ChatMessages({
  messages,
  isLoading,
  className,
  context,
  editingMessageId,
  onDeleteMessage,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
}: ChatMessagesProps) {
  const { copiedId, copy } = useCopyMessage();

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1', className)}>
        <ConversationEmptyState
          icon={<Bot className="size-12 opacity-50" />}
          title="Start a conversation"
          description="Ask me to help improve your writing"
        />
      </div>
    );
  }

  return (
    <Conversation className={cn('flex-1', className)}>
      <ConversationContent>
        {context && (
          <Collapsible defaultOpen={false} className="-mb-4">
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronRight className="size-3 transition-transform [[data-open]_&]:rotate-90" />
              <span>
                Context
                {context.sourceApp ? ` (${context.sourceApp})` : ''}
              </span>
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
                {ROLE_PROMPTS[context.sourceRole]}
              </div>
            </CollapsiblePanel>
          </Collapsible>
        )}
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            {message.role === 'user' &&
            editingMessageId === message.id &&
            onSubmitEdit &&
            onCancelEdit ? (
              <MessageEditForm
                initialContent={message.content}
                onSubmit={onSubmitEdit}
                onCancel={onCancelEdit}
              />
            ) : (
              <div className="relative">
                <MessageContent>
                  <MessageResponse>{message.content}</MessageResponse>
                </MessageContent>
                {!isLoading && (
                  <MessageActions
                    className={cn(
                      'absolute -bottom-7 opacity-0 transition-opacity group-hover:opacity-100',
                      message.role === 'user' ? 'right-0' : 'left-0',
                    )}
                  >
                    {message.role === 'user' && onStartEdit && (
                      <MessageAction
                        tooltip="Edit message"
                        onClick={() => onStartEdit(message.id)}
                      >
                        <Pencil className="size-3.5" />
                      </MessageAction>
                    )}
                    <MessageAction
                      tooltip={copiedId === message.id ? 'Copied!' : 'Copy'}
                      onClick={() => copy(message.id, message.content)}
                    >
                      {copiedId === message.id ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </MessageAction>
                    {onDeleteMessage && (
                      <MessageAction
                        tooltip="Delete message"
                        onClick={() => onDeleteMessage(message.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </MessageAction>
                    )}
                  </MessageActions>
                )}
              </div>
            )}
          </Message>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader size={16} />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

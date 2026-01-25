/**
 * Chat messages display component using AI SDK Elements
 */
import { Bot } from 'lucide-react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/renderer/components/ai-elements/conversation';
import { Loader } from '@/renderer/components/ai-elements/loader';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/renderer/components/ai-elements/message';
import { cn } from '@/renderer/lib/tailwind';
import type { ChatMessage } from '@/shared/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

export function ChatMessages({
  messages,
  isLoading,
  className,
}: ChatMessagesProps) {
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
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              <MessageResponse>{message.content}</MessageResponse>
            </MessageContent>
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

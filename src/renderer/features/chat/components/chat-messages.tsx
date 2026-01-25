/**
 * Chat messages display component using AI SDK Elements
 */
import { Bot, ChevronRight } from 'lucide-react';
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
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@/renderer/components/ui/collapsible';
import { cn } from '@/renderer/lib/tailwind';
import type { ConversationContext } from '@/renderer/stores/chat-store';
import type { ChatMessage } from '@/shared/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
  context?: ConversationContext | null;
}

export function ChatMessages({
  messages,
  isLoading,
  className,
  context,
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
        {context && (
          <Collapsible defaultOpen={false} className="-mb-4">
            <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronRight className="size-3 transition-transform [[data-open]_&]:rotate-90" />
              <span>
                Original context
                {context.sourceApp ? ` (${context.sourceApp})` : ''}
              </span>
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="mt-2 rounded-md border bg-muted/30 p-3 text-xs">
                <div className="mb-1 font-medium text-muted-foreground">
                  Role:{' '}
                  {context.sourceRole === 'grammar'
                    ? 'Grammar only'
                    : 'Grammar + tone'}
                </div>
                <div className="max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {context.sourceText}
                </div>
              </div>
            </CollapsiblePanel>
          </Collapsible>
        )}
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

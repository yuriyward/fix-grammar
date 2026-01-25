/**
 * Chat messages display component
 */
import { Bot, User } from 'lucide-react';
import { memo, useLayoutEffect, useRef } from 'react';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { cn } from '@/renderer/lib/tailwind';
import type { ChatMessage } from '@/shared/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  className?: string;
}

const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  );
});

function LoadingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="size-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-foreground/40" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Bot className="size-12 opacity-50" />
      <div className="text-center">
        <p className="text-lg font-medium">Start a conversation</p>
        <p className="text-sm">Ask me to help improve your writing</p>
      </div>
    </div>
  );
}

export function ChatMessages({
  messages,
  isLoading,
  className,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom after DOM updates
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex-1', className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div ref={scrollRef} className="flex flex-col py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <LoadingIndicator />
        )}
      </div>
    </ScrollArea>
  );
}

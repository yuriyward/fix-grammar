/**
 * Chat sidebar with conversation list
 */
import { MessageSquare, Plus, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import { cn } from '@/renderer/lib/tailwind';
import type { ConversationSummary } from '@/shared/types/chat';

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  className?: string;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onSettings,
  className,
}: ChatSidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-muted/30',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4" />
          Conversations
        </h2>
        <Button onClick={onNew} size="icon-xs" variant="ghost">
          <Plus className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              // biome-ignore lint/a11y/useSemanticElements: Using div with role="button" to allow nested interactive content (delete button)
              <div
                key={conv.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedId === conv.id && 'bg-accent',
                )}
                onClick={() => onSelect(conv.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv.id);
                  }
                }}
              >
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(conv.updatedAt)} · {conv.messageCount} messages
                  </p>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  size="icon-xs"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-2">
        <Button
          onClick={onSettings}
          variant="ghost"
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Settings className="size-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}

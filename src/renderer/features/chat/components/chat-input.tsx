/**
 * Chat input component using AI SDK Elements
 */
import { PromptInput } from '@/renderer/components/ai-elements/prompt-input';
import {
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/renderer/components/ai-elements/prompt-input-parts';
import { cn } from '@/renderer/lib/tailwind';

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  isLoading,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  return (
    <PromptInput
      onSubmit={(message) => {
        if (message.text.trim()) {
          onSend(message.text.trim());
        }
      }}
      className={cn('border-t bg-background p-4', className)}
    >
      <PromptInputTextarea
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-10"
      />
      <PromptInputSubmit
        status={isLoading ? 'streaming' : 'ready'}
        className="absolute bottom-2 right-2"
      />
    </PromptInput>
  );
}

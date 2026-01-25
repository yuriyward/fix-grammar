/**
 * Chat input component with textarea and send button
 */
import { Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Textarea } from '@/renderer/components/ui/textarea';
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
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('flex gap-2 border-t bg-background p-4', className)}>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-10 flex-1 resize-none"
      />
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        size="icon"
        className="shrink-0 self-end"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );
}

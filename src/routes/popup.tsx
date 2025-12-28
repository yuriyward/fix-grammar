/**
 * Popup chat route component
 */
import { createFileRoute } from '@tanstack/react-router';
import { Send } from 'lucide-react';
import { useState } from 'react';
import DragWindowRegion from '@/renderer/components/drag-window-region';
import { Button } from '@/renderer/components/ui/button';
import { Textarea } from '@/renderer/components/ui/textarea';

function PopupPage() {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!instruction.trim()) return;

    setIsProcessing(true);
    try {
      // TODO: Implement follow-up rewrite using last edit context
      // This will require an IPC handler to get the last edit and apply a follow-up rewrite
      console.log('Follow-up instruction:', instruction);
      alert('Follow-up rewrite not yet implemented');
    } finally {
      setIsProcessing(false);
      setInstruction('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion title="Grammar Copilot" />

      {/* Input area */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your instruction..."
          disabled={isProcessing}
          className="flex-1 resize-none"
        />
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || !instruction.trim()}
          className="self-end"
        >
          <Send className="mr-2 size-4" />
          {isProcessing ? 'Processing...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/popup')({
  component: PopupPage,
});

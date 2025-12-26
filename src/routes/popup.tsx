/**
 * Popup chat route component
 */
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
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

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Last Edit Follow-up</h2>
        <p className="text-muted-foreground text-sm">
          Enter instructions to refine the last rewrite
        </p>
      </div>

      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g., Make it more formal..."
        className="mb-4 flex-1"
        disabled={isProcessing}
      />

      <Button
        onClick={handleSubmit}
        disabled={isProcessing || !instruction.trim()}
      >
        {isProcessing ? 'Processing...' : 'Apply'}
      </Button>
    </div>
  );
}

export const Route = createFileRoute('/popup')({
  component: PopupPage,
});

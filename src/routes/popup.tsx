/**
 * Popup chat route component
 */
import { createFileRoute } from '@tanstack/react-router';
import { PopupChat } from '@/renderer/features/chat/components/popup-chat';

function PopupPage() {
  return <PopupChat />;
}

export const Route = createFileRoute('/popup')({
  component: PopupPage,
});

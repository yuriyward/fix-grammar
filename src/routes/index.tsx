/**
 * Main chat page route component
 */
import { createFileRoute } from '@tanstack/react-router';
import { ChatLayout } from '@/renderer/features/chat/components/chat-layout';

function MainPage() {
  return <ChatLayout />;
}

export const Route = createFileRoute('/')({
  component: MainPage,
});

/**
 * Base layout with title bar region
 */
import type React from 'react';
import DragWindowRegion from '@/renderer/components/drag-window-region';

export default function BaseLayout({
  children,
  title = 'electron-shadcn-ai',
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
}) {
  return (
    <>
      <DragWindowRegion title={title} />
      <main className="h-screen p-2 pb-8">{children}</main>
    </>
  );
}

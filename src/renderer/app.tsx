/**
 * React application root and mounting
 */
import { RouterProvider } from '@tanstack/react-router';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { updateAppLanguage } from '@/actions/language';
import { syncWithLocalTheme } from '@/actions/theme';
import { ErrorBoundary } from '@/renderer/components/error-boundary';
import { ToastProvider } from '@/renderer/components/ui/toast';
import { useNotificationListener } from '@/renderer/hooks/use-notification-listener';
import { router } from '@/renderer/lib/routes';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import '@/renderer/lib/i18n';

/**
 * Root React component for the application.
 */
export default function App() {
  const { i18n } = useTranslation();

  useNotificationListener();

  useEffect(() => {
    syncWithLocalTheme();
    updateAppLanguage(i18n);
  }, [i18n]);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const to = (event as CustomEvent<string>).detail;
      void router.navigate({ to });
    };

    window.addEventListener(IPC_CHANNELS.NAVIGATE, onNavigate);
    return () => {
      window.removeEventListener(IPC_CHANNELS.NAVIGATE, onNavigate);
    };
  }, []);

  return (
    <ToastProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ToastProvider>
  );
}

/**
 * Mount the React application to the DOM.
 */
export function mountApp() {
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('Root element with id "app" not found in the document');
  }
  const root = createRoot(appElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// Auto-mount when this module is imported
mountApp();

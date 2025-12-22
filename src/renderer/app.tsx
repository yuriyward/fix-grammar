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
import { router } from '@/renderer/lib/routes';
import '@/renderer/lib/i18n';

/**
 * Root React component for the application.
 */
export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    syncWithLocalTheme();
    updateAppLanguage(i18n);
  }, [i18n]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
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

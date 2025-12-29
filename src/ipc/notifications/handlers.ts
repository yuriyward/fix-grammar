/**
 * Notifications IPC handlers
 */
import { os } from '@orpc/server';
import { readClipboard, writeClipboard } from '@/main/automation/clipboard';
import { simulatePaste } from '@/main/automation/keyboard';
import { switchToApp } from '@/main/shortcuts/app-context';
import { getEditContext } from '@/main/storage/context';
import {
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/main/storage/notifications';
import { applyFixSchema, notificationIdSchema } from './schemas';

export const listNotificationsHandler = os.handler(() => {
  return { notifications: listNotifications() };
});

export const markNotificationReadHandler = os
  .input(notificationIdSchema)
  .handler(({ input }) => {
    markNotificationRead(input.id);
    return { success: true };
  });

export const markAllNotificationsReadHandler = os.handler(() => {
  markAllNotificationsRead();
  return { success: true };
});

export const clearNotificationsHandler = os.handler(() => {
  clearNotifications();
  return { success: true };
});

export const applyFixHandler = os
  .input(applyFixSchema)
  .handler(async ({ input }) => {
    const context = getEditContext(input.contextId);

    if (!context) {
      throw new Error('Fix context not found');
    }

    // Switch to source app if available
    if (context.sourceApp) {
      try {
        await switchToApp(context.sourceApp);
        // Small delay for app switch to complete
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        throw new Error(
          `Failed to switch to app "${context.sourceApp.name}": ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    // Paste the fix using the same logic as direct paste
    const SAFE_RESTORE_WINDOW_MS = 500;
    const clipboardBeforePaste = readClipboard();
    const pasteStartedAt = Date.now();

    try {
      writeClipboard(context.rewrittenText);
      await simulatePaste();
    } finally {
      const elapsed = Date.now() - pasteStartedAt;
      if (
        elapsed < SAFE_RESTORE_WINDOW_MS &&
        readClipboard() === context.rewrittenText
      ) {
        writeClipboard(clipboardBeforePaste);
      }
    }

    // Mark notification as read
    markNotificationRead(input.contextId);

    return { success: true };
  });

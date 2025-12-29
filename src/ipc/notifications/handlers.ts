/**
 * Notifications IPC handlers
 */
import { os } from '@orpc/server';
import { Notification } from 'electron';
import {
  readClipboard,
  SAFE_RESTORE_WINDOW_MS,
  writeClipboard,
} from '@/main/automation/clipboard';
import { simulatePaste } from '@/main/automation/keyboard';
import { switchToApp } from '@/main/shortcuts/app-context';
import { getEditContext } from '@/main/storage/context';
import {
  addNotification,
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/main/storage/notifications';
import { windowManager } from '@/main/windows/window-manager';
import { getModelLabel } from '@/shared/config/ai-models';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AppNotification,
  AppNotificationPayload,
} from '@/shared/types/notifications';
import { applyFixSchema, notificationIdSchema } from './schemas';

function sendInAppNotification(notification: AppNotification): void {
  windowManager.broadcast(IPC_CHANNELS.NOTIFY, notification);
}

function showNotification(payload: AppNotificationPayload): void {
  const stored = addNotification(payload);
  const osNotification = new Notification({
    title: stored.title,
    body: stored.description,
  });
  osNotification.show();
  sendInAppNotification(stored);
}

function formatDurationMs(durationMs: number): string {
  const clampedMs = Math.max(0, durationMs);
  if (clampedMs < 10_000) return `${(clampedMs / 1000).toFixed(1)}s`;

  const totalSeconds = Math.round(clampedMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
}

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
        // Allow time for app activation to complete
        const APP_SWITCH_DELAY_MS = 300;
        await new Promise((resolve) =>
          setTimeout(resolve, APP_SWITCH_DELAY_MS),
        );
      } catch (error) {
        throw new Error(
          `Failed to switch to app "${context.sourceApp.name}": ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    // Paste the fix using the same logic as direct paste
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

    const elapsedToPasteMs = Date.now() - context.startedAt;
    const modelLabel = getModelLabel(context.provider, context.model);
    showNotification({
      type: 'success',
      title: 'Grammar Copilot',
      description: `Text rewritten and pasted (${modelLabel}, ${formatDurationMs(
        elapsedToPasteMs,
      )})`,
    });

    // Mark notification as read
    markNotificationRead(input.contextId);

    return { success: true };
  });

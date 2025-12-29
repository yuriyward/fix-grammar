/**
 * Notification utilities for main process
 */
import { Notification } from 'electron';
import { addNotification } from '@/main/storage/notifications';
import { windowManager } from '@/main/windows/window-manager';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AppNotification,
  AppNotificationPayload,
} from '@/shared/types/notifications';

function sendInAppNotification(notification: AppNotification): void {
  windowManager.broadcast(IPC_CHANNELS.NOTIFY, notification);
}

export function showNotification(payload: AppNotificationPayload): void {
  const stored = addNotification(payload);
  const osNotification = new Notification({
    title: stored.title,
    body: stored.description,
  });
  osNotification.show();
  sendInAppNotification(stored);
}

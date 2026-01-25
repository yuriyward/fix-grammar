/**
 * Notifications IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { AppNotification } from '@/shared/types/notifications';

export async function listNotifications(): Promise<AppNotification[]> {
  const result = await ipc.client.notifications.list();
  return result.notifications;
}

export async function markNotificationRead(id: string): Promise<void> {
  await ipc.client.notifications.markRead({ id });
}

export async function markAllNotificationsRead(): Promise<void> {
  await ipc.client.notifications.markAllRead();
}

export async function clearNotifications(): Promise<void> {
  await ipc.client.notifications.clear();
}

export async function applyFix(contextId: string): Promise<void> {
  await ipc.client.notifications.applyFix({ contextId });
}

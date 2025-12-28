/**
 * Notifications IPC handlers
 */
import { os } from '@orpc/server';
import {
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/main/storage/notifications';
import { notificationIdSchema } from './schemas';

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

/**
 * Notifications domain router
 */
import {
  applyFixHandler,
  clearNotificationsHandler,
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from './handlers';

export const notifications = {
  list: listNotificationsHandler,
  markRead: markNotificationReadHandler,
  markAllRead: markAllNotificationsReadHandler,
  clear: clearNotificationsHandler,
  applyFix: applyFixHandler,
};

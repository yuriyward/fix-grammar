/**
 * Permissions domain router
 */
import {
  getPermissionsStatusHandler,
  requestAccessibilityAccessHandler,
  showTestNotificationHandler,
} from './handlers';

export const permissions = {
  getStatus: getPermissionsStatusHandler,
  requestAccessibilityAccess: requestAccessibilityAccessHandler,
  showTestNotification: showTestNotificationHandler,
};

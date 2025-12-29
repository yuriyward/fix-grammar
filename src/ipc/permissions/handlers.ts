/**
 * Permissions IPC handlers
 */
import { os } from '@orpc/server';
import { Notification, systemPreferences } from 'electron';
import { requestAccessibilityAccessSchema } from './schemas';

function isAccessibilityTrusted(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}

export const getPermissionsStatusHandler = os.handler(() => {
  return {
    platform: process.platform,
    accessibilityTrusted: isAccessibilityTrusted(),
    notificationsSupported: Notification.isSupported(),
  };
});

export const requestAccessibilityAccessHandler = os
  .input(requestAccessibilityAccessSchema)
  .handler(({ input }) => {
    if (process.platform !== 'darwin') {
      return { accessibilityTrusted: true };
    }

    const accessibilityTrusted = systemPreferences.isTrustedAccessibilityClient(
      input.prompt,
    );
    return { accessibilityTrusted };
  });

export const showTestNotificationHandler = os.handler(() => {
  const notification = new Notification({
    title: 'Grammar Copilot',
    body: 'Test notification',
  });
  notification.show();
  return { shown: true };
});

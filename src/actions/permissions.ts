/**
 * Permissions IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export interface PermissionsStatus {
  platform: NodeJS.Platform;
  accessibilityTrusted: boolean;
  notificationsSupported: boolean;
}

export async function getPermissionsStatus(): Promise<PermissionsStatus> {
  return ipc.client.permissions.getStatus();
}

export async function requestAccessibilityAccess(
  prompt = true,
): Promise<{ accessibilityTrusted: boolean }> {
  return ipc.client.permissions.requestAccessibilityAccess({ prompt });
}

export async function showTestNotification(): Promise<{ shown: boolean }> {
  return ipc.client.permissions.showTestNotification();
}

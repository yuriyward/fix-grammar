/**
 * App info IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export function getPlatform() {
  return ipc.client.app.currentPlatfom();
}

export function getAppVersion() {
  return ipc.client.app.appVersion();
}

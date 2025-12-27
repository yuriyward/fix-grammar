/**
 * Shortcuts IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export async function reregisterShortcuts(): Promise<{ success: boolean }> {
  return ipc.client.shortcuts.reregisterShortcuts();
}

export async function unregisterAllShortcuts(): Promise<{ success: boolean }> {
  return ipc.client.shortcuts.unregisterAllShortcuts();
}

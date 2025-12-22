/**
 * Window control IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export async function minimizeWindow() {
  await ipc.client.window.minimizeWindow();
}
export async function maximizeWindow() {
  await ipc.client.window.maximizeWindow();
}
export async function closeWindow() {
  await ipc.client.window.closeWindow();
}

/**
 * Shell operations IPC wrapper for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export function openExternalLink(url: string) {
  return ipc.client.shell.openExternalLink({ url });
}

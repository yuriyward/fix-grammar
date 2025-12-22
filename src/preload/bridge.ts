/**
 * IPC bridge via contextBridge
 */
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';

/**
 * Setup the preload bridge for IPC communication.
 * This handles the message port forwarding from renderer to main process.
 */
export function setupBridge() {
  window.addEventListener('message', (event) => {
    if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
      const [serverPort] = event.ports;

      ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [
        serverPort,
      ]);
    }
  });
}

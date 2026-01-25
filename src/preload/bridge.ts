/**
 * IPC bridge via contextBridge
 */
import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AutomationCalibrationFocusRequest,
  AutomationCalibrationFocusResponse,
} from '@/shared/types/automation';
import type { AppNotification } from '@/shared/types/notifications';

/**
 * Setup the preload bridge for IPC communication.
 *
 * We keep `contextIsolation: true`, so the renderer cannot access `ipcRenderer` directly.
 * For one-way main→renderer broadcasts (e.g. `NAVIGATE`, `NOTIFY`) we forward IPC events
 * into the isolated world as DOM `CustomEvent`s on `window`, which the renderer can
 * subscribe to safely.
 *
 * Separately, we forward the oRPC `MessagePort` from renderer → main to establish the
 * request/response IPC channel.
 */
export function setupBridge() {
  ipcRenderer.on(IPC_CHANNELS.NAVIGATE, (_event, to: string) => {
    window.dispatchEvent(
      new CustomEvent<string>(IPC_CHANNELS.NAVIGATE, { detail: to }),
    );
  });

  // `NOTIFY` is pushed from main (e.g. global shortcut handlers) and must be bridged here
  // because the renderer listens via `window.addEventListener(IPC_CHANNELS.NOTIFY, ...)`
  // and cannot receive `ipcRenderer.on(...)` events directly under `contextIsolation`.
  ipcRenderer.on(IPC_CHANNELS.NOTIFY, (_event, payload: AppNotification) => {
    window.dispatchEvent(
      new CustomEvent<AppNotification>(IPC_CHANNELS.NOTIFY, {
        detail: payload,
      }),
    );
  });

  ipcRenderer.on(IPC_CHANNELS.OPEN_NOTIFICATIONS, () => {
    window.dispatchEvent(
      new CustomEvent<void>(IPC_CHANNELS.OPEN_NOTIFICATIONS),
    );
  });

  ipcRenderer.on(
    IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
    (_event, payload: AutomationCalibrationFocusRequest) => {
      window.dispatchEvent(
        new CustomEvent<AutomationCalibrationFocusRequest>(
          IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
          {
            detail: payload,
          },
        ),
      );
    },
  );

  window.addEventListener(
    IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
    (event) => {
      const payload = (event as CustomEvent<AutomationCalibrationFocusResponse>)
        .detail;
      ipcRenderer.send(
        IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
        payload,
      );
    },
  );

  window.addEventListener('message', (event) => {
    if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
      const [serverPort] = event.ports;

      if (!serverPort) return;

      ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [
        serverPort,
      ]);
    }
  });
}

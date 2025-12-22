/**
 * IPC context with main window reference
 */
import { ORPCError, os } from '@orpc/server';
import type { BrowserWindow } from 'electron';

class IPCContext {
  public mainWindow: BrowserWindow | undefined;

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Returns true if the main window is set and ready for use.
   */
  public isMainWindowReady(): boolean {
    return this.mainWindow !== undefined;
  }

  /**
   * Middleware that provides the main window context to IPC handlers.
   * Instead of throwing a raw Error that could crash the main process,
   * this throws an ORPCError which is properly handled by the oRPC framework
   * and returned as a structured error response to the renderer.
   */
  public get mainWindowContext() {
    return os.middleware(({ next }) => {
      if (!this.mainWindow) {
        console.warn(
          '[IPC Context] Main window accessed before initialization. ' +
            'Ensure setMainWindow() is called during app startup.',
        );
        throw new ORPCError('PRECONDITION_FAILED', {
          message:
            'Main window is not available. The application may still be initializing.',
        });
      }

      return next({
        context: {
          window: this.mainWindow,
        },
      });
    });
  }
}

export const ipcContext = new IPCContext();

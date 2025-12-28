/**
 * IPC context with main window reference and window manager
 */
import { ORPCError, os } from '@orpc/server';
import type { BrowserWindow } from 'electron';
import type { WindowManager } from '@/main/windows/window-manager';

class IPCContext {
  public mainWindow: BrowserWindow | undefined;
  public windowManager: WindowManager | undefined;

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  public setWindowManager(manager: WindowManager) {
    this.windowManager = manager;
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

  /**
   * Middleware that provides the sender window context to IPC handlers.
   * This allows window control operations to work on the actual calling window
   * rather than always operating on the main window.
   */
  public get senderWindowContext() {
    return os.middleware(({ next, context }) => {
      const senderWindow = (context as { senderWindow?: BrowserWindow })
        .senderWindow;

      if (!senderWindow) {
        console.warn(
          '[IPC Context] Sender window not found in context. ' +
            'Ensure the connection upgrade includes senderWindow.',
        );
        throw new ORPCError('PRECONDITION_FAILED', {
          message: 'Sender window is not available.',
        });
      }

      return next({
        context: {
          window: senderWindow,
        },
      });
    });
  }
}

export const ipcContext = new IPCContext();

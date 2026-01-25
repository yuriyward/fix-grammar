/**
 * Centralized window lifecycle management
 */
import path from 'node:path';
import { app, BrowserWindow, type Session, screen } from 'electron';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';

const inDevelopment = process.env.NODE_ENV === 'development';

export class WindowManager {
  public mainWindow: BrowserWindow | null = null;
  private popupWindow: BrowserWindow | null = null;
  private sessionsWithCsp = new WeakSet<Session>();

  private getCspValue(): string {
    const directives = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      inDevelopment
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        : "script-src 'self'",
      inDevelopment ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
    ];

    return `${directives.join('; ')};`;
  }

  private ensureCsp(session: Session): void {
    if (this.sessionsWithCsp.has(session)) return;
    this.sessionsWithCsp.add(session);

    const cspValue = this.getCspValue();

    session.webRequest.onHeadersReceived((details, callback) => {
      if (
        !details.url.startsWith('http://') &&
        !details.url.startsWith('https://')
      ) {
        callback({ responseHeaders: details.responseHeaders ?? {} });
        return;
      }

      if (
        details.resourceType !== 'mainFrame' &&
        details.resourceType !== 'subFrame'
      ) {
        callback({ responseHeaders: details.responseHeaders ?? {} });
        return;
      }

      const responseHeaders = details.responseHeaders ?? {};
      const hasCsp = Object.keys(responseHeaders).some(
        (headerName) => headerName.toLowerCase() === 'content-security-policy',
      );

      if (hasCsp) {
        callback({ responseHeaders });
        return;
      }

      callback({
        responseHeaders: {
          ...responseHeaders,
          'Content-Security-Policy': [cspValue],
        },
      });
    });
  }

  /**
   * Broadcast a message to all visible, non-destroyed windows.
   *
   * This is the correct pattern for one-way main→renderer broadcasts (e.g., notifications,
   * navigation commands). oRPC is designed for request/response and cannot push messages
   * unprompted from main to renderer.
   *
   * Handles the edge case where webContents is still loading by deferring the send.
   */
  broadcast(channel: string, ...args: unknown[]): void {
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) continue;
      if (!window.isVisible()) continue;
      this.sendToWindow(window, channel, ...args);
    }
  }

  /**
   * Send a message to a specific window, handling the loading state edge case.
   */
  private sendToWindow(
    targetWindow: BrowserWindow,
    channel: string,
    ...args: unknown[]
  ): void {
    if (targetWindow.isDestroyed()) return;

    const send = () => {
      if (targetWindow.isDestroyed()) return;
      targetWindow.webContents.send(channel, ...args);
    };

    if (targetWindow.webContents.isLoading()) {
      targetWindow.webContents.once('did-finish-load', send);
      return;
    }

    send();
  }

  navigateMainWindow(to: string): void {
    if (!this.mainWindow) return;
    this.sendToWindow(this.mainWindow, IPC_CHANNELS.NAVIGATE, to);
  }

  navigatePopupWindow(to: string): void {
    if (!this.popupWindow) return;
    this.sendToWindow(this.popupWindow, IPC_CHANNELS.NAVIGATE, to);
  }

  openNotificationCenter(): void {
    this.showMainWindow();
    if (!this.mainWindow) return;
    this.sendToWindow(this.mainWindow, IPC_CHANNELS.OPEN_NOTIFICATIONS);
  }

  createMainWindow(): BrowserWindow {
    const preload = path.join(__dirname, 'preload.js');
    const isMacOS = process.platform === 'darwin';

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      show: false, // Hidden by default for tray-first app
      webPreferences: {
        devTools: inDevelopment,
        contextIsolation: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: false,
        sandbox: true,
        preload: preload,
      },
      titleBarStyle: isMacOS ? 'hiddenInset' : 'hidden',
    };

    if (isMacOS) {
      windowOptions.trafficLightPosition = { x: 5, y: 5 };
    }

    this.mainWindow = new BrowserWindow(windowOptions);

    this.ensureCsp(this.mainWindow.webContents.session);

    // Prevent window from showing automatically
    this.mainWindow.once('ready-to-show', () => {
      // Don't automatically show - wait for user to open from tray
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      );
    }

    // Hide window instead of closing for tray apps
    this.mainWindow.on('close', (event) => {
      if (!this.mainWindow) return;

      event.preventDefault();
      this.hideMainWindow();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  showMainWindow(): void {
    if (!this.mainWindow) {
      this.createMainWindow();
    }
    // Show dock icon when showing main window on macOS
    if (process.platform === 'darwin') {
      app.dock?.show();
    }
    this.mainWindow?.show();
    this.mainWindow?.focus();
  }

  hideMainWindow(): void {
    this.mainWindow?.hide();
    // Hide dock icon when hiding main window on macOS
    if (process.platform === 'darwin') {
      app.dock?.hide();
    }
  }

  createOrFocusPopupAtCursor(): void {
    if (this.popupWindow) {
      this.popupWindow.focus();
      return;
    }

    // Get cursor position
    const cursorPoint = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursorPoint);
    const workArea = display.workArea;

    // Calculate popup position near cursor, clamped to screen bounds
    const popupWidth = 400;
    const popupHeight = 300;
    const x = Math.max(
      workArea.x,
      Math.min(cursorPoint.x + 10, workArea.x + workArea.width - popupWidth),
    );
    const y = Math.max(
      workArea.y,
      Math.min(cursorPoint.y + 10, workArea.y + workArea.height - popupHeight),
    );

    const preload = path.join(__dirname, 'preload.js');

    const isMacOS = process.platform === 'darwin';

    this.popupWindow = new BrowserWindow({
      width: popupWidth,
      height: popupHeight,
      x,
      y,
      alwaysOnTop: true,
      ...(isMacOS
        ? {
            frame: true,
            titleBarStyle: 'hiddenInset',
          }
        : {
            frame: false,
          }),
      resizable: true,
      webPreferences: {
        devTools: inDevelopment,
        contextIsolation: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: false,
        sandbox: true,
        preload: preload,
      },
    });

    this.ensureCsp(this.popupWindow.webContents.session);

    // Load the popup route
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.popupWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/popup`);
    } else {
      this.popupWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: '#/popup' },
      );
    }

    this.popupWindow.on('closed', () => {
      this.popupWindow = null;
    });
  }

  closePopup(): void {
    this.popupWindow?.close();
  }

  closeAllWindows(): void {
    this.popupWindow?.close();
    this.mainWindow?.close();
  }
}

export const windowManager = new WindowManager();

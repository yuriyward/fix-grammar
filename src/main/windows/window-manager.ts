/**
 * Centralized window lifecycle management
 */
import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';

const inDevelopment = process.env.NODE_ENV === 'development';

export class WindowManager {
  public mainWindow: BrowserWindow | null = null;
  private popupWindow: BrowserWindow | null = null;

  private sendNavigate(targetWindow: BrowserWindow, to: string): void {
    const send = () => {
      targetWindow.webContents.send(IPC_CHANNELS.NAVIGATE, to);
    };

    if (targetWindow.webContents.isLoading()) {
      targetWindow.webContents.once('did-finish-load', send);
      return;
    }

    send();
  }

  navigateMainWindow(to: string): void {
    if (!this.mainWindow) return;
    this.sendNavigate(this.mainWindow, to);
  }

  navigatePopupWindow(to: string): void {
    if (!this.popupWindow) return;
    this.sendNavigate(this.popupWindow, to);
  }

  createMainWindow(): BrowserWindow {
    const preload = path.join(__dirname, 'preload.js');

    this.mainWindow = new BrowserWindow({
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
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
      trafficLightPosition:
        process.platform === 'darwin' ? { x: 5, y: 5 } : undefined,
    });

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
      app.dock.show();
    }
    this.mainWindow?.show();
    this.mainWindow?.focus();
  }

  hideMainWindow(): void {
    this.mainWindow?.hide();
    // Hide dock icon when hiding main window on macOS
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
  }

  createOrFocusPopup(): void {
    if (this.popupWindow) {
      this.popupWindow.focus();
      return;
    }

    const preload = path.join(__dirname, 'preload.js');

    this.popupWindow = new BrowserWindow({
      width: 400,
      height: 300,
      alwaysOnTop: true,
      frame: false,
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

    // Load the popup route
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.popupWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/popup`);
    } else {
      this.popupWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: '#/popup' },
      );
    }

    // Force navigation to popup route
    this.popupWindow.webContents.once('did-finish-load', () => {
      this.navigatePopupWindow('/popup');
    });

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

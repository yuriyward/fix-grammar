/**
 * Main application window creation
 */
import path from 'node:path';
import { BrowserWindow } from 'electron';
import { ipcContext } from '@/ipc/context';

const inDevelopment = process.env.NODE_ENV === 'development';

/**
 * Creates and configures the main application window.
 * Sets up window preferences, security settings, and loads the appropriate content.
 */
export function createWindow(): BrowserWindow {
  const preload = path.join(__dirname, 'preload.js');
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
  ipcContext.setMainWindow(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  return mainWindow;
}

/**
 * Main process lifecycle and initialization
 */
import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron/main';
import { UpdateSourceType, updateElectronApp } from 'update-electron-app';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import { createWindow } from './windows/main-window';

const inDevelopment = process.env.NODE_ENV === 'development';

async function installExtensions() {
  if (!inDevelopment) return;

  try {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
      'electron-devtools-installer'
    );
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch (err) {
    console.error('Failed to install extensions:', err);
  }
}

function checkForUpdates() {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: 'yuriyward/electron-shadcn-ai',
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import('@/ipc/handler');

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

/**
 * Initialize the Electron application.
 * This is the main entry point for the main process.
 */
export function initializeApp() {
  app
    .whenReady()
    .then(createWindow)
    .then(setupORPC)
    .then(installExtensions)
    .then(checkForUpdates);

  // macOS only
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

/**
 * Main process lifecycle and initialization
 */
import { app } from 'electron';
import { ipcMain } from 'electron/main';
import { UpdateSourceType, updateElectronApp } from 'update-electron-app';
import { ipcContext } from '@/ipc/context';
import { initializeSettingsStore } from '@/main/storage/settings';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import { shortcutManager } from './shortcuts/manager';
import { trayManager } from './tray/tray-manager';
import { windowManager } from './windows/window-manager';

const inDevelopment = process.env.NODE_ENV === 'development';

async function installExtensions() {
  if (!inDevelopment) return;

  try {
    // Note: electron-devtools-installer uses deprecated session APIs internally
    // This will show deprecation warnings but is safe for development mode
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import(
      'electron-devtools-installer'
    );

    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name || result}`);
  } catch (err) {
    console.error('Failed to install extensions:', err);
  }
}

function checkForUpdates() {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: 'yuriyward/fix-grammar',
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import('@/ipc/handler');
  const { BrowserWindow } = await import('electron');

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;
    const senderWindow = BrowserWindow.fromWebContents(event.sender);

    serverPort.start();
    rpcHandler.upgrade(serverPort, {
      context: {
        senderWindow,
      },
    });
  });
}

async function initializeWindows() {
  // Create main window (hidden by default for tray-first app)
  const mainWindow = windowManager.createMainWindow();
  ipcContext.setMainWindow(mainWindow);
  ipcContext.setWindowManager(windowManager);

  // Create tray icon
  trayManager.create();

  // Register global shortcuts
  shortcutManager.register();
}

/**
 * Initialize the Electron application.
 * This is the main entry point for the main process.
 */
export function initializeApp() {
  // Hide dock icon on macOS for tray-only app
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  app
    .whenReady()
    .then(() => {
      initializeSettingsStore();
    })
    .then(initializeWindows)
    .then(setupORPC)
    .then(installExtensions)
    .then(checkForUpdates);

  // Don't quit when all windows are closed - tray keeps app alive
  app.on('window-all-closed', () => {
    // Do nothing - tray app stays alive
  });

  app.on('activate', () => {
    // macOS: Show main window and dock icon when activated
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    windowManager.showMainWindow();
  });

  app.on('before-quit', () => {
    // Allow the app to quit by removing close handler
    if (windowManager.mainWindow) {
      windowManager.mainWindow.removeAllListeners('close');
    }
    shortcutManager.unregisterAll();
    trayManager.destroy();
  });
}

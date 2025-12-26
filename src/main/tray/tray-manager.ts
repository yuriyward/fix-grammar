/**
 * System tray lifecycle management
 */
import { app, Menu, nativeImage, Tray } from 'electron';
import { windowManager } from '@/main/windows/window-manager';

export class TrayManager {
  private tray: Tray | null = null;

  create(): void {
    // Create a simple 16x16 tray icon using a Buffer
    // This creates a solid black square that should be visible
    const size = 16;
    const buffer = Buffer.alloc(size * size * 4); // RGBA

    // Fill with black pixels
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 0; // R
      buffer[i + 1] = 0; // G
      buffer[i + 2] = 0; // B
      buffer[i + 3] = 255; // A (fully opaque)
    }

    const icon = nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size,
    });

    // For macOS, mark it as a template image
    if (process.platform === 'darwin') {
      icon.setTemplateImage(true);
    }

    this.tray = new Tray(icon);

    this.updateMenu();
    this.tray.setToolTip('Grammar Copilot');
  }

  updateMenu(): void {
    if (!this.tray) return;

    const menu = Menu.buildFromTemplate([
      {
        label: 'Grammar Copilot',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show App',
        click: () => windowManager.showMainWindow(),
      },
      { type: 'separator' },
      {
        label: 'Quit Grammar Copilot',
        accelerator: 'CommandOrControl+Q',
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(menu);
  }

  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}

export const trayManager = new TrayManager();

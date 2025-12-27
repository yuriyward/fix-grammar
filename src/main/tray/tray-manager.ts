/**
 * System tray lifecycle management
 */
import { app, Menu, nativeImage, Tray } from 'electron';
import { windowManager } from '@/main/windows/window-manager';

export class TrayManager {
  private tray: Tray | null = null;
  private idleIcon: Electron.NativeImage | null = null;
  private busyIcons: Electron.NativeImage[] = [];
  private busyTimer: ReturnType<typeof setInterval> | null = null;
  private busyFrameIndex = 0;
  private busyRefCount = 0;
  private readonly defaultTooltip = 'Grammar Copilot';
  private busyMenuLabel: string | null = null;

  create(): void {
    const size = 16;
    this.idleIcon = this.createIdleIcon(size);
    this.busyIcons = this.createBusyIcons(size);
    this.tray = new Tray(this.idleIcon);

    this.updateMenu();
    this.tray.setToolTip(this.defaultTooltip);
  }

  updateMenu(): void {
    if (!this.tray) return;

    const headerLabel =
      this.busyRefCount > 0
        ? (this.busyMenuLabel ?? `${this.defaultTooltip} — Working…`)
        : this.defaultTooltip;

    const menu = Menu.buildFromTemplate([
      {
        label: headerLabel,
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

  startBusy(tooltip = 'Grammar Copilot — Rewriting…'): void {
    this.busyRefCount += 1;
    if (!this.tray) return;
    if (!this.idleIcon || this.busyIcons.length === 0) return;

    this.busyMenuLabel = tooltip;

    if (this.busyTimer) {
      this.tray.setToolTip(tooltip);
      this.updateMenu();
      return;
    }

    this.tray.setToolTip(tooltip);
    this.updateMenu();
    this.busyFrameIndex = 0;
    this.tray.setImage(this.busyIcons[0]);
    this.busyFrameIndex = 1;
    this.busyTimer = setInterval(() => {
      if (!this.tray) return;
      const icon = this.busyIcons[this.busyFrameIndex % this.busyIcons.length];
      this.busyFrameIndex += 1;
      this.tray.setImage(icon);
    }, 240);
  }

  stopBusy(): void {
    this.busyRefCount = Math.max(0, this.busyRefCount - 1);
    if (this.busyRefCount > 0) return;

    if (this.busyTimer) {
      clearInterval(this.busyTimer);
      this.busyTimer = null;
    }

    if (!this.tray) return;
    if (!this.idleIcon) return;

    this.tray.setImage(this.idleIcon);
    this.tray.setToolTip(this.defaultTooltip);
    this.busyMenuLabel = null;
    this.updateMenu();
  }

  destroy(): void {
    if (this.busyTimer) {
      clearInterval(this.busyTimer);
      this.busyTimer = null;
    }
    this.tray?.destroy();
    this.tray = null;
  }

  private createIdleIcon(size: number): Electron.NativeImage {
    const buffer = Buffer.alloc(size * size * 4);
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 0;
      buffer[i + 1] = 0;
      buffer[i + 2] = 0;
      buffer[i + 3] = 255;
    }

    const icon = nativeImage.createFromBuffer(buffer, {
      width: size,
      height: size,
    });
    if (process.platform === 'darwin') icon.setTemplateImage(true);
    return icon;
  }

  private createBusyIcons(size: number): Electron.NativeImage[] {
    const frames = [0, 1, 2].map((phase) => {
      const buffer = Buffer.alloc(size * size * 4);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const offset = (y * size + x) * 4;
          buffer[offset] = 0;
          buffer[offset + 1] = 0;
          buffer[offset + 2] = 0;

          const diagonal = (x + y + phase * 2) % 6;
          const alpha = diagonal === 0 ? 0 : diagonal === 1 ? 96 : 255;
          buffer[offset + 3] = alpha;
        }
      }

      const icon = nativeImage.createFromBuffer(buffer, {
        width: size,
        height: size,
      });
      if (process.platform === 'darwin') icon.setTemplateImage(true);
      return icon;
    });

    return frames;
  }
}

export const trayManager = new TrayManager();

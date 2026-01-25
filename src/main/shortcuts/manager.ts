/**
 * Global shortcut registration manager
 */
import { globalShortcut } from 'electron';
import { store } from '@/main/storage/settings';
import { DEFAULT_HOTKEYS } from '@/shared/config/hotkeys';
import {
  handleFixSelection,
  handleShowMainWindow,
  handleTogglePopup,
} from './handlers';

export class ShortcutManager {
  register(): void {
    // Merge with defaults to handle missing keys from older settings
    const shortcuts = { ...DEFAULT_HOTKEYS, ...store.get('hotkeys') };

    globalShortcut.register(shortcuts.fixSelection, () => {
      void handleFixSelection().catch((error: unknown) => {
        console.error('Global shortcut handler failed: fixSelection', error);
      });
    });
    globalShortcut.register(shortcuts.togglePopup, () => {
      handleTogglePopup();
    });
    globalShortcut.register(shortcuts.showMainWindow, () => {
      handleShowMainWindow();
    });
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll();
  }

  reregister(): void {
    this.unregisterAll();
    this.register();
  }
}

export const shortcutManager = new ShortcutManager();

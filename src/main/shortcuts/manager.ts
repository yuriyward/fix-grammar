/**
 * Global shortcut registration manager
 */
import { globalShortcut } from 'electron';
import { store } from '@/main/storage/settings';
import {
  handleFixField,
  handleFixSelection,
  handleOpenSettings,
  handleTogglePopup,
} from './handlers';

export class ShortcutManager {
  register(): void {
    const shortcuts = store.get('hotkeys');

    globalShortcut.register(shortcuts.fixSelection, () => {
      void handleFixSelection().catch((error: unknown) => {
        console.error('Global shortcut handler failed: fixSelection', error);
      });
    });
    globalShortcut.register(shortcuts.fixField, () => {
      void handleFixField().catch((error: unknown) => {
        console.error('Global shortcut handler failed: fixField', error);
      });
    });
    globalShortcut.register(shortcuts.togglePopup, () => {
      handleTogglePopup();
    });
    globalShortcut.register(shortcuts.openSettings, () => {
      handleOpenSettings();
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

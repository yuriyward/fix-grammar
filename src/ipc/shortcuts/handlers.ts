/**
 * Shortcuts IPC handlers
 */
import { os } from '@orpc/server';
import { shortcutManager } from '@/main/shortcuts/manager';

export const reregisterShortcuts = os.handler(() => {
  shortcutManager.reregister();
  return { success: true };
});

export const unregisterAllShortcuts = os.handler(() => {
  shortcutManager.unregisterAll();
  return { success: true };
});

/**
 * nut-js wrapper for keyboard automation
 */
import { Key, keyboard } from '@nut-tree-fork/nut-js';

const isMac = process.platform === 'darwin';
const modifierKey = isMac ? Key.LeftSuper : Key.LeftControl;
const CLIPBOARD_SYNC_DELAY_MS = 100; // Wait for system clipboard to sync
const SELECTION_DELAY_MS = 50; // Wait for selection to complete

export async function simulateCopy(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.C);
  await keyboard.releaseKey(modifierKey, Key.C);
  // Wait for clipboard to update
  await new Promise((resolve) => setTimeout(resolve, CLIPBOARD_SYNC_DELAY_MS));
}

export async function simulatePaste(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.V);
  await keyboard.releaseKey(modifierKey, Key.V);
}

export async function simulateSelectAll(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.A);
  await keyboard.releaseKey(modifierKey, Key.A);
  await new Promise((resolve) => setTimeout(resolve, SELECTION_DELAY_MS));
}

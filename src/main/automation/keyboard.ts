/**
 * nut-js wrapper for keyboard automation
 */
import { randomUUID } from 'node:crypto';
import { Key, keyboard } from '@nut-tree-fork/nut-js';
import { readClipboard, writeClipboard } from '@/main/automation/clipboard';
import { store } from '@/main/storage/settings';

const isMac = process.platform === 'darwin';
const modifierKey = isMac ? Key.LeftSuper : Key.LeftControl;

function getDelayMs(
  key: 'automation.clipboardSyncDelayMs' | 'automation.selectionDelayMs',
): number {
  const value = store.get(key);
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value;
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function waitForClipboardTextToNotEqual(
  text: string,
  timeoutMs: number,
): Promise<void> {
  if (timeoutMs <= 0) return;

  const pollIntervalMs = 25;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (readClipboard() !== text) return;
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
  }
}

export async function pressCopyShortcut(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.C);
  await keyboard.releaseKey(modifierKey, Key.C);
}

export async function pressPasteShortcut(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.V);
  await keyboard.releaseKey(modifierKey, Key.V);
}

export async function pressSelectAllShortcut(): Promise<void> {
  await keyboard.pressKey(modifierKey, Key.A);
  await keyboard.releaseKey(modifierKey, Key.A);
}

export async function simulateCopy(): Promise<void> {
  const clipboardSyncDelayMs = getDelayMs('automation.clipboardSyncDelayMs');
  const previousClipboard = readClipboard();

  const sentinel = `__grammar_copilot_copy_${randomUUID()}__`;
  if (clipboardSyncDelayMs > 0) {
    writeClipboard(sentinel);
  }

  await pressCopyShortcut();

  if (clipboardSyncDelayMs > 0) {
    await waitForClipboardTextToNotEqual(sentinel, clipboardSyncDelayMs);
    if (readClipboard() === sentinel) {
      writeClipboard(previousClipboard);
    }
  }
}

export async function simulatePaste(): Promise<void> {
  await pressPasteShortcut();
}

export async function simulateSelectAll(): Promise<void> {
  await pressSelectAllShortcut();

  const selectionDelayMs = getDelayMs('automation.selectionDelayMs');
  await sleep(selectionDelayMs);
}

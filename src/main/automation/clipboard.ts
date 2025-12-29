/**
 * Clipboard backup/restore utilities
 */
import { clipboard } from 'electron';

/** Prevent clipboard restoration during slow pastes */
export const SAFE_RESTORE_WINDOW_MS = 500;

let clipboardBackup: string | null = null;

export function backupClipboard(): void {
  clipboardBackup = clipboard.readText();
}

export function restoreClipboard(): void {
  if (clipboardBackup === null) return;
  clipboard.writeText(clipboardBackup);
  clipboardBackup = null;
}

export function readClipboard(): string {
  return clipboard.readText();
}

export function writeClipboard(text: string): void {
  clipboard.writeText(text);
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll clipboard until its content differs from the given text or timeout is reached.
 * Used to detect when a copy operation has completed.
 */
export async function waitForClipboardTextToNotEqual(
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

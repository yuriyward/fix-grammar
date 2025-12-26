/**
 * Clipboard backup/restore utilities
 */
import { clipboard } from 'electron';

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

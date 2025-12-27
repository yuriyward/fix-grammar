/**
 * Automation IPC handlers
 */

import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { os } from '@orpc/server';
import type { BrowserWindow } from 'electron';
import { ipcContext } from '@/ipc/context';
import {
  backupClipboard,
  readClipboard,
  restoreClipboard,
  writeClipboard,
} from '@/main/automation/clipboard';
import {
  pressCopyShortcut,
  simulateCopy,
  simulatePaste,
  simulateSelectAll,
} from '@/main/automation/keyboard';
import { store } from '@/main/storage/settings';
import {
  calibrateDelaysInputSchema,
  captureTextInputSchema,
  replaceTextInputSchema,
} from './schemas';

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function roundUpToStep(value: number, step: number): number {
  if (step <= 0) return Math.ceil(value);
  return Math.ceil(value / step) * step;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

async function waitForClipboardTextToNotEqual(
  text: string,
  timeoutMs: number,
): Promise<void> {
  if (timeoutMs <= 0) return;

  const pollIntervalMs = 10;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (readClipboard() !== text) return;
    await sleep(Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())));
  }
}

async function waitForWindowFocus(
  window: BrowserWindow,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (window.isFocused()) return;
    await sleep(25);
  }
  throw new Error('Main window is not focused.');
}

async function focusAndSelectCalibrationTextarea(
  window: BrowserWindow,
  expectedText: string,
): Promise<void> {
  const result = (await window.webContents.executeJavaScript(
    `
      (() => {
        const el = document.getElementById('calibrationText');
        if (!(el instanceof HTMLTextAreaElement)) {
          return { ok: false, reason: 'Calibration field not found.' };
        }
        if (el.value !== ${JSON.stringify(expectedText)}) {
          return { ok: false, reason: 'Calibration text mismatch.' };
        }
        el.focus();
        el.select();
        const active = document.activeElement;
        const ok = active === el;
        return { ok, reason: ok ? null : 'Calibration field not focused.' };
      })();
    `,
    true,
  )) as { ok: boolean; reason: string | null };

  if (!result.ok) {
    throw new Error(result.reason ?? 'Failed to focus calibration field.');
  }
}

async function measureCopyLatencyMs(
  window: BrowserWindow,
  expectedText: string,
  clipboardTimeoutMs: number,
): Promise<{ elapsedMs: number; copiedText: string }> {
  const sentinel = `__grammar_copilot_calibrate_${randomUUID()}__`;
  writeClipboard(sentinel);

  await focusAndSelectCalibrationTextarea(window, expectedText);

  const start = performance.now();
  await pressCopyShortcut();
  await waitForClipboardTextToNotEqual(sentinel, clipboardTimeoutMs);
  const elapsedMs = Math.max(0, performance.now() - start);

  const copiedText = readClipboard();
  if (copiedText === sentinel) {
    throw new Error('Copy did not update the clipboard (timed out).');
  }

  if (copiedText !== expectedText) {
    throw new Error('Copied text did not match expected text.');
  }

  return { elapsedMs, copiedText };
}

export const captureText = os
  .input(captureTextInputSchema)
  .handler(async ({ input }) => {
    try {
      // Backup current clipboard
      backupClipboard();

      // Capture based on mode
      if (input.mode === 'field') {
        await simulateSelectAll();
      }

      // Simulate copy
      await simulateCopy();

      // Read captured text
      const text = readClipboard();

      // Restore clipboard
      restoreClipboard();

      return { text, mode: input.mode };
    } catch (error) {
      // Restore clipboard on error
      restoreClipboard();
      throw error;
    }
  });

export const replaceText = os
  .input(replaceTextInputSchema)
  .handler(async ({ input }) => {
    try {
      // Backup current clipboard
      backupClipboard();

      // Set clipboard to new text
      writeClipboard(input.text);

      // Simulate paste
      await simulatePaste();

      // Restore clipboard
      restoreClipboard();

      return { success: true };
    } catch (error) {
      // Restore clipboard on error
      restoreClipboard();
      throw error;
    }
  });

export const calibrateDelays = os
  .input(calibrateDelaysInputSchema)
  .handler(async ({ input }) => {
    const window = ipcContext.mainWindow;
    if (!window) {
      return {
        success: false as const,
        reason: 'Main window is not available yet.',
      };
    }
    const expectedText = input.expectedText;

    const clipboardTimeoutMs = 5_000;
    const sampleRuns = 5;

    backupClipboard();
    try {
      window.show();
      window.focus();
      await waitForWindowFocus(window, 1_000);

      const samplesMs: number[] = [];
      for (let run = 0; run < sampleRuns; run += 1) {
        const result = await measureCopyLatencyMs(
          window,
          expectedText,
          clipboardTimeoutMs,
        );
        samplesMs.push(Math.round(result.elapsedMs));
      }

      const p95Ms = percentile(samplesMs, 95);
      const maxMs = Math.max(...samplesMs);

      const recommendedClipboardSyncDelayMs = Math.min(
        2_000,
        Math.max(50, roundUpToStep(maxMs + 50, 25)),
      );

      const selectionDelayMsSetting = store.get('automation.selectionDelayMs');
      const recommendedSelectionDelayMs =
        typeof selectionDelayMsSetting === 'number' &&
        Number.isFinite(selectionDelayMsSetting) &&
        selectionDelayMsSetting >= 0
          ? selectionDelayMsSetting
          : 100;

      return {
        success: true as const,
        measuredClipboardMs: { samplesMs, p95Ms, maxMs },
        recommended: {
          clipboardSyncDelayMs: recommendedClipboardSyncDelayMs,
          selectionDelayMs: recommendedSelectionDelayMs,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false as const,
        reason: `Calibration failed: ${message}`,
      };
    } finally {
      restoreClipboard();
    }
  });

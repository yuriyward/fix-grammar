/**
 * Fix selection orchestration handlers
 */
import { randomUUID } from 'node:crypto';
import { Notification } from 'electron';
import { rewriteTextWithSettings } from '@/main/ai/client';
import { parseAIError } from '@/main/ai/error-handler';
import {
  readClipboard,
  SAFE_RESTORE_WINDOW_MS,
  waitForClipboardTextToNotEqual,
  writeClipboard,
} from '@/main/automation/clipboard';
import { pressCopyShortcut, simulatePaste } from '@/main/automation/keyboard';
import { saveEditContext } from '@/main/storage/context';
import { addNotification } from '@/main/storage/notifications';
import { store } from '@/main/storage/settings';
import { trayManager } from '@/main/tray/tray-manager';
import { windowManager } from '@/main/windows/window-manager';
import { getModelLabel } from '@/shared/config/ai-models';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AppNotification,
  AppNotificationPayload,
} from '@/shared/types/notifications';
import { type AppContext, getFrontmostApp, isSameApp } from './app-context';
import { fixStateManager } from './fix-state';

const activeOsNotifications = new Set<Notification>();

function sendInAppNotification(notification: AppNotification): void {
  windowManager.broadcast(IPC_CHANNELS.NOTIFY, notification);
}

function showNotification(payload: AppNotificationPayload): void {
  const stored = addNotification(payload);
  const osNotification = new Notification({
    title: stored.title,
    body: stored.description,
  });
  osNotification.show();
  sendInAppNotification(stored);
}

function formatDurationMs(durationMs: number): string {
  const clampedMs = Math.max(0, durationMs);
  if (clampedMs < 10_000) return `${(clampedMs / 1000).toFixed(1)}s`;

  const totalSeconds = Math.round(clampedMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
}

function getClipboardSyncDelayMs(): number {
  const value = store.get('automation.clipboardSyncDelayMs');
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  return value;
}

async function captureSelectionText(): Promise<string | null> {
  const clipboardBeforeCopy = readClipboard();
  const sentinel = `__grammar_copilot_selection_${randomUUID()}__`;

  try {
    writeClipboard(sentinel);
    await pressCopyShortcut();
    await waitForClipboardTextToNotEqual(sentinel, getClipboardSyncDelayMs());

    const copied = readClipboard();
    return copied === sentinel ? null : copied;
  } finally {
    writeClipboard(clipboardBeforeCopy);
  }
}

export function preserveTrailingNewlines(
  originalText: string,
  rewrittenText: string,
): string {
  const originalTrailing = originalText.match(/(\r?\n)+$/)?.[0];
  if (!originalTrailing) return rewrittenText;

  const rewrittenTrailing = rewrittenText.match(/(\r?\n)+$/)?.[0] ?? '';
  const originalCount = (originalTrailing.match(/\n/g) ?? []).length;
  const rewrittenCount = (rewrittenTrailing.match(/\n/g) ?? []).length;

  if (rewrittenCount >= originalCount) return rewrittenText;

  const newline = originalTrailing.includes('\r\n') ? '\r\n' : '\n';
  return `${rewrittenText}${newline.repeat(originalCount - rewrittenCount)}`;
}

/**
 * Apply a fix directly by pasting it with clipboard guard
 */
async function applyFixDirectly(
  rewrittenText: string,
  options?: { beforePaste?: () => Promise<void> },
): Promise<void> {
  if (options?.beforePaste) {
    await options.beforePaste();
  }

  // Time-based guard: only restore clipboard if paste completed quickly enough
  const clipboardBeforePaste = readClipboard();
  const pasteStartedAt = Date.now();

  try {
    writeClipboard(rewrittenText);
    await simulatePaste();
  } finally {
    const elapsed = Date.now() - pasteStartedAt;
    if (elapsed < SAFE_RESTORE_WINDOW_MS && readClipboard() === rewrittenText) {
      writeClipboard(clipboardBeforePaste);
    }
  }
}

/**
 * Show persistent notification with "Apply Fix" action
 */
function showPersistentFixNotification(
  contextId: string,
  sourceApp: AppContext,
  modelLabel: string,
): void {
  const notification = addNotification({
    type: 'info',
    title: 'Grammar Copilot',
    description: `Your fix is ready for ${sourceApp.name}. Using ${modelLabel}. Open Grammar Copilot and click "Apply Fix" to paste it.`,
    action: { type: 'apply-fix', contextId },
    persistent: true,
  });

  // OS notification (non-actionable, just for awareness)
  const osNotification = new Notification({
    title: notification.title,
    body: notification.description,
  });
  activeOsNotifications.add(osNotification);
  osNotification.on('close', () => {
    activeOsNotifications.delete(osNotification);
  });
  osNotification.on('click', () => {
    windowManager.openNotificationCenter();
  });
  osNotification.show();

  // In-app notification (actionable)
  sendInAppNotification(notification);
}

/**
 * Process fix asynchronously in the background
 */
async function processFixAsync(
  contextId: string,
  originalText: string,
  sourceApp: AppContext | null,
  fixStartedAt: number,
  options?: { beforePaste?: () => Promise<void> },
): Promise<void> {
  trayManager.startBusy('Processing in background…');

  try {
    // Get AI configuration for metadata
    const provider = store.get('ai.provider');
    const role = store.get('ai.role');
    const model = store.get('ai.model');
    const modelLabel = getModelLabel(provider, model);

    // AI rewriting using unified function
    const result = await rewriteTextWithSettings(originalText, role);
    const rewrittenText = preserveTrailingNewlines(
      originalText,
      await result.text,
    );

    // Save context
    saveEditContext(contextId, {
      originalText,
      rewrittenText,
      startedAt: fixStartedAt,
      role,
      provider,
      model,
      sourceApp: sourceApp ?? undefined,
    });

    // Smart completion: check if user is still in same app
    const currentApp = await getFrontmostApp();

    if (sourceApp && currentApp && isSameApp(sourceApp, currentApp)) {
      const currentSelectionText = await captureSelectionText();
      if (currentSelectionText === originalText) {
        // AUTO-PASTE: User is still in same app and selection is unchanged
        await applyFixDirectly(rewrittenText, options);
        const elapsedToPasteMs = Date.now() - fixStartedAt;

        showNotification({
          type: 'success',
          title: 'Grammar Copilot',
          description: `Text rewritten and pasted (${modelLabel}, ${formatDurationMs(
            elapsedToPasteMs,
          )})`,
        });
      } else {
        // SELECTION CHANGED: Avoid pasting into the wrong place
        writeClipboard(rewrittenText);
        showNotification({
          type: 'info',
          title: 'Grammar Copilot',
          description: `Selection changed. Result copied to clipboard for manual paste. Used ${modelLabel}.`,
        });
      }
    } else {
      // NOTIFICATION: User switched apps
      if (sourceApp) {
        showPersistentFixNotification(contextId, sourceApp, modelLabel);
      } else {
        // Fallback: no source app captured
        showNotification({
          type: 'info',
          title: 'Grammar Copilot',
          description: `Text rewritten. Used ${modelLabel}. Result copied to clipboard.`,
        });
        writeClipboard(rewrittenText);
      }
    }
  } catch (error) {
    const errorDetails = parseAIError(error);
    showNotification({
      type: 'error',
      title: errorDetails.title,
      description: errorDetails.message,
    });
    // Don't re-throw: user notification is sufficient
  } finally {
    trayManager.stopBusy();
  }
}

/**
 * Global shortcut handler that rewrites the current selection in the focused app.
 *
 * Captures the selection and processes it asynchronously. If user stays in the same app,
 * the fix is pasted automatically. Otherwise, a persistent notification is shown.
 */
export async function handleFixSelection(): Promise<void> {
  // Guard: reject if already processing
  if (!fixStateManager.canStartFix()) {
    showNotification({
      type: 'warning',
      title: 'Grammar Copilot',
      description: 'Already processing a fix request',
    });
    return;
  }

  const fixStartedAt = Date.now();
  trayManager.startBusy('Grammar Copilot — Capturing selection…');

  try {
    // 1. Capture app context BEFORE copying
    const sourceApp = await getFrontmostApp();

    // 2. Capture selection (without disturbing user clipboard)
    const originalText = await captureSelectionText();

    if (!originalText || !originalText.trim()) {
      showNotification({
        type: 'info',
        title: 'Grammar Copilot',
        description: 'No text selected',
      });
      return;
    }

    // 3. Start async processing (fire and forget)
    const contextId = randomUUID();
    fixStateManager.startFix(contextId, sourceApp);

    processFixAsync(contextId, originalText, sourceApp, fixStartedAt)
      .catch((error) => {
        // Fallback: log unexpected errors that weren't caught by processFixAsync
        console.error('[handleFixSelection] Unexpected error:', error);
      })
      .finally(() => {
        fixStateManager.completeFix();
      });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification({
      type: 'error',
      title: 'Grammar Copilot Error',
      description: `Capture failed: ${message}`,
    });
    fixStateManager.completeFix();
  } finally {
    trayManager.stopBusy();
  }
}

/**
 * Global shortcut handler that opens the popup window near the cursor.
 */
export function handleTogglePopup(): void {
  windowManager.createOrFocusPopupAtCursor();
}

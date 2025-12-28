/**
 * Fix selection/field orchestration handlers
 */
import { randomUUID } from 'node:crypto';
import { Notification } from 'electron';
import { rewriteText } from '@/main/ai/client';
import { parseAIError } from '@/main/ai/error-handler';
import {
  backupClipboard,
  readClipboard,
  restoreClipboard,
  writeClipboard,
} from '@/main/automation/clipboard';
import {
  simulateCopy,
  simulatePaste,
  simulateSelectAll,
} from '@/main/automation/keyboard';
import { getApiKey } from '@/main/storage/api-keys';
import { saveEditContext } from '@/main/storage/context';
import { addNotification } from '@/main/storage/notifications';
import { store } from '@/main/storage/settings';
import { trayManager } from '@/main/tray/tray-manager';
import { windowManager } from '@/main/windows/window-manager';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AppNotification,
  AppNotificationPayload,
} from '@/shared/types/notifications';

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

function preserveTrailingNewlines(
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

async function rewriteAndReplaceText(
  originalText: string,
  options?: { beforePaste?: () => Promise<void> },
): Promise<void> {
  const provider = store.get('ai.provider');
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    showNotification({
      type: 'error',
      title: 'Grammar Copilot',
      description: `API key not found for provider: ${provider}`,
    });
    return;
  }

  const role = store.get('ai.role');
  const model = store.get('ai.model');
  trayManager.startBusy();

  let rewrittenText: string;
  try {
    const result = await rewriteText(originalText, role, apiKey, model);
    rewrittenText = preserveTrailingNewlines(originalText, await result.text);
  } catch (error) {
    const errorDetails = parseAIError(error);
    showNotification({
      type: 'error',
      title: errorDetails.title,
      description: errorDetails.message,
    });
    throw error; // Re-throw to prevent continuing with undefined rewrittenText
  } finally {
    trayManager.stopBusy();
  }

  saveEditContext(randomUUID(), {
    originalText,
    rewrittenText,
    timestamp: Date.now(),
    role,
  });

  if (options?.beforePaste) {
    await options.beforePaste();
  }

  const clipboardBeforePaste = readClipboard();
  try {
    writeClipboard(rewrittenText);
    await simulatePaste();
  } finally {
    if (readClipboard() === rewrittenText) {
      writeClipboard(clipboardBeforePaste);
    }
  }

  showNotification({
    type: 'success',
    title: 'Grammar Copilot',
    description: 'Text rewritten successfully',
  });
}

/**
 * Global shortcut handler that rewrites the current selection in the focused app.
 *
 * Copies the current selection, sends it to the AI rewriter, then pastes the rewritten
 * text back in place. Uses temporary clipboard overrides and shows system notifications.
 */
export async function handleFixSelection(): Promise<void> {
  trayManager.startBusy('Grammar Copilot — Capturing selection…');
  try {
    // 1. Backup clipboard and capture selection
    backupClipboard();
    const originalText = await (async (): Promise<string> => {
      try {
        // 2. Simulate Cmd+C to capture selection
        await simulateCopy();

        // 3. Read captured text
        return readClipboard();
      } finally {
        // 4. Restore clipboard immediately (even if simulateCopy throws)
        restoreClipboard();
      }
    })();

    if (!originalText.trim()) {
      showNotification({
        type: 'info',
        title: 'Grammar Copilot',
        description: 'No text selected',
      });
      return;
    }

    await rewriteAndReplaceText(originalText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification({
      type: 'error',
      title: 'Grammar Copilot Error',
      description: `Rewrite failed: ${message}`,
    });
  } finally {
    trayManager.stopBusy();
  }
}

/**
 * Global shortcut handler that rewrites the entire active input/textarea field.
 *
 * Selects all, copies the field contents, sends it to the AI rewriter, then selects
 * all again and pastes the rewritten text. Uses temporary clipboard overrides and
 * shows system notifications.
 */
export async function handleFixField(): Promise<void> {
  trayManager.startBusy('Grammar Copilot — Capturing field…');
  try {
    backupClipboard();
    const originalText = await (async (): Promise<string> => {
      try {
        // 1. Select all in active field
        await simulateSelectAll();

        // 2. Copy entire field
        await simulateCopy();

        return readClipboard();
      } finally {
        restoreClipboard();
      }
    })();

    if (!originalText.trim()) {
      showNotification({
        type: 'info',
        title: 'Grammar Copilot',
        description: 'No text in field',
      });
      return;
    }

    await rewriteAndReplaceText(originalText, {
      beforePaste: simulateSelectAll,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification({
      type: 'error',
      title: 'Grammar Copilot Error',
      description: `Rewrite failed: ${message}`,
    });
  } finally {
    trayManager.stopBusy();
  }
}

/**
 * Global shortcut handler that opens (or focuses) the popup window.
 */
export function handleTogglePopup(): void {
  windowManager.createOrFocusPopup();
}

/**
 * Global shortcut handler that opens the Settings page in the main window.
 */
export function handleOpenSettings(): void {
  // Show main window
  windowManager.showMainWindow();

  // Navigate to /settings route
  windowManager.navigateMainWindow('/settings');
}

/**
 * Fix selection orchestration handlers
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
import { simulateCopy, simulatePaste } from '@/main/automation/keyboard';
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
import { type AppContext, getFrontmostApp, isSameApp } from './app-context';
import { fixStateManager } from './fix-state';

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
  const SAFE_RESTORE_WINDOW_MS = 500;
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
): void {
  const notification = addNotification({
    type: 'info',
    title: 'Grammar Copilot',
    description: `Your fix is ready for ${sourceApp.name}. Click "Apply Fix" to paste it.`,
    action: { type: 'apply-fix', contextId },
    persistent: true,
  });

  // OS notification (non-actionable, just for awareness)
  const osNotification = new Notification({
    title: notification.title,
    body: notification.description,
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
  options?: { beforePaste?: () => Promise<void> },
): Promise<void> {
  trayManager.startBusy('Processing in background…');

  try {
    // Get AI configuration
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

    // AI rewriting
    const result = await rewriteText(originalText, role, apiKey, model);
    const rewrittenText = preserveTrailingNewlines(
      originalText,
      await result.text,
    );

    // Save context
    saveEditContext(contextId, {
      originalText,
      rewrittenText,
      timestamp: Date.now(),
      role,
      sourceApp: sourceApp ?? undefined,
    });

    // Smart completion: check if user is still in same app
    const currentApp = await getFrontmostApp();

    if (sourceApp && currentApp && isSameApp(sourceApp, currentApp)) {
      // AUTO-PASTE: User is still in same app
      await applyFixDirectly(rewrittenText, options);

      showNotification({
        type: 'success',
        title: 'Grammar Copilot',
        description: 'Text rewritten and pasted',
      });
    } else {
      // NOTIFICATION: User switched apps
      if (sourceApp) {
        showPersistentFixNotification(contextId, sourceApp);
      } else {
        // Fallback: no source app captured
        showNotification({
          type: 'info',
          title: 'Grammar Copilot',
          description: 'Text rewritten. Result copied to clipboard.',
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
    throw error;
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

  trayManager.startBusy('Grammar Copilot — Capturing selection…');

  try {
    // 1. Capture app context BEFORE copying
    const sourceApp = await getFrontmostApp();

    // 2. Backup clipboard and capture selection
    backupClipboard();
    const originalText = await (async (): Promise<string> => {
      try {
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
        description: 'No text selected',
      });
      return;
    }

    // 3. Start async processing (fire and forget)
    const contextId = randomUUID();
    fixStateManager.startFix(contextId, sourceApp);

    processFixAsync(contextId, originalText, sourceApp)
      .catch((error) => {
        console.error('[handleFixSelection] processFixAsync failed:', error);
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

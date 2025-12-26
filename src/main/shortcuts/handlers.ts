/**
 * Fix selection/field orchestration handlers
 */
import { randomUUID } from 'node:crypto';
import { Notification } from 'electron';
import { rewriteText } from '@/main/ai/client';
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
import { store } from '@/main/storage/settings';
import { windowManager } from '@/main/windows/window-manager';

function showNotification(title: string, body?: string): void {
  const notification = new Notification({ title, body });
  notification.show();
}

async function rewriteAndReplaceText(
  originalText: string,
  options?: { beforePaste?: () => Promise<void> },
): Promise<void> {
  const provider = store.get('ai.provider');
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    showNotification(
      'Grammar Copilot',
      `API key not found for provider: ${provider}`,
    );
    return;
  }

  const role = store.get('ai.role');
  const model = store.get('ai.model');
  const result = await rewriteText(originalText, role, apiKey, model);

  const rewrittenText = await result.text;

  saveEditContext(randomUUID(), {
    originalText,
    rewrittenText,
    timestamp: Date.now(),
    role,
  });

  if (options?.beforePaste) {
    await options.beforePaste();
  }

  backupClipboard();
  try {
    writeClipboard(rewrittenText);
    await simulatePaste();
  } finally {
    restoreClipboard();
  }

  showNotification('Grammar Copilot', 'Text rewritten successfully');
}

/**
 * Global shortcut handler that rewrites the current selection in the focused app.
 *
 * Copies the current selection, sends it to the AI rewriter, then pastes the rewritten
 * text back in place. Uses temporary clipboard overrides and shows system notifications.
 */
export async function handleFixSelection(): Promise<void> {
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
      showNotification('Grammar Copilot', 'No text selected');
      return;
    }

    // 5. Rewrite and replace selection
    await rewriteAndReplaceText(originalText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification('Grammar Copilot Error', `Rewrite failed: ${message}`);
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
      showNotification('Grammar Copilot', 'No text in field');
      return;
    }

    // 3. Rewrite and replace field contents
    await rewriteAndReplaceText(originalText, { beforePaste: simulateSelectAll });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification('Grammar Copilot Error', `Rewrite failed: ${message}`);
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

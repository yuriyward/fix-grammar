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

export async function handleFixSelection(): Promise<void> {
  try {
    // 1. Backup clipboard
    backupClipboard();

    // 2. Simulate Cmd+C to capture selection
    await simulateCopy();

    // 3. Read captured text
    const originalText = readClipboard();
    if (!originalText.trim()) {
      restoreClipboard();
      showNotification('Grammar Copilot', 'No text selected');
      return;
    }

    // 4. Restore clipboard immediately
    restoreClipboard();

    // 5. Send to AI (streaming)
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

    // Get the complete rewritten text
    const rewrittenText = await result.text;

    // 6. Save context for popup follow-ups
    saveEditContext(randomUUID(), {
      originalText,
      rewrittenText,
      timestamp: Date.now(),
      role,
    });

    // 7. Replace selection with rewritten text
    backupClipboard();
    writeClipboard(rewrittenText);
    await simulatePaste();
    restoreClipboard();

    showNotification('Grammar Copilot', 'Text rewritten successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification('Grammar Copilot Error', `Rewrite failed: ${message}`);
  }
}

export async function handleFixField(): Promise<void> {
  try {
    backupClipboard();

    // 1. Select all in active field
    await simulateSelectAll();

    // 2. Copy entire field
    await simulateCopy();

    const originalText = readClipboard();
    if (!originalText.trim()) {
      restoreClipboard();
      showNotification('Grammar Copilot', 'No text in field');
      return;
    }

    restoreClipboard();

    // 3. Rewrite and replace (same as Fix Selection from step 5 onwards)
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

    // Get the complete rewritten text
    const rewrittenText = await result.text;

    saveEditContext(randomUUID(), {
      originalText,
      rewrittenText,
      timestamp: Date.now(),
      role,
    });

    // Select all again before pasting
    await simulateSelectAll();

    backupClipboard();
    writeClipboard(rewrittenText);
    await simulatePaste();
    restoreClipboard();

    showNotification('Grammar Copilot', 'Text rewritten successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    showNotification('Grammar Copilot Error', `Rewrite failed: ${message}`);
  }
}

export function handleTogglePopup(): void {
  windowManager.createOrFocusPopup();
}

export function handleOpenSettings(): void {
  // Show main window
  windowManager.showMainWindow();

  // Navigate to /settings route
  windowManager.navigateMainWindow('/settings');
}

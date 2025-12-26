/**
 * Automation IPC handlers
 */
import { os } from '@orpc/server';
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
import { captureTextInputSchema, replaceTextInputSchema } from './schemas';

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

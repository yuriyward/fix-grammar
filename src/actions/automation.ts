/**
 * Automation IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { CaptureMode, CaptureResult } from '@/shared/types/automation';

export async function captureText(mode: CaptureMode): Promise<CaptureResult> {
  return ipc.client.automation.captureText({ mode });
}

export async function replaceText(text: string): Promise<{ success: boolean }> {
  return ipc.client.automation.replaceText({ text });
}

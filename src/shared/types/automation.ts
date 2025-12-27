/**
 * Automation types
 */
export type CaptureMode = 'selection' | 'field';

export interface CaptureResult {
  text: string;
  mode: CaptureMode;
}

export type AutomationCalibrationResult =
  | {
      success: true;
      measuredClipboardMs: {
        samplesMs: number[];
        p95Ms: number;
        maxMs: number;
      };
      recommended: { clipboardSyncDelayMs: number; selectionDelayMs: number };
    }
  | { success: false; reason: string };

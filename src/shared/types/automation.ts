/**
 * Automation types
 */
export type CaptureMode = 'selection' | 'field';

export interface CaptureResult {
  text: string;
  mode: CaptureMode;
}

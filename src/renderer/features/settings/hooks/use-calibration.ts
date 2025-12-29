/**
 * Automation calibration hook
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { calibrateDelays } from '@/actions/automation';
import { getSettings, updateSettings } from '@/actions/settings';
import { toastManager } from '@/renderer/components/ui/toast';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AutomationCalibrationFocusRequest,
  AutomationCalibrationFocusResponse,
  AutomationCalibrationResult,
} from '@/shared/types/automation';

export interface UseCalibrationReturn {
  isCalibrating: boolean;
  calibration: AutomationCalibrationResult | null;
  calibrationText: string;
  setCalibrationText: (text: string) => void;
  calibrationFieldRef: React.RefObject<HTMLTextAreaElement | null>;
  handleCalibrate: () => Promise<void>;
}

export function useCalibration(
  isSaving: boolean,
  setClipboardSyncDelayMs: (ms: number) => void,
  setSelectionDelayMs: (ms: number) => void,
): UseCalibrationReturn {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibration, setCalibration] =
    useState<AutomationCalibrationResult | null>(null);
  const [calibrationText, setCalibrationText] = useState(
    'The quick brown fox jumps over the lazy dog. 1234567890',
  );
  const calibrationFieldRef = useRef<HTMLTextAreaElement | null>(null);

  // Handle calibration focus requests from main process
  useEffect(() => {
    const onFocusRequest = (event: Event) => {
      const request = (event as CustomEvent<AutomationCalibrationFocusRequest>)
        .detail;

      const el = document.getElementById('calibrationText');
      if (!(el instanceof HTMLTextAreaElement)) {
        const response: AutomationCalibrationFocusResponse = {
          requestId: request.requestId,
          ok: false,
          reason: 'Calibration field not found.',
        };
        window.dispatchEvent(
          new CustomEvent<AutomationCalibrationFocusResponse>(
            IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
            { detail: response },
          ),
        );
        return;
      }

      if (el.value !== request.expectedText) {
        const response: AutomationCalibrationFocusResponse = {
          requestId: request.requestId,
          ok: false,
          reason: 'Calibration text mismatch.',
        };
        window.dispatchEvent(
          new CustomEvent<AutomationCalibrationFocusResponse>(
            IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
            { detail: response },
          ),
        );
        return;
      }

      el.focus();
      el.select();

      const ok = document.activeElement === el;
      const response: AutomationCalibrationFocusResponse = {
        requestId: request.requestId,
        ok,
        reason: ok ? null : 'Calibration field not focused.',
      };
      window.dispatchEvent(
        new CustomEvent<AutomationCalibrationFocusResponse>(
          IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
          { detail: response },
        ),
      );
    };

    window.addEventListener(
      IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
      onFocusRequest,
    );
    return () => {
      window.removeEventListener(
        IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
        onFocusRequest,
      );
    };
  }, []);

  const handleCalibrate = useCallback(async () => {
    if (isSaving || isCalibrating) return;

    setIsCalibrating(true);
    try {
      calibrationFieldRef.current?.focus();
      calibrationFieldRef.current?.select();

      const result = await calibrateDelays(calibrationText);
      setCalibration(result);

      if (!result.success) {
        toastManager.add({
          type: 'error',
          title: 'Calibration failed',
          description: result.reason,
        });
        return;
      }

      const nextClipboardSyncDelayMs = result.recommended.clipboardSyncDelayMs;
      const nextSelectionDelayMs = result.recommended.selectionDelayMs;

      setClipboardSyncDelayMs(nextClipboardSyncDelayMs);
      setSelectionDelayMs(nextSelectionDelayMs);

      const currentSettings = await getSettings();
      await updateSettings({
        ...currentSettings,
        automation: {
          clipboardSyncDelayMs: nextClipboardSyncDelayMs,
          selectionDelayMs: nextSelectionDelayMs,
        },
      });

      toastManager.add({
        type: 'success',
        title: 'Automation calibrated and saved',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        type: 'error',
        title: 'Calibration failed',
        description: message,
      });
    } finally {
      setIsCalibrating(false);
    }
  }, [
    isSaving,
    isCalibrating,
    calibrationText,
    setClipboardSyncDelayMs,
    setSelectionDelayMs,
  ]);

  return {
    isCalibrating,
    calibration,
    calibrationText,
    setCalibrationText,
    calibrationFieldRef,
    handleCalibrate,
  };
}

/**
 * useCalibration hook tests
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type {
  AutomationCalibrationFocusRequest,
  AutomationCalibrationFocusResponse,
  AutomationCalibrationResult,
} from '@/shared/types/automation';

// Use vi.hoisted to define mocks before they're used in vi.mock
const {
  mockCalibrateDelays,
  mockGetSettings,
  mockUpdateSettings,
  mockToastAdd,
} = vi.hoisted(() => ({
  mockCalibrateDelays: vi.fn(),
  mockGetSettings: vi.fn(),
  mockUpdateSettings: vi.fn(),
  mockToastAdd: vi.fn(),
}));

vi.mock('@/actions/automation', () => ({
  calibrateDelays: mockCalibrateDelays,
}));

vi.mock('@/actions/settings', () => ({
  getSettings: mockGetSettings,
  updateSettings: mockUpdateSettings,
}));

vi.mock('@/renderer/components/ui/toast', () => ({
  toastManager: { add: mockToastAdd },
}));

import { useCalibration } from '@/renderer/features/settings/hooks/use-calibration';

// Test utilities - use explicit literal types for discriminated union
const createSuccessCalibrationResult = () => ({
  success: true as const,
  measuredClipboardMs: { samplesMs: [50, 60, 70], p95Ms: 68, maxMs: 70 },
  recommended: { clipboardSyncDelayMs: 150, selectionDelayMs: 80 },
});

const createFailedCalibrationResult = (reason: string) => ({
  success: false as const,
  reason,
});

const createDefaultSettings = () => ({
  hotkeys: {
    fixSelection: 'CommandOrControl+Shift+F',
    togglePopup: 'CommandOrControl+Shift+P',
  },
  ai: {
    provider: 'google' as const,
    model: 'gemini-3-flash-preview' as const,
    role: 'grammar' as const,
  },
  automation: {
    clipboardSyncDelayMs: 200,
    selectionDelayMs: 100,
  },
});

const DEFAULT_CALIBRATION_TEXT =
  'The quick brown fox jumps over the lazy dog. 1234567890';

describe('useCalibration', () => {
  let mockSetClipboardSyncDelayMs: (ms: number) => void;
  let mockSetSelectionDelayMs: (ms: number) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetClipboardSyncDelayMs = vi.fn();
    mockSetSelectionDelayMs = vi.fn();
    mockGetSettings.mockResolvedValue(createDefaultSettings());
    mockUpdateSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with isCalibrating=false', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      expect(result.current.isCalibrating).toBe(false);
    });

    it('should initialize with calibration=null', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      expect(result.current.calibration).toBeNull();
    });

    it('should initialize with default calibration text', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      expect(result.current.calibrationText).toBe(DEFAULT_CALIBRATION_TEXT);
    });

    it('should provide a ref for calibration field', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      expect(result.current.calibrationFieldRef).toBeDefined();
      expect(result.current.calibrationFieldRef.current).toBeNull();
    });
  });

  describe('State Machine Transitions', () => {
    it('should set isCalibrating=true when starting calibration', async () => {
      mockCalibrateDelays.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(createSuccessCalibrationResult()), 100);
          }),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      // Start calibration but don't await
      act(() => {
        result.current.handleCalibrate();
      });

      // Check that isCalibrating is true during the operation
      expect(result.current.isCalibrating).toBe(true);
    });

    it('should set isCalibrating=false after successful calibration', async () => {
      mockCalibrateDelays.mockResolvedValue(createSuccessCalibrationResult());

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(result.current.isCalibrating).toBe(false);
    });

    it('should set isCalibrating=false after failed calibration', async () => {
      mockCalibrateDelays.mockResolvedValue(
        createFailedCalibrationResult('Calibration failed'),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(result.current.isCalibrating).toBe(false);
    });

    it('should set isCalibrating=false after exception', async () => {
      mockCalibrateDelays.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(result.current.isCalibrating).toBe(false);
    });

    it('should not start calibration if already calibrating', async () => {
      let resolveCalibration: (value: AutomationCalibrationResult) => void;
      mockCalibrateDelays.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCalibration = resolve;
          }),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      // Start first calibration
      act(() => {
        result.current.handleCalibrate();
      });

      expect(result.current.isCalibrating).toBe(true);
      expect(mockCalibrateDelays).toHaveBeenCalledTimes(1);

      // Try to start second calibration while first is in progress
      await act(async () => {
        await result.current.handleCalibrate();
      });

      // Should still only have been called once
      expect(mockCalibrateDelays).toHaveBeenCalledTimes(1);

      // Cleanup: resolve the pending promise
      await act(async () => {
        resolveCalibration?.(createSuccessCalibrationResult());
      });
    });

    it('should not start calibration if isSaving=true', async () => {
      const { result } = renderHook(() =>
        useCalibration(
          true,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockCalibrateDelays).not.toHaveBeenCalled();
      expect(result.current.isCalibrating).toBe(false);
    });
  });

  describe('Success Flow', () => {
    it('should call calibrateDelays with calibrationText', async () => {
      mockCalibrateDelays.mockResolvedValue(createSuccessCalibrationResult());

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockCalibrateDelays).toHaveBeenCalledWith(
        DEFAULT_CALIBRATION_TEXT,
      );
    });

    it('should call calibrateDelays with custom calibrationText', async () => {
      mockCalibrateDelays.mockResolvedValue(createSuccessCalibrationResult());

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const customText = 'Custom calibration text';
      act(() => {
        result.current.setCalibrationText(customText);
      });

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockCalibrateDelays).toHaveBeenCalledWith(customText);
    });

    it('should update calibration state with result', async () => {
      const successResult = createSuccessCalibrationResult();
      mockCalibrateDelays.mockResolvedValue(successResult);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(result.current.calibration).toEqual(successResult);
    });

    it('should call setClipboardSyncDelayMs with recommended value', async () => {
      const successResult = createSuccessCalibrationResult();
      mockCalibrateDelays.mockResolvedValue(successResult);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockSetClipboardSyncDelayMs).toHaveBeenCalledWith(
        successResult.recommended.clipboardSyncDelayMs,
      );
    });

    it('should call setSelectionDelayMs with recommended value', async () => {
      const successResult = createSuccessCalibrationResult();
      mockCalibrateDelays.mockResolvedValue(successResult);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockSetSelectionDelayMs).toHaveBeenCalledWith(
        successResult.recommended.selectionDelayMs,
      );
    });

    it('should persist settings via updateSettings', async () => {
      const successResult = createSuccessCalibrationResult();
      mockCalibrateDelays.mockResolvedValue(successResult);
      const currentSettings = createDefaultSettings();
      mockGetSettings.mockResolvedValue(currentSettings);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockGetSettings).toHaveBeenCalled();
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        ...currentSettings,
        automation: {
          clipboardSyncDelayMs: successResult.recommended.clipboardSyncDelayMs,
          selectionDelayMs: successResult.recommended.selectionDelayMs,
        },
      });
    });

    it('should show success toast on completion', async () => {
      mockCalibrateDelays.mockResolvedValue(createSuccessCalibrationResult());

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'Automation calibrated and saved',
      });
    });
  });

  describe('Failure Flow', () => {
    it('should show error toast when result.success=false', async () => {
      const failedResult = createFailedCalibrationResult(
        'Clipboard not accessible',
      );
      mockCalibrateDelays.mockResolvedValue(failedResult);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Calibration failed',
        description: 'Clipboard not accessible',
      });
    });

    it('should not update delay setters on failure', async () => {
      mockCalibrateDelays.mockResolvedValue(
        createFailedCalibrationResult('Calibration failed'),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockSetClipboardSyncDelayMs).not.toHaveBeenCalled();
      expect(mockSetSelectionDelayMs).not.toHaveBeenCalled();
    });

    it('should not call updateSettings on failure', async () => {
      mockCalibrateDelays.mockResolvedValue(
        createFailedCalibrationResult('Calibration failed'),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('should show error toast with reason from result', async () => {
      const reason = 'Field not focused during calibration';
      mockCalibrateDelays.mockResolvedValue(
        createFailedCalibrationResult(reason),
      );

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Calibration failed',
        description: reason,
      });
    });

    it('should still update calibration state on failure', async () => {
      const failedResult = createFailedCalibrationResult('Calibration failed');
      mockCalibrateDelays.mockResolvedValue(failedResult);

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(result.current.calibration).toEqual(failedResult);
    });
  });

  describe('Exception Handling', () => {
    it('should catch and display Error message', async () => {
      const errorMessage = 'Network connection failed';
      mockCalibrateDelays.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Calibration failed',
        description: errorMessage,
      });
    });

    it('should catch and stringify non-Error exceptions', async () => {
      mockCalibrateDelays.mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Calibration failed',
        description: 'String error',
      });
    });

    it('should stringify object exceptions', async () => {
      mockCalibrateDelays.mockRejectedValue({ code: 'ERR_001' });

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Calibration failed',
        description: '[object Object]',
      });
    });

    it('should show error toast on exception', async () => {
      mockCalibrateDelays.mockRejectedValue(new Error('Unexpected error'));

      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      await act(async () => {
        await result.current.handleCalibrate();
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Calibration failed',
        }),
      );
    });
  });

  describe('Focus Request Event Handling', () => {
    const dispatchFocusRequest = (
      request: AutomationCalibrationFocusRequest,
    ) => {
      window.dispatchEvent(
        new CustomEvent<AutomationCalibrationFocusRequest>(
          IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
          { detail: request },
        ),
      );
    };

    const captureResponse = (): Promise<AutomationCalibrationFocusResponse> => {
      return new Promise((resolve) => {
        const handler = (event: Event) => {
          const response = (
            event as CustomEvent<AutomationCalibrationFocusResponse>
          ).detail;
          window.removeEventListener(
            IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
            handler,
          );
          resolve(response);
        };
        window.addEventListener(
          IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_RESPONSE,
          handler,
        );
      });
    };

    it('should register event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it('should unregister event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        IPC_CHANNELS.AUTOMATION_CALIBRATION_FOCUS_REQUEST,
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should respond with ok=false if field not found', async () => {
      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-1',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      const response = await responsePromise;

      expect(response).toEqual({
        requestId: 'test-request-1',
        ok: false,
        reason: 'Calibration field not found.',
      });
    });

    it('should respond with ok=false if text mismatch', async () => {
      // Create a textarea element with the correct id but wrong text
      const textarea = document.createElement('textarea');
      textarea.id = 'calibrationText';
      textarea.value = 'Different text';
      document.body.appendChild(textarea);

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-2',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      const response = await responsePromise;

      expect(response).toEqual({
        requestId: 'test-request-2',
        ok: false,
        reason: 'Calibration text mismatch.',
      });

      document.body.removeChild(textarea);
    });

    it('should focus and select field on valid request', async () => {
      // Create a textarea element with the correct id and text
      const textarea = document.createElement('textarea');
      textarea.id = 'calibrationText';
      textarea.value = DEFAULT_CALIBRATION_TEXT;
      document.body.appendChild(textarea);

      const focusSpy = vi.spyOn(textarea, 'focus');
      const selectSpy = vi.spyOn(textarea, 'select');

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-3',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      await responsePromise;

      expect(focusSpy).toHaveBeenCalled();
      expect(selectSpy).toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('should respond with ok=true if focus succeeds', async () => {
      // Create a textarea element with the correct id and text
      const textarea = document.createElement('textarea');
      textarea.id = 'calibrationText';
      textarea.value = DEFAULT_CALIBRATION_TEXT;
      document.body.appendChild(textarea);

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-4',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      const response = await responsePromise;

      expect(response.requestId).toBe('test-request-4');
      expect(response.ok).toBe(true);
      expect(response.reason).toBeNull();

      document.body.removeChild(textarea);
    });

    it('should respond with ok=false if focus fails', async () => {
      // Create a textarea element with the correct id and text
      const textarea = document.createElement('textarea');
      textarea.id = 'calibrationText';
      textarea.value = DEFAULT_CALIBRATION_TEXT;
      document.body.appendChild(textarea);

      // Mock focus to not actually focus the element
      vi.spyOn(textarea, 'focus').mockImplementation(() => {
        // Don't actually focus - simulate focus failure
      });

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-5',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      const response = await responsePromise;

      expect(response.requestId).toBe('test-request-5');
      expect(response.ok).toBe(false);
      expect(response.reason).toBe('Calibration field not focused.');

      document.body.removeChild(textarea);
    });

    it('should respond with ok=false if element is not a textarea', async () => {
      // Create a div element with the correct id (not a textarea)
      const div = document.createElement('div');
      div.id = 'calibrationText';
      document.body.appendChild(div);

      renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const responsePromise = captureResponse();

      dispatchFocusRequest({
        requestId: 'test-request-6',
        expectedText: DEFAULT_CALIBRATION_TEXT,
      });

      const response = await responsePromise;

      expect(response).toEqual({
        requestId: 'test-request-6',
        ok: false,
        reason: 'Calibration field not found.',
      });

      document.body.removeChild(div);
    });
  });

  describe('setCalibrationText', () => {
    it('should update calibrationText state', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const newText = 'New calibration text';
      act(() => {
        result.current.setCalibrationText(newText);
      });

      expect(result.current.calibrationText).toBe(newText);
    });
  });

  describe('calibrationFieldRef', () => {
    it('should be assignable to a textarea element', () => {
      const { result } = renderHook(() =>
        useCalibration(
          false,
          mockSetClipboardSyncDelayMs,
          mockSetSelectionDelayMs,
        ),
      );

      const textarea = document.createElement('textarea');

      act(() => {
        (
          result.current
            .calibrationFieldRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = textarea;
      });

      expect(result.current.calibrationFieldRef.current).toBe(textarea);
    });
  });
});

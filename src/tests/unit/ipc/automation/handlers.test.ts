/**
 * Automation IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let clipboardText = '';

const {
  mockBackupClipboard,
  mockRestoreClipboard,
  mockReadClipboard,
  mockWriteClipboard,
  mockPressCopyShortcut,
  mockSimulateCopy,
  mockSimulatePaste,
  mockSimulateSelectAll,
  mockStoreGet,
  mockIpcContext,
} = vi.hoisted(() => {
  const mockBackupClipboard = vi.fn();
  const mockRestoreClipboard = vi.fn();
  const mockReadClipboard = vi.fn(() => clipboardText);
  const mockWriteClipboard = vi.fn((text: string) => {
    clipboardText = text;
  });

  const mockPressCopyShortcut = vi.fn(async () => {});
  const mockSimulateCopy = vi.fn(async () => {});
  const mockSimulatePaste = vi.fn(async () => {});
  const mockSimulateSelectAll = vi.fn(async () => {});

  const mockStoreGet = vi.fn();

  const mockIpcContext: { mainWindow: unknown } = {
    mainWindow: undefined,
  };

  return {
    mockBackupClipboard,
    mockRestoreClipboard,
    mockReadClipboard,
    mockWriteClipboard,
    mockPressCopyShortcut,
    mockSimulateCopy,
    mockSimulatePaste,
    mockSimulateSelectAll,
    mockStoreGet,
    mockIpcContext,
  };
});

vi.mock('@/main/automation/clipboard', () => ({
  backupClipboard: mockBackupClipboard,
  readClipboard: mockReadClipboard,
  restoreClipboard: mockRestoreClipboard,
  writeClipboard: mockWriteClipboard,
}));

vi.mock('@/main/automation/keyboard', () => ({
  pressCopyShortcut: mockPressCopyShortcut,
  simulateCopy: mockSimulateCopy,
  simulatePaste: mockSimulatePaste,
  simulateSelectAll: mockSimulateSelectAll,
}));

vi.mock('@/main/storage/settings', () => ({
  store: {
    get: mockStoreGet,
  },
}));

vi.mock('@/ipc/context', () => ({
  ipcContext: mockIpcContext,
}));

describe('Automation IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clipboardText = '';
    mockIpcContext.mainWindow = undefined;
    mockStoreGet.mockReturnValue(100);
  });

  it('captures clipboard text for selection mode', async () => {
    clipboardText = 'captured selection';
    mockSimulateCopy.mockImplementation(async () => {});

    const { captureText } = await import('@/ipc/automation/handlers');
    const callCaptureText = createProcedureClient(captureText);

    await expect(callCaptureText({ mode: 'selection' })).resolves.toEqual({
      text: 'captured selection',
      mode: 'selection',
    });
    expect(mockBackupClipboard).toHaveBeenCalledTimes(1);
    expect(mockSimulateSelectAll).not.toHaveBeenCalled();
    expect(mockSimulateCopy).toHaveBeenCalledTimes(1);
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });

  it('selects all before capturing when mode is field', async () => {
    clipboardText = 'captured field';

    const { captureText } = await import('@/ipc/automation/handlers');
    const callCaptureText = createProcedureClient(captureText);

    await expect(callCaptureText({ mode: 'field' })).resolves.toEqual({
      text: 'captured field',
      mode: 'field',
    });
    expect(mockSimulateSelectAll).toHaveBeenCalledTimes(1);
    expect(mockSimulateCopy).toHaveBeenCalledTimes(1);
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });

  it('restores clipboard if capture fails', async () => {
    mockSimulateCopy.mockRejectedValue(new Error('copy failed'));

    const { captureText } = await import('@/ipc/automation/handlers');
    const callCaptureText = createProcedureClient(captureText);

    await expect(callCaptureText({ mode: 'selection' })).rejects.toThrow(
      'copy failed',
    );
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });

  it('replaces text by writing clipboard and simulating paste', async () => {
    const { replaceText } = await import('@/ipc/automation/handlers');
    const callReplaceText = createProcedureClient(replaceText);

    await expect(callReplaceText({ text: 'replacement' })).resolves.toEqual({
      success: true,
    });
    expect(mockBackupClipboard).toHaveBeenCalledTimes(1);
    expect(mockWriteClipboard).toHaveBeenCalledWith('replacement');
    expect(mockSimulatePaste).toHaveBeenCalledTimes(1);
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });

  it('restores clipboard if replace fails', async () => {
    mockSimulatePaste.mockRejectedValue(new Error('paste failed'));

    const { replaceText } = await import('@/ipc/automation/handlers');
    const callReplaceText = createProcedureClient(replaceText);

    await expect(callReplaceText({ text: 'replacement' })).rejects.toThrow(
      'paste failed',
    );
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });

  it('returns a clear error when main window is not available for calibration', async () => {
    const { calibrateDelays } = await import('@/ipc/automation/handlers');
    const callCalibrate = createProcedureClient(calibrateDelays);

    await expect(callCalibrate({ expectedText: 'Hello' })).resolves.toEqual({
      success: false,
      reason: 'Main window is not available yet.',
    });
    expect(mockBackupClipboard).not.toHaveBeenCalled();
  });

  it('calibrates delays and recommends delays using measured samples', async () => {
    const mockWindow = {
      show: vi.fn(),
      focus: vi.fn(),
      isFocused: vi.fn(() => true),
      webContents: {
        executeJavaScript: vi.fn(async () => ({ ok: true, reason: null })),
      },
    };

    const expectedText = 'Calibration sample text';
    mockIpcContext.mainWindow = mockWindow;
    mockStoreGet.mockReturnValue(125);
    mockPressCopyShortcut.mockImplementation(async () => {
      clipboardText = expectedText;
    });

    const { calibrateDelays } = await import('@/ipc/automation/handlers');
    const callCalibrate = createProcedureClient(calibrateDelays);

    const result = await callCalibrate({ expectedText });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected calibration success');

    expect(mockWindow.show).toHaveBeenCalledTimes(1);
    expect(mockWindow.focus).toHaveBeenCalledTimes(1);
    expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledTimes(5);
    expect(mockPressCopyShortcut).toHaveBeenCalledTimes(5);
    expect(mockBackupClipboard).toHaveBeenCalledTimes(1);
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);

    expect(result.measuredClipboardMs.samplesMs).toHaveLength(5);
    expect(result.recommended.selectionDelayMs).toBe(125);
    expect(result.recommended.clipboardSyncDelayMs).toBeGreaterThanOrEqual(50);
    expect(result.recommended.clipboardSyncDelayMs).toBeLessThanOrEqual(2_000);
    expect(result.recommended.clipboardSyncDelayMs % 25).toBe(0);
  });

  it('falls back to default selection delay when setting is not a valid number', async () => {
    const mockWindow = {
      show: vi.fn(),
      focus: vi.fn(),
      isFocused: vi.fn(() => true),
      webContents: {
        executeJavaScript: vi.fn(async () => ({ ok: true, reason: null })),
      },
    };

    const expectedText = 'Calibration sample text';
    mockIpcContext.mainWindow = mockWindow;
    mockStoreGet.mockReturnValue(undefined);
    mockPressCopyShortcut.mockImplementation(async () => {
      clipboardText = expectedText;
    });

    const { calibrateDelays } = await import('@/ipc/automation/handlers');
    const callCalibrate = createProcedureClient(calibrateDelays);

    const result = await callCalibrate({ expectedText });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected calibration success');

    expect(result.recommended.selectionDelayMs).toBe(100);
  });

  it('returns structured failure when calibration cannot focus calibration field', async () => {
    const mockWindow = {
      show: vi.fn(),
      focus: vi.fn(),
      isFocused: vi.fn(() => true),
      webContents: {
        executeJavaScript: vi.fn(async () => ({
          ok: false,
          reason: 'Calibration field not found.',
        })),
      },
    };

    mockIpcContext.mainWindow = mockWindow;

    const { calibrateDelays } = await import('@/ipc/automation/handlers');
    const callCalibrate = createProcedureClient(calibrateDelays);

    await expect(callCalibrate({ expectedText: 'Hello' })).resolves.toEqual({
      success: false,
      reason: 'Calibration failed: Calibration field not found.',
    });
    expect(mockBackupClipboard).toHaveBeenCalledTimes(1);
    expect(mockRestoreClipboard).toHaveBeenCalledTimes(1);
  });
});

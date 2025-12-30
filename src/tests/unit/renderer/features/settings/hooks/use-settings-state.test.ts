/**
 * useSettingsState hook tests
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_HOTKEYS } from '@/shared/config/hotkeys';
import type { AppSettings } from '@/shared/types/settings';

// Use vi.hoisted to define mocks before they're used in vi.mock
// Default models for each provider (must match actual AI_PROVIDERS config)
const DEFAULT_MODELS: Record<string, string> = {
  google: 'gemini-3-flash-preview',
  xai: 'grok-4-1-fast-reasoning',
  openai: 'gpt-5.1',
  lmstudio: 'google/gemma-3n-e4b',
};

const {
  mockGetSettings,
  mockUpdateSettings,
  mockReregisterShortcuts,
  mockToastAdd,
  mockExtractFieldErrors,
  mockFocusFirstInvalidField,
  mockGetDefaultModel,
} = vi.hoisted(() => ({
  mockGetSettings: vi.fn(),
  mockUpdateSettings: vi.fn(),
  mockReregisterShortcuts: vi.fn(),
  mockToastAdd: vi.fn(),
  mockExtractFieldErrors: vi.fn(),
  mockFocusFirstInvalidField: vi.fn(),
  mockGetDefaultModel: vi.fn(
    (provider: string) => DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.google,
  ),
}));

vi.mock('@/actions/settings', () => ({
  getSettings: mockGetSettings,
  updateSettings: mockUpdateSettings,
}));

vi.mock('@/actions/shortcuts', () => ({
  reregisterShortcuts: mockReregisterShortcuts,
}));

vi.mock('@/renderer/components/ui/toast', () => ({
  toastManager: { add: mockToastAdd },
}));

vi.mock('@/renderer/lib/validation', () => ({
  extractFieldErrors: mockExtractFieldErrors,
  focusFirstInvalidField: mockFocusFirstInvalidField,
}));

vi.mock('@/shared/config/ai-models', async () => {
  const actual = await vi.importActual<
    typeof import('@/shared/config/ai-models')
  >('@/shared/config/ai-models');
  return {
    ...actual,
    getDefaultModel: mockGetDefaultModel,
  };
});

// Import after mocks are set up
import { useSettingsState } from '@/renderer/features/settings/hooks/use-settings-state';

// Test utilities
const createMockSettings = (
  overrides?: Partial<{
    ai: Partial<AppSettings['ai']>;
    hotkeys: Partial<AppSettings['hotkeys']>;
    automation: Partial<AppSettings['automation']>;
  }>,
): AppSettings => ({
  ai: {
    provider: 'google',
    model: 'gemini-3-flash-preview',
    role: 'grammar',
    reasoningEffort: 'medium',
    textVerbosity: 'medium',
    lmstudioBaseURL: 'http://localhost:1234/v1',
    ...overrides?.ai,
  },
  hotkeys: {
    fixSelection: DEFAULT_HOTKEYS.fixSelection,
    togglePopup: DEFAULT_HOTKEYS.togglePopup,
    ...overrides?.hotkeys,
  },
  automation: {
    clipboardSyncDelayMs: 200,
    selectionDelayMs: 100,
    ...overrides?.automation,
  },
});

const createMockFormEvent = (): React.FormEvent => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  nativeEvent: new Event('submit'),
  currentTarget: document.createElement('form'),
  target: document.createElement('form'),
  bubbles: true,
  cancelable: true,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  timeStamp: Date.now(),
  type: 'submit',
  isDefaultPrevented: () => false,
  isPropagationStopped: () => false,
  persist: () => {},
});

describe('useSettingsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue(createMockSettings());
    mockUpdateSettings.mockResolvedValue(undefined);
    mockReregisterShortcuts.mockResolvedValue(undefined);
    mockExtractFieldErrors.mockReturnValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default provider=google', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.provider).toBe('google');
    });

    it('should initialize with default model for google', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.model).toBe('gemini-3-flash-preview');
    });

    it('should initialize with default role=grammar', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.role).toBe('grammar');
    });

    it('should initialize with default reasoningEffort=medium', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.reasoningEffort).toBe('medium');
    });

    it('should initialize with default textVerbosity=medium', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.textVerbosity).toBe('medium');
    });

    it('should initialize with default lmstudioBaseURL', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.lmstudioBaseURL).toBe('http://localhost:1234/v1');
    });

    it('should initialize with default hotkeys', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.fixSelection).toBe(DEFAULT_HOTKEYS.fixSelection);
      expect(result.current.togglePopup).toBe(DEFAULT_HOTKEYS.togglePopup);
    });

    it('should initialize with default automation delays', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.clipboardSyncDelayMs).toBe(200);
      expect(result.current.selectionDelayMs).toBe(100);
    });

    it('should initialize with isSaving=false', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.isSaving).toBe(false);
    });

    it('should initialize with empty fieldErrors', () => {
      const { result } = renderHook(() => useSettingsState());

      expect(result.current.fieldErrors).toEqual({});
    });
  });

  describe('loadSettings on Mount', () => {
    it('should call getSettings on mount', async () => {
      renderHook(() => useSettingsState());

      await waitFor(() => {
        expect(mockGetSettings).toHaveBeenCalledTimes(1);
      });
    });

    it('should populate all state from loaded settings', async () => {
      const mockSettings = createMockSettings({
        ai: {
          provider: 'openai',
          model: 'gpt-5.1',
          role: 'grammar-tone',
          reasoningEffort: 'high',
          textVerbosity: 'low',
          lmstudioBaseURL: 'http://custom:5000/v1',
        },
        hotkeys: {
          fixSelection: 'CommandOrControl+Alt+G',
          togglePopup: 'CommandOrControl+Alt+P',
        },
        automation: {
          clipboardSyncDelayMs: 300,
          selectionDelayMs: 150,
        },
      });
      mockGetSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useSettingsState());

      await waitFor(() => {
        expect(result.current.provider).toBe('openai');
        expect(result.current.model).toBe('gpt-5.1');
        expect(result.current.role).toBe('grammar-tone');
        expect(result.current.reasoningEffort).toBe('high');
        expect(result.current.textVerbosity).toBe('low');
        expect(result.current.lmstudioBaseURL).toBe('http://custom:5000/v1');
        expect(result.current.fixSelection).toBe('CommandOrControl+Alt+G');
        expect(result.current.togglePopup).toBe('CommandOrControl+Alt+P');
        expect(result.current.clipboardSyncDelayMs).toBe(300);
        expect(result.current.selectionDelayMs).toBe(150);
      });
    });

    it('should handle missing optional fields with defaults', async () => {
      const mockSettings = {
        ai: {
          provider: 'google' as const,
          model: 'gemini-3-flash-preview',
          role: 'grammar' as const,
          // reasoningEffort, textVerbosity, lmstudioBaseURL are missing
        },
        hotkeys: {
          fixSelection: DEFAULT_HOTKEYS.fixSelection,
          togglePopup: DEFAULT_HOTKEYS.togglePopup,
        },
        automation: {
          clipboardSyncDelayMs: 200,
          selectionDelayMs: 100,
        },
      };
      mockGetSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useSettingsState());

      await waitFor(() => {
        expect(result.current.reasoningEffort).toBe('medium');
        expect(result.current.textVerbosity).toBe('medium');
        expect(result.current.lmstudioBaseURL).toBe('http://localhost:1234/v1');
      });
    });

    it('should log error if getSettings fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Failed to load');
      mockGetSettings.mockRejectedValue(error);

      renderHook(() => useSettingsState());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load settings:',
          error,
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not throw if getSettings fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetSettings.mockRejectedValue(new Error('Failed to load'));

      // Should not throw
      expect(() => {
        renderHook(() => useSettingsState());
      }).not.toThrow();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleProviderChange', () => {
    it('should update provider state', async () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.handleProviderChange('openai');
      });

      expect(result.current.provider).toBe('openai');
    });

    it('should reset model to default for new provider', async () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.handleProviderChange('xai');
      });

      expect(mockGetDefaultModel).toHaveBeenCalledWith('xai');
      expect(result.current.model).toBe('grok-4-1-fast-reasoning');
    });

    it('should set default lmstudioBaseURL when switching to lmstudio', async () => {
      const { result } = renderHook(() => useSettingsState());

      // First clear the lmstudioBaseURL
      act(() => {
        result.current.setLmstudioBaseURL('');
      });

      expect(result.current.lmstudioBaseURL).toBe('');

      // Now switch to lmstudio
      act(() => {
        result.current.handleProviderChange('lmstudio');
      });

      expect(result.current.lmstudioBaseURL).toBe('http://localhost:1234/v1');
    });

    it('should preserve existing lmstudioBaseURL if already set', async () => {
      const { result } = renderHook(() => useSettingsState());

      // Set a custom URL
      act(() => {
        result.current.setLmstudioBaseURL('http://custom:8080/v1');
      });

      // Switch to lmstudio
      act(() => {
        result.current.handleProviderChange('lmstudio');
      });

      // Should preserve the custom URL
      expect(result.current.lmstudioBaseURL).toBe('http://custom:8080/v1');
    });
  });

  describe('handleSaveSettings - Validation', () => {
    it('should prevent save if already saving (guard condition)', async () => {
      // Create a slow updateSettings to keep isSaving=true
      let resolveUpdate: (value: unknown) => void;
      mockUpdateSettings.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event1 = createMockFormEvent();
      const event2 = createMockFormEvent();

      // Start first save
      act(() => {
        result.current.handleSaveSettings(event1);
      });

      expect(result.current.isSaving).toBe(true);

      // Try second save while first is in progress
      await act(async () => {
        await result.current.handleSaveSettings(event2);
      });

      // updateSettings should only be called once
      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);

      // Cleanup
      await act(async () => {
        resolveUpdate?.(undefined);
      });
    });

    it('should set isSaving=true during save', async () => {
      let resolveUpdate: (value: unknown) => void;
      mockUpdateSettings.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      act(() => {
        result.current.handleSaveSettings(event);
      });

      expect(result.current.isSaving).toBe(true);

      // Cleanup
      await act(async () => {
        resolveUpdate?.(undefined);
      });
    });

    it('should validate settings against appSettingsSchema', async () => {
      // Set invalid hotkey to trigger validation failure
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      act(() => {
        result.current.setFixSelection('invalid'); // Invalid hotkey format
      });

      mockExtractFieldErrors.mockReturnValue({
        'hotkeys.fixSelection': 'Invalid hotkey format',
      });

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      // Should not call updateSettings due to validation failure
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('should set fieldErrors on validation failure', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      act(() => {
        result.current.setFixSelection('invalid');
      });

      const errors = { 'hotkeys.fixSelection': 'Invalid hotkey format' };
      mockExtractFieldErrors.mockReturnValue(errors);

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(result.current.fieldErrors).toEqual(errors);
    });

    it('should call focusFirstInvalidField on validation failure', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      act(() => {
        result.current.setFixSelection('invalid');
      });

      const errors = { 'hotkeys.fixSelection': 'Invalid hotkey format' };
      mockExtractFieldErrors.mockReturnValue(errors);

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockFocusFirstInvalidField).toHaveBeenCalledWith(errors);
    });

    it('should set isSaving=false after validation failure', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      act(() => {
        result.current.setFixSelection('invalid');
      });

      mockExtractFieldErrors.mockReturnValue({
        'hotkeys.fixSelection': 'Invalid hotkey format',
      });

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should clear fieldErrors before validation', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      // First, set some errors
      act(() => {
        result.current.setFixSelection('invalid');
      });

      mockExtractFieldErrors.mockReturnValue({
        'hotkeys.fixSelection': 'Invalid hotkey format',
      });

      const event1 = createMockFormEvent();
      await act(async () => {
        await result.current.handleSaveSettings(event1);
      });

      expect(result.current.fieldErrors).toEqual({
        'hotkeys.fixSelection': 'Invalid hotkey format',
      });

      // Now fix the error and save again
      act(() => {
        result.current.setFixSelection('CommandOrControl+Shift+G');
      });

      // Mock successful validation
      mockExtractFieldErrors.mockReturnValue({});

      const event2 = createMockFormEvent();
      await act(async () => {
        await result.current.handleSaveSettings(event2);
      });

      // fieldErrors should be cleared
      expect(result.current.fieldErrors).toEqual({});
    });
  });

  describe('handleSaveSettings - Success Flow', () => {
    it('should call updateSettings with validated data', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockUpdateSettings).toHaveBeenCalledTimes(1);
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          ai: expect.objectContaining({
            provider: 'google',
            model: expect.any(String),
            role: 'grammar',
          }),
          hotkeys: expect.objectContaining({
            fixSelection: expect.any(String),
            togglePopup: expect.any(String),
          }),
          automation: expect.objectContaining({
            clipboardSyncDelayMs: expect.any(Number),
            selectionDelayMs: expect.any(Number),
          }),
        }),
      );
    });

    it('should call reregisterShortcuts after updateSettings', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockReregisterShortcuts).toHaveBeenCalledTimes(1);
      // Verify order: updateSettings before reregisterShortcuts
      const updateOrder = mockUpdateSettings.mock.invocationCallOrder[0];
      const reregisterOrder =
        mockReregisterShortcuts.mock.invocationCallOrder[0];
      expect(updateOrder).toBeDefined();
      expect(reregisterOrder).toBeDefined();
      if (updateOrder !== undefined && reregisterOrder !== undefined) {
        expect(updateOrder).toBeLessThan(reregisterOrder);
      }
    });

    it('should show success toast on completion', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'success',
        title: 'Settings saved',
      });
    });

    it('should set isSaving=false after success', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should only include lmstudioBaseURL when provider=lmstudio', async () => {
      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      // With google provider, lmstudioBaseURL should be undefined
      const event1 = createMockFormEvent();
      await act(async () => {
        await result.current.handleSaveSettings(event1);
      });

      expect(mockUpdateSettings).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ai: expect.objectContaining({
            lmstudioBaseURL: undefined,
          }),
        }),
      );

      mockUpdateSettings.mockClear();

      // Switch to lmstudio
      act(() => {
        result.current.handleProviderChange('lmstudio');
      });

      const event2 = createMockFormEvent();
      await act(async () => {
        await result.current.handleSaveSettings(event2);
      });

      expect(mockUpdateSettings).toHaveBeenLastCalledWith(
        expect.objectContaining({
          ai: expect.objectContaining({
            lmstudioBaseURL: 'http://localhost:1234/v1',
          }),
        }),
      );
    });
  });

  describe('handleSaveSettings - Error Handling', () => {
    it('should show error toast when updateSettings fails', async () => {
      mockUpdateSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to save settings',
        description: 'Update failed',
      });
    });

    it('should show error toast when reregisterShortcuts fails', async () => {
      mockReregisterShortcuts.mockRejectedValue(
        new Error('Shortcut registration failed'),
      );

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockToastAdd).toHaveBeenCalledWith({
        type: 'error',
        title: 'Failed to save settings',
        description: 'Shortcut registration failed',
      });
    });

    it('should set isSaving=false after error', async () => {
      mockUpdateSettings.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should extract message from Error objects', async () => {
      const errorMessage = 'Specific error message';
      mockUpdateSettings.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          description: errorMessage,
        }),
      );
    });

    it('should stringify non-Error exceptions', async () => {
      mockUpdateSettings.mockRejectedValue('String error');

      const { result } = renderHook(() => useSettingsState());
      await waitFor(() => expect(mockGetSettings).toHaveBeenCalled());

      const event = createMockFormEvent();

      await act(async () => {
        await result.current.handleSaveSettings(event);
      });

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'String error',
        }),
      );
    });
  });

  describe('State Setters', () => {
    it('should update provider via setProvider', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setProvider('xai');
      });

      expect(result.current.provider).toBe('xai');
    });

    it('should update model via setModel', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setModel('custom-model');
      });

      expect(result.current.model).toBe('custom-model');
    });

    it('should update role via setRole', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setRole('grammar-tone');
      });

      expect(result.current.role).toBe('grammar-tone');
    });

    it('should update reasoningEffort via setReasoningEffort', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setReasoningEffort('high');
      });

      expect(result.current.reasoningEffort).toBe('high');
    });

    it('should update textVerbosity via setTextVerbosity', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setTextVerbosity('high');
      });

      expect(result.current.textVerbosity).toBe('high');
    });

    it('should update lmstudioBaseURL via setLmstudioBaseURL', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setLmstudioBaseURL('http://custom:9000/v1');
      });

      expect(result.current.lmstudioBaseURL).toBe('http://custom:9000/v1');
    });

    it('should update fixSelection via setFixSelection', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setFixSelection('CommandOrControl+Alt+X');
      });

      expect(result.current.fixSelection).toBe('CommandOrControl+Alt+X');
    });

    it('should update togglePopup via setTogglePopup', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setTogglePopup('CommandOrControl+Alt+Y');
      });

      expect(result.current.togglePopup).toBe('CommandOrControl+Alt+Y');
    });

    it('should update clipboardSyncDelayMs via setClipboardSyncDelayMs', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setClipboardSyncDelayMs(500);
      });

      expect(result.current.clipboardSyncDelayMs).toBe(500);
    });

    it('should update selectionDelayMs via setSelectionDelayMs', () => {
      const { result } = renderHook(() => useSettingsState());

      act(() => {
        result.current.setSelectionDelayMs(250);
      });

      expect(result.current.selectionDelayMs).toBe(250);
    });
  });
});

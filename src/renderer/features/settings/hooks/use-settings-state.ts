/**
 * Settings state management hook
 */
import { useCallback, useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/actions/settings';
import { reregisterShortcuts } from '@/actions/shortcuts';
import { toastManager } from '@/renderer/components/ui/toast';
import {
  extractFieldErrors,
  focusFirstInvalidField,
} from '@/renderer/lib/validation';
import { type AIProvider, getDefaultModel } from '@/shared/config/ai-models';
import { appSettingsSchema } from '@/shared/schemas/settings';
import type { RewriteRole } from '@/shared/types/ai';
import type {
  AppSettings,
  ReasoningEffort,
  TextVerbosity,
} from '@/shared/types/settings';

export interface UseSettingsStateReturn {
  // AI settings
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  model: string;
  setModel: (model: string) => void;
  role: RewriteRole;
  setRole: (role: RewriteRole) => void;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  textVerbosity: TextVerbosity;
  setTextVerbosity: (verbosity: TextVerbosity) => void;
  lmstudioBaseURL: string;
  setLmstudioBaseURL: (url: string) => void;

  // Hotkey settings
  fixSelection: string;
  setFixSelection: (hotkey: string) => void;
  togglePopup: string;
  setTogglePopup: (hotkey: string) => void;

  // Automation settings
  clipboardSyncDelayMs: number;
  setClipboardSyncDelayMs: (ms: number) => void;
  selectionDelayMs: number;
  setSelectionDelayMs: (ms: number) => void;

  // Form state
  isSaving: boolean;
  fieldErrors: Record<string, string>;

  // Handlers
  handleProviderChange: (provider: AIProvider) => void;
  handleSaveSettings: (event: React.FormEvent) => Promise<void>;
}

export function useSettingsState(): UseSettingsStateReturn {
  const [provider, setProvider] = useState<AIProvider>('google');
  const [model, setModel] = useState<string>(getDefaultModel('google'));
  const [role, setRole] = useState<RewriteRole>('grammar');
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>('medium');
  const [textVerbosity, setTextVerbosity] = useState<TextVerbosity>('medium');
  const [lmstudioBaseURL, setLmstudioBaseURL] = useState(
    'http://localhost:1234/v1',
  );
  const [fixSelection, setFixSelection] = useState('CommandOrControl+Shift+F');
  const [togglePopup, setTogglePopup] = useState('CommandOrControl+Shift+P');
  const [clipboardSyncDelayMs, setClipboardSyncDelayMs] = useState(200);
  const [selectionDelayMs, setSelectionDelayMs] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      setProvider(settings.ai.provider);
      setModel(settings.ai.model);
      setRole(settings.ai.role);
      setReasoningEffort(settings.ai.reasoningEffort ?? 'medium');
      setTextVerbosity(settings.ai.textVerbosity ?? 'medium');
      setLmstudioBaseURL(
        settings.ai.lmstudioBaseURL ?? 'http://localhost:1234/v1',
      );
      setFixSelection(settings.hotkeys.fixSelection);
      setTogglePopup(settings.hotkeys.togglePopup);
      setClipboardSyncDelayMs(settings.automation.clipboardSyncDelayMs);
      setSelectionDelayMs(settings.automation.selectionDelayMs);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleProviderChange = useCallback((newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
    if (newProvider === 'lmstudio') {
      setLmstudioBaseURL((prev) => prev || 'http://localhost:1234/v1');
    }
  }, []);

  const handleSaveSettings = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setIsSaving(true);
      setFieldErrors({});

      const candidateSettings = {
        ai: {
          provider,
          model,
          role,
          reasoningEffort,
          textVerbosity,
          lmstudioBaseURL:
            provider === 'lmstudio' ? lmstudioBaseURL : undefined,
        },
        hotkeys: { fixSelection, togglePopup },
        automation: { clipboardSyncDelayMs, selectionDelayMs },
      };

      const result = appSettingsSchema.safeParse(candidateSettings);
      if (!result.success) {
        const errors = extractFieldErrors(result.error);
        setFieldErrors(errors);
        focusFirstInvalidField(errors);
        setIsSaving(false);
        return;
      }

      try {
        await updateSettings(result.data as AppSettings);
        await reregisterShortcuts();
        toastManager.add({ type: 'success', title: 'Settings saved' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastManager.add({
          type: 'error',
          title: 'Failed to save settings',
          description: message,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      provider,
      model,
      role,
      reasoningEffort,
      textVerbosity,
      lmstudioBaseURL,
      fixSelection,
      togglePopup,
      clipboardSyncDelayMs,
      selectionDelayMs,
    ],
  );

  return {
    provider,
    setProvider,
    model,
    setModel,
    role,
    setRole,
    reasoningEffort,
    setReasoningEffort,
    textVerbosity,
    setTextVerbosity,
    lmstudioBaseURL,
    setLmstudioBaseURL,
    fixSelection,
    setFixSelection,
    togglePopup,
    setTogglePopup,
    clipboardSyncDelayMs,
    setClipboardSyncDelayMs,
    selectionDelayMs,
    setSelectionDelayMs,
    isSaving,
    fieldErrors,
    handleProviderChange,
    handleSaveSettings,
  };
}

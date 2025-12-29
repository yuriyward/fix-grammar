/**
 * Settings form component
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { calibrateDelays } from '@/actions/automation';
import {
  isEncryptionAvailable as checkEncryptionAvailable,
  deleteApiKey,
  getSettings,
  hasApiKey,
  saveApiKey,
  testLMStudioConnection,
  updateSettings,
} from '@/actions/settings';
import { reregisterShortcuts } from '@/actions/shortcuts';
import LangToggle from '@/renderer/components/lang-toggle';
import ToggleTheme from '@/renderer/components/toggle-theme';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/renderer/components/ui/alert';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from '@/renderer/components/ui/card';
import {
  Combobox,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/renderer/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/renderer/components/ui/field';
import { Form } from '@/renderer/components/ui/form';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Textarea } from '@/renderer/components/ui/textarea';
import { toastManager } from '@/renderer/components/ui/toast';
import {
  extractFieldErrors,
  focusFirstInvalidField,
} from '@/renderer/lib/validation';
import {
  AI_PROVIDERS,
  type AIProvider,
  getDefaultModel,
  getModelsForProvider,
  getProviderName,
} from '@/shared/config/ai-models';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import { appSettingsSchema } from '@/shared/schemas/settings';
import type { RewriteRole } from '@/shared/types/ai';
import type {
  AutomationCalibrationFocusRequest,
  AutomationCalibrationFocusResponse,
  AutomationCalibrationResult,
} from '@/shared/types/automation';
import type { ReasoningEffort, TextVerbosity } from '@/shared/types/settings';

export default function SettingsForm() {
  const [provider, setProvider] = useState<AIProvider>('google');
  const [model, setModel] = useState<string>(getDefaultModel('google'));
  const [role, setRole] = useState<RewriteRole>('grammar');
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>('medium');
  const [textVerbosity, setTextVerbosity] = useState<TextVerbosity>('medium');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyPreview, setApiKeyPreview] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEncryptionAvailable, setIsEncryptionAvailable] = useState<
    boolean | null
  >(null);
  const [lmstudioBaseURL, setLmstudioBaseURL] = useState(
    'http://localhost:1234/v1',
  );
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [lmstudioDiscoveredModels, setLmstudioDiscoveredModels] = useState<
    string[]
  >([]);
  const [lmstudioModelsBaseURL, setLmstudioModelsBaseURL] = useState<
    string | null
  >(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fixSelection, setFixSelection] = useState('CommandOrControl+Shift+F');
  const [togglePopup, setTogglePopup] = useState('CommandOrControl+Shift+P');

  const [clipboardSyncDelayMs, setClipboardSyncDelayMs] = useState(200);
  const [selectionDelayMs, setSelectionDelayMs] = useState(100);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibration, setCalibration] =
    useState<AutomationCalibrationResult | null>(null);

  const [calibrationText, setCalibrationText] = useState(
    'The quick brown fox jumps over the lazy dog. 1234567890',
  );
  const calibrationFieldRef = useRef<HTMLTextAreaElement | null>(null);

  const addSuccessToast = (title: string) => {
    toastManager.add({ type: 'success', title });
  };

  const addErrorToast = (title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    toastManager.add({ type: 'error', title, description: message });
  };

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

  const loadApiKeyStatus = useCallback(async () => {
    try {
      const result = await hasApiKey(provider);
      setHasKey(result.hasKey);
      setApiKeyPreview(result.preview ?? '');
    } catch (error) {
      console.error('Failed to check API key:', error);
    }
  }, [provider]);

  useEffect(() => {
    void loadSettings();
    void (async () => {
      try {
        const available = await checkEncryptionAvailable();
        setIsEncryptionAvailable(available);
      } catch (error) {
        console.error('Failed to check encryption availability:', error);
        // Default to true if check fails to avoid blocking users unnecessarily,
        // though typically this shouldn't fail if IPC is working.
        setIsEncryptionAvailable(true);
      }
    })();
  }, [loadSettings]);

  useEffect(() => {
    void loadApiKeyStatus();
  }, [loadApiKeyStatus]);

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

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
    setLmstudioDiscoveredModels([]);
    setLmstudioModelsBaseURL(null);

    if (newProvider === 'lmstudio' && !lmstudioBaseURL) {
      setLmstudioBaseURL('http://localhost:1234/v1');
    }
  };

  useEffect(() => {
    if (provider !== 'lmstudio') return;
    const trimmed = lmstudioBaseURL.trim();
    if (!lmstudioModelsBaseURL || trimmed === lmstudioModelsBaseURL) return;
    setLmstudioDiscoveredModels([]);
    setLmstudioModelsBaseURL(null);
  }, [provider, lmstudioBaseURL, lmstudioModelsBaseURL]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    try {
      await saveApiKey(provider, apiKey);
      setApiKey('');
      await loadApiKeyStatus();
      addSuccessToast('API key saved');
    } catch (error) {
      addErrorToast('Failed to save API key', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    setIsSaving(true);
    try {
      await deleteApiKey(provider);
      await loadApiKeyStatus();
      addSuccessToast('API key deleted');
    } catch (error) {
      addErrorToast('Failed to delete API key', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchLMStudioModels = async () => {
    if (!lmstudioBaseURL.trim()) {
      addErrorToast('Fetch Models Failed', new Error('Base URL is required'));
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await testLMStudioConnection(lmstudioBaseURL.trim());

      if (result.success) {
        const models = Array.from(
          new Set((result.models ?? []).map((entry) => entry.trim())),
        ).filter((entry) => entry.length > 0);
        setLmstudioDiscoveredModels(models);
        setLmstudioModelsBaseURL(lmstudioBaseURL.trim());
        addSuccessToast(result.message || 'Models fetched');
      } else {
        addErrorToast(
          'Fetch Models Failed',
          new Error(result.error || 'Unknown error'),
        );
      }
    } catch (error) {
      addErrorToast('Fetch Models Failed', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submit
    if (isSaving) return;
    setIsSaving(true);
    setFieldErrors({}); // Clear previous errors

    // Build settings object from React state (controlled components)
    const candidateSettings = {
      ai: {
        provider,
        model,
        role,
        reasoningEffort,
        textVerbosity,
        lmstudioBaseURL: provider === 'lmstudio' ? lmstudioBaseURL : undefined,
      },
      hotkeys: { fixSelection, togglePopup },
      automation: { clipboardSyncDelayMs, selectionDelayMs },
    };

    // Client-side validation
    const result = appSettingsSchema.safeParse(candidateSettings);
    if (!result.success) {
      const errors = extractFieldErrors(result.error);
      setFieldErrors(errors);
      focusFirstInvalidField(errors); // Auto-focus first invalid field
      setIsSaving(false);
      return;
    }

    // Save to IPC
    try {
      await updateSettings(result.data);
      await reregisterShortcuts();
      addSuccessToast('Settings saved');
    } catch (error) {
      addErrorToast('Failed to save settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalibrateAutomation = async () => {
    if (isSaving || isCalibrating) return;

    setIsCalibrating(true);
    try {
      calibrationFieldRef.current?.focus();
      calibrationFieldRef.current?.select();

      const result = await calibrateDelays(calibrationText);
      setCalibration(result);

      if (!result.success) {
        addErrorToast('Calibration failed', result.reason);
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

      addSuccessToast('Automation calibrated and saved');
    } catch (error) {
      addErrorToast('Calibration failed', error);
    } finally {
      setIsCalibrating(false);
    }
  };

  const apiKeyPlaceholder = hasKey
    ? apiKeyPreview || '******'
    : 'Enter your API key';
  const hotkeyFields = [
    {
      id: 'fixSelection',
      label: 'Fix Selection',
      value: fixSelection,
      setValue: setFixSelection,
      placeholder: 'CommandOrControl+Shift+F',
    },
    {
      id: 'togglePopup',
      label: 'Toggle Popup',
      value: togglePopup,
      setValue: setTogglePopup,
      placeholder: 'CommandOrControl+Shift+P',
    },
  ] as const;

  const lmstudioPopularModels = getModelsForProvider('lmstudio');
  const lmstudioExtraModels = (() => {
    const known = new Set(lmstudioPopularModels.map((entry) => entry.id));
    return lmstudioDiscoveredModels.filter((id) => !known.has(id));
  })();

  return (
    <Form
      id="settings-form"
      validationMode="onSubmit"
      errors={fieldErrors}
      onSubmit={handleSaveSettings}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex items-center gap-2">
              <ToggleTheme />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <div className="flex items-center gap-2">
              <LangToggle />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Provider</h2>
          <Field name="ai.provider">
            <FieldLabel>Provider</FieldLabel>
            <Select
              name="ai.provider"
              value={provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {getProviderName(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError />
          </Field>

          {provider === 'lmstudio' && (
            <Field name="ai.lmstudioBaseURL">
              <FieldLabel>Base URL</FieldLabel>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={lmstudioBaseURL}
                  onChange={(e) => setLmstudioBaseURL(e.target.value)}
                  placeholder="http://localhost:1234/v1"
                  disabled={isSaving || isTestingConnection}
                />
                <Button
                  type="button"
                  onClick={handleFetchLMStudioModels}
                  disabled={
                    isSaving || isTestingConnection || !lmstudioBaseURL.trim()
                  }
                  variant="outline"
                >
                  {isTestingConnection ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Fetching...
                    </span>
                  ) : (
                    'Fetch Models'
                  )}
                </Button>
              </div>
              <FieldError />
              <FieldDescription>
                URL of your LM Studio local server (default:
                http://localhost:1234/v1)
                {lmstudioDiscoveredModels.length > 0 &&
                  ` • ${lmstudioDiscoveredModels.length} models fetched`}
              </FieldDescription>
            </Field>
          )}

          {provider === 'lmstudio' ? (
            <Field name="ai.model">
              <FieldLabel>Model</FieldLabel>
              <Combobox
                name="ai.model"
                value={model}
                inputValue={model}
                onInputValueChange={(value) => setModel(value)}
                onValueChange={(value) => setModel(value || '')}
              >
                <ComboboxInput
                  placeholder="Type model name or select from list"
                  showTrigger
                />
                <ComboboxPopup>
                  <ComboboxList>
                    {lmstudioExtraModels.length > 0 && (
                      <ComboboxGroup>
                        <ComboboxGroupLabel>
                          Discovered Models
                        </ComboboxGroupLabel>
                        {lmstudioExtraModels.map((id) => (
                          <ComboboxItem key={id} value={id}>
                            {id}
                          </ComboboxItem>
                        ))}
                      </ComboboxGroup>
                    )}
                    <ComboboxGroup>
                      <ComboboxGroupLabel>Popular Models</ComboboxGroupLabel>
                      {lmstudioPopularModels.map((entry) => (
                        <ComboboxItem key={entry.id} value={entry.id}>
                          {entry.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
              <FieldError />
              <FieldDescription>
                Select a model or type a custom model name (e.g., your
                downloaded model name)
              </FieldDescription>
            </Field>
          ) : (
            <Field name="ai.model">
              <FieldLabel>Model</FieldLabel>
              <Select
                name="ai.model"
                value={model}
                onValueChange={(value) => setModel(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getModelsForProvider(provider).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError />
            </Field>
          )}

          <Field name="ai.role">
            <FieldLabel>Rewrite Mode</FieldLabel>
            <Select
              name="ai.role"
              value={role}
              onValueChange={(value) => setRole(value as RewriteRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grammar">Grammar Only</SelectItem>
                <SelectItem value="grammar-tone">Grammar + Tone</SelectItem>
              </SelectContent>
            </Select>
            <FieldError />
          </Field>

          {provider === 'openai' && (
            <>
              <Field name="ai.reasoningEffort">
                <FieldLabel>Reasoning Effort</FieldLabel>
                <Select
                  name="ai.reasoningEffort"
                  value={reasoningEffort}
                  onValueChange={(value) =>
                    setReasoningEffort(value as ReasoningEffort)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium (Default)</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="xhigh">Extra High</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError />
              </Field>

              <Field name="ai.textVerbosity">
                <FieldLabel>Text Verbosity</FieldLabel>
                <Select
                  name="ai.textVerbosity"
                  value={textVerbosity}
                  onValueChange={(value) =>
                    setTextVerbosity(value as TextVerbosity)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Concise)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Verbose)</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError />
              </Field>
            </>
          )}

          <Field>
            <FieldLabel>
              API Key{' '}
              {hasKey && <span className="text-muted-foreground">(saved)</span>}
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  isEncryptionAvailable === false
                    ? 'Encryption unavailable'
                    : apiKeyPlaceholder
                }
                disabled={isSaving || isEncryptionAvailable === false}
              />
              <Button
                type="button"
                onClick={handleSaveApiKey}
                disabled={
                  isSaving || !apiKey.trim() || isEncryptionAvailable === false
                }
              >
                Save Key
              </Button>
              {hasKey && (
                <Button
                  type="button"
                  onClick={handleDeleteApiKey}
                  variant="destructive"
                  disabled={isSaving}
                >
                  Delete
                </Button>
              )}
            </div>
            {isEncryptionAvailable === false && (
              <Alert variant="warning">
                <AlertTitle>Encryption Unavailable</AlertTitle>
                <AlertDescription>
                  System keychain integration is not available. API keys cannot
                  be securely saved.
                </AlertDescription>
              </Alert>
            )}
          </Field>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Global Shortcuts</h2>
          {hotkeyFields.map((field) => (
            <Field key={field.id} name={`hotkeys.${field.id}`}>
              <FieldLabel>{field.label}</FieldLabel>
              <Input
                value={field.value}
                onChange={(e) => field.setValue(e.target.value)}
                placeholder={field.placeholder}
              />
              <FieldError />
            </Field>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Automation</h2>
          <Card>
            <CardHeader>
              <CardTitle>Calibration</CardTitle>
              <CardDescription>
                Recommended: click Calibrate to measure timing on your machine
                and auto-save safe values.
              </CardDescription>
              <CardAction>
                <Button
                  type="button"
                  onClick={handleCalibrateAutomation}
                  disabled={isSaving || isCalibrating}
                >
                  {isCalibrating ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="size-4" />
                      Calibrating…
                    </span>
                  ) : (
                    'Calibrate'
                  )}
                </Button>
              </CardAction>
            </CardHeader>
            <CardPanel className="space-y-3">
              <Field>
                <FieldLabel>Calibration Text</FieldLabel>
                <Textarea
                  id="calibrationText"
                  ref={calibrationFieldRef}
                  value={calibrationText}
                  onChange={(e) => setCalibrationText(e.target.value)}
                />
              </Field>
              {calibration?.success && (
                <p className="text-sm text-muted-foreground">
                  Measured clipboard update: p95{' '}
                  {calibration.measuredClipboardMs.p95Ms}ms (max{' '}
                  {calibration.measuredClipboardMs.maxMs}ms,{' '}
                  {calibration.measuredClipboardMs.samplesMs.length} runs)
                </p>
              )}
            </CardPanel>
          </Card>

          <Field name="automation.clipboardSyncDelayMs">
            <FieldLabel>Clipboard Sync Delay (ms)</FieldLabel>
            <FieldDescription>
              Maximum time to wait after copy; usually returns sooner once the
              clipboard updates.
            </FieldDescription>
            <Input
              type="number"
              min={0}
              max={5000}
              step={25}
              value={clipboardSyncDelayMs}
              onChange={(e) => {
                const next = e.target.valueAsNumber;
                setClipboardSyncDelayMs(Number.isFinite(next) ? next : 0);
              }}
            />
            <FieldError />
          </Field>
          <Field name="automation.selectionDelayMs">
            <FieldLabel>Selection Delay (ms)</FieldLabel>
            <FieldDescription>
              Fixed delay after keyboard simulation.
            </FieldDescription>
            <Input
              type="number"
              min={0}
              max={5000}
              step={25}
              value={selectionDelayMs}
              onChange={(e) => {
                const next = e.target.valueAsNumber;
                setSelectionDelayMs(Number.isFinite(next) ? next : 0);
              }}
            />
            <FieldError />
          </Field>
        </div>
      </div>
    </Form>
  );
}

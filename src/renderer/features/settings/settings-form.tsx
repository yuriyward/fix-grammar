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
  AI_PROVIDERS,
  type AIModel,
  type AIProvider,
  getDefaultModel,
  getModelsForProvider,
  getProviderName,
} from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import type { AutomationCalibrationResult } from '@/shared/types/automation';

export default function SettingsForm() {
  const [provider, setProvider] = useState<AIProvider>('google');
  const [model, setModel] = useState<AIModel>(getDefaultModel('google'));
  const [role, setRole] = useState<RewriteRole>('grammar');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyPreview, setApiKeyPreview] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEncryptionAvailable, setIsEncryptionAvailable] = useState<
    boolean | null
  >(null);

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

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  };

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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        ai: { provider, model, role },
        hotkeys: { fixSelection, togglePopup },
        automation: { clipboardSyncDelayMs, selectionDelayMs },
      });
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

  return (
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
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger id="provider">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={model}
            onValueChange={(value) => setModel(value as AIModel)}
          >
            <SelectTrigger id="model">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rewrite Mode</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as RewriteRole)}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grammar">Grammar Only</SelectItem>
              <SelectItem value="grammar-tone">Grammar + Tone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">
            API Key{' '}
            {hasKey && <span className="text-muted-foreground">(saved)</span>}
          </Label>
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
              onClick={handleSaveApiKey}
              disabled={
                isSaving || !apiKey.trim() || isEncryptionAvailable === false
              }
            >
              Save Key
            </Button>
            {hasKey && (
              <Button
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
                System keychain integration is not available. API keys cannot be
                securely saved.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Global Shortcuts</h2>
        {hotkeyFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              value={field.value}
              onChange={(e) => field.setValue(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Automation</h2>
        <Card>
          <CardHeader>
            <CardTitle>Calibration</CardTitle>
            <CardDescription>
              Recommended: click Calibrate to measure timing on your machine and
              auto-save safe values.
            </CardDescription>
            <CardAction>
              <Button
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
            <div className="space-y-2">
              <Label htmlFor="calibrationText">Calibration Text</Label>
              <Textarea
                id="calibrationText"
                ref={calibrationFieldRef}
                value={calibrationText}
                onChange={(e) => setCalibrationText(e.target.value)}
              />
            </div>
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

        <div className="space-y-2">
          <Label htmlFor="clipboardSyncDelayMs">
            Clipboard Sync Delay (ms)
          </Label>
          <p className="text-sm text-muted-foreground">
            Maximum time to wait after copy; usually returns sooner once the
            clipboard updates.
          </p>
          <Input
            id="clipboardSyncDelayMs"
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="selectionDelayMs">Selection Delay (ms)</Label>
          <p className="text-sm text-muted-foreground">
            Fixed delay after keyboard simulation.
          </p>
          <Input
            id="selectionDelayMs"
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
        </div>
      </div>

      <Button
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

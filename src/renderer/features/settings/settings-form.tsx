/**
 * Settings form component
 */
import { useCallback, useEffect, useState } from 'react';
import {
  deleteApiKey,
  getSettings,
  hasApiKey,
  saveApiKey,
  updateSettings,
} from '@/actions/settings';
import { reregisterShortcuts } from '@/actions/shortcuts';
import LangToggle from '@/renderer/components/lang-toggle';
import ToggleTheme from '@/renderer/components/toggle-theme';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { toastManager } from '@/renderer/components/ui/toast';
import {
  AI_PROVIDERS,
  getDefaultModel,
  getModelsForProvider,
  getProviderName,
  type AIModel,
  type AIProvider,
} from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';

export default function SettingsForm() {
  const [provider, setProvider] = useState<AIProvider>('google');
  const [model, setModel] = useState<AIModel>(getDefaultModel('google'));
  const [role, setRole] = useState<RewriteRole>('grammar');
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [fixSelection, setFixSelection] = useState('CommandOrControl+Shift+F');
  const [fixField, setFixField] = useState('CommandOrControl+Shift+G');
  const [togglePopup, setTogglePopup] = useState('CommandOrControl+Shift+P');
  const [openSettings, setOpenSettings] = useState('CommandOrControl+,');

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      setProvider(settings.ai.provider);
      setModel(settings.ai.model);
      setRole(settings.ai.role);
      setFixSelection(settings.hotkeys.fixSelection);
      setFixField(settings.hotkeys.fixField);
      setTogglePopup(settings.hotkeys.togglePopup);
      setOpenSettings(settings.hotkeys.openSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModel(getDefaultModel(newProvider));
  };

  const addSuccessToast = (title: string) => {
    toastManager.add({ type: 'success', title });
  };

  const addErrorToast = (title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    toastManager.add({ type: 'error', title, description: message });
  };

  const checkApiKey = useCallback(async () => {
    try {
      const result = await hasApiKey(provider);
      setHasKey(result.hasKey);
    } catch (error) {
      console.error('Failed to check API key:', error);
    }
  }, [provider]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void checkApiKey();
  }, [checkApiKey]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    try {
      await saveApiKey(provider, apiKey);
      setApiKey('');
      setHasKey(true);
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
      setHasKey(false);
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
        hotkeys: { fixSelection, fixField, togglePopup, openSettings },
      });

      await reregisterShortcuts();

      addSuccessToast('Settings saved');
    } catch (error) {
      addErrorToast('Failed to save settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hotkeyFields = [
    {
      id: 'fixSelection',
      label: 'Fix Selection',
      value: fixSelection,
      setValue: setFixSelection,
      placeholder: 'CommandOrControl+Shift+F',
    },
    {
      id: 'fixField',
      label: 'Fix Field',
      value: fixField,
      setValue: setFixField,
      placeholder: 'CommandOrControl+Shift+G',
    },
    {
      id: 'togglePopup',
      label: 'Toggle Popup',
      value: togglePopup,
      setValue: setTogglePopup,
      placeholder: 'CommandOrControl+Shift+P',
    },
    {
      id: 'openSettings',
      label: 'Open Settings',
      value: openSettings,
      setValue: setOpenSettings,
      placeholder: 'CommandOrControl+,',
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
              placeholder="Enter your API key"
              disabled={isSaving}
            />
            <Button
              onClick={handleSaveApiKey}
              disabled={isSaving || !apiKey.trim()}
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

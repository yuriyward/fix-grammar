/**
 * AI Provider settings section
 * Provider, model, role, and API key configuration UI
 */
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/renderer/components/ui/alert';
import { Button } from '@/renderer/components/ui/button';
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
import { Input } from '@/renderer/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Spinner } from '@/renderer/components/ui/spinner';
import {
  AI_PROVIDERS,
  type AIProvider,
  getModelsForProvider,
  getProviderName,
  type ModelConfig,
} from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import type { ReasoningEffort, TextVerbosity } from '@/shared/types/settings';

export interface AIProviderSectionProps {
  // From useSettingsState
  provider: AIProvider;
  model: string;
  role: RewriteRole;
  reasoningEffort: ReasoningEffort;
  textVerbosity: TextVerbosity;
  lmstudioBaseURL: string;
  isSaving: boolean;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onRoleChange: (role: RewriteRole) => void;
  onReasoningEffortChange: (effort: ReasoningEffort) => void;
  onTextVerbosityChange: (verbosity: TextVerbosity) => void;
  onLmstudioBaseURLChange: (url: string) => void;

  // From useApiKey
  apiKey: string;
  hasKey: boolean;
  isEncryptionAvailable: boolean | null;
  apiKeyPlaceholder: string;
  onApiKeyChange: (key: string) => void;
  onSaveApiKey: () => Promise<void>;
  onDeleteApiKey: () => Promise<void>;

  // From useLMStudioModels
  isTestingConnection: boolean;
  discoveredModels: string[];
  popularModels: ModelConfig[];
  extraModels: string[];
  onFetchModels: () => Promise<void>;
}

/**
 * AI Provider section component for configuring AI settings.
 * Receives all state and handlers via props.
 */
export function AIProviderSection({
  provider,
  model,
  role,
  reasoningEffort,
  textVerbosity,
  lmstudioBaseURL,
  isSaving,
  onProviderChange,
  onModelChange,
  onRoleChange,
  onReasoningEffortChange,
  onTextVerbosityChange,
  onLmstudioBaseURLChange,
  apiKey,
  hasKey,
  isEncryptionAvailable,
  apiKeyPlaceholder,
  onApiKeyChange,
  onSaveApiKey,
  onDeleteApiKey,
  isTestingConnection,
  discoveredModels,
  popularModels,
  extraModels,
  onFetchModels,
}: AIProviderSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">AI Provider</h2>

      {/* Provider Selection */}
      <Field name="ai.provider">
        <FieldLabel>Provider</FieldLabel>
        <Select
          name="ai.provider"
          value={provider}
          onValueChange={(value) => value && onProviderChange(value)}
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

      {/* LM Studio Base URL */}
      {provider === 'lmstudio' && (
        <Field name="ai.lmstudioBaseURL">
          <FieldLabel>Base URL</FieldLabel>
          <div className="flex gap-2">
            <Input
              type="url"
              value={lmstudioBaseURL}
              onChange={(e) => onLmstudioBaseURLChange(e.target.value)}
              placeholder="http://localhost:1234/v1"
              disabled={isSaving || isTestingConnection}
            />
            <Button
              type="button"
              onClick={onFetchModels}
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
            {discoveredModels.length > 0 &&
              ` • ${discoveredModels.length} models fetched`}
          </FieldDescription>
        </Field>
      )}

      {/* Model Selection */}
      {provider === 'lmstudio' ? (
        <Field name="ai.model">
          <FieldLabel>Model</FieldLabel>
          <Combobox
            name="ai.model"
            value={model}
            inputValue={model}
            onInputValueChange={(value) => onModelChange(value)}
            onValueChange={(value) => onModelChange(value || '')}
          >
            <ComboboxInput
              placeholder="Type model name or select from list"
              showTrigger
            />
            <ComboboxPopup>
              <ComboboxList>
                {extraModels.length > 0 && (
                  <ComboboxGroup>
                    <ComboboxGroupLabel>Discovered Models</ComboboxGroupLabel>
                    {extraModels.map((id) => (
                      <ComboboxItem key={id} value={id}>
                        {id}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                )}
                <ComboboxGroup>
                  <ComboboxGroupLabel>Popular Models</ComboboxGroupLabel>
                  {popularModels.map((entry) => (
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
            Select a model or type a custom model name (e.g., your downloaded
            model name)
          </FieldDescription>
        </Field>
      ) : (
        <Field name="ai.model">
          <FieldLabel>Model</FieldLabel>
          <Select
            name="ai.model"
            value={model}
            onValueChange={(value) => value && onModelChange(value)}
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

      {/* Role Selection */}
      <Field name="ai.role">
        <FieldLabel>Rewrite Mode</FieldLabel>
        <Select
          name="ai.role"
          value={role}
          onValueChange={(value) => onRoleChange(value as RewriteRole)}
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

      {/* OpenAI-specific fields */}
      {provider === 'openai' && (
        <>
          <Field name="ai.reasoningEffort">
            <FieldLabel>Reasoning Effort</FieldLabel>
            <Select
              name="ai.reasoningEffort"
              value={reasoningEffort}
              onValueChange={(value) =>
                onReasoningEffortChange(value as ReasoningEffort)
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
                onTextVerbosityChange(value as TextVerbosity)
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

      {/* API Key */}
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
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={
              isEncryptionAvailable === false
                ? 'Encryption unavailable'
                : apiKeyPlaceholder
            }
            disabled={isSaving || isEncryptionAvailable === false}
          />
          <Button
            type="button"
            onClick={onSaveApiKey}
            disabled={
              isSaving || !apiKey.trim() || isEncryptionAvailable === false
            }
          >
            Save Key
          </Button>
          {hasKey && (
            <Button
              type="button"
              onClick={onDeleteApiKey}
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
      </Field>
    </div>
  );
}

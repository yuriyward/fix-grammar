/**
 * AI Provider settings section
 * Provider, model, role, and API key configuration UI
 */

import { Combobox as BaseUiCombobox } from '@base-ui/react/combobox';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/renderer/components/ui/alert';
import { Button } from '@/renderer/components/ui/button';
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
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
import { Textarea } from '@/renderer/components/ui/textarea';
import {
  AI_PROVIDERS,
  type AIProvider,
  getModelsForProvider,
  getProviderName,
  type ModelConfig,
} from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';
import type { ReasoningEffort, TextVerbosity } from '@/shared/types/settings';
import type { LMStudioModelGroup } from '../hooks/use-lmstudio-models';
import type { ModelGroup } from '../hooks/use-openrouter-models';

export interface AIProviderSectionProps {
  // From useSettingsState
  provider: AIProvider;
  model: string;
  role: RewriteRole;
  reasoningEffort: ReasoningEffort;
  textVerbosity: TextVerbosity;
  lmstudioBaseURL: string;
  openrouterExtraParams: string;
  isSaving: boolean;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onRoleChange: (role: RewriteRole) => void;
  onReasoningEffortChange: (effort: ReasoningEffort) => void;
  onTextVerbosityChange: (verbosity: TextVerbosity) => void;
  onLmstudioBaseURLChange: (url: string) => void;
  onOpenrouterExtraParamsChange: (params: string) => void;

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
  lmstudioGroupedModels: LMStudioModelGroup[];
  onFetchLMStudioModels: () => Promise<void>;

  // From useOpenRouterModels
  isLoadingOpenRouterModels: boolean;
  openrouterFetchedModels: ModelConfig[];
  openrouterGroupedModels: ModelGroup[];
  openrouterAllModels: ModelConfig[];
  onFetchOpenRouterModels: () => Promise<void>;
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
  openrouterExtraParams,
  isSaving,
  onProviderChange,
  onModelChange,
  onRoleChange,
  onReasoningEffortChange,
  onTextVerbosityChange,
  onLmstudioBaseURLChange,
  onOpenrouterExtraParamsChange,
  apiKey,
  hasKey,
  isEncryptionAvailable,
  apiKeyPlaceholder,
  onApiKeyChange,
  onSaveApiKey,
  onDeleteApiKey,
  isTestingConnection,
  discoveredModels,
  lmstudioGroupedModels,
  onFetchLMStudioModels,
  isLoadingOpenRouterModels,
  openrouterFetchedModels,
  openrouterGroupedModels,
  openrouterAllModels,
  onFetchOpenRouterModels,
}: AIProviderSectionProps) {
  const { contains } = BaseUiCombobox.useFilter();

  const providerOptions = Object.keys(AI_PROVIDERS) as AIProvider[];

  const providerSelectItems = providerOptions.map((p) => ({
    value: p,
    label: getProviderName(p),
  }));

  const providerModels = getModelsForProvider(provider);

  const modelSelectItems = providerModels.map((entry) => ({
    value: entry.id,
    label: entry.name,
  }));

  const rewriteModeSelectItems: ReadonlyArray<{
    value: RewriteRole;
    label: string;
  }> = [
    { value: 'grammar', label: 'Grammar Only' },
    { value: 'grammar-tone', label: 'Grammar + Tone' },
  ];

  const reasoningEffortSelectItems: ReadonlyArray<{
    value: ReasoningEffort;
    label: string;
  }> = [
    { value: 'none', label: 'None' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium (Default)' },
    { value: 'high', label: 'High' },
    { value: 'xhigh', label: 'Extra High' },
  ];

  const textVerbositySelectItems: ReadonlyArray<{
    value: TextVerbosity;
    label: string;
  }> = [
    { value: 'low', label: 'Low (Concise)' },
    { value: 'medium', label: 'Medium (Balanced)' },
    { value: 'high', label: 'High (Verbose)' },
  ];

  const normalizedModel = model.trim();

  const providerModelCustomItem =
    normalizedModel.length > 0 &&
    !modelSelectItems.some((item) => item.value === normalizedModel)
      ? { value: normalizedModel, label: normalizedModel }
      : null;
  const providerModelItemsForView = providerModelCustomItem
    ? [providerModelCustomItem, ...modelSelectItems]
    : modelSelectItems;
  const selectedProviderModelItem =
    modelSelectItems.find((item) => item.value === normalizedModel) ??
    providerModelCustomItem ??
    null;

  // Find the currently selected item for LM Studio
  const lmstudioFlatItems = lmstudioGroupedModels.flatMap(
    (group) => group.items,
  );
  const lmstudioCustomItem =
    normalizedModel.length > 0 &&
    !lmstudioFlatItems.some((item) => item.id === normalizedModel)
      ? { id: normalizedModel, name: normalizedModel }
      : null;
  const lmstudioItemsForView = lmstudioCustomItem
    ? [
        { value: 'Custom', items: [lmstudioCustomItem] },
        ...lmstudioGroupedModels,
      ]
    : lmstudioGroupedModels;
  const selectedLMStudioItem =
    lmstudioFlatItems.find((item) => item.id === normalizedModel) ??
    lmstudioCustomItem ??
    null;

  const lmstudioInputValue = selectedLMStudioItem
    ? selectedLMStudioItem.name
    : normalizedModel;

  // Find the currently selected item for OpenRouter
  const openrouterFlatItems = openrouterGroupedModels.flatMap(
    (group) => group.items,
  );
  const openrouterCustomItem =
    normalizedModel.length > 0 &&
    !openrouterFlatItems.some((item) => item.id === normalizedModel)
      ? ({
          id: normalizedModel,
          name: normalizedModel,
          provider: 'openrouter',
        } satisfies ModelConfig)
      : null;
  const openrouterItemsForView = openrouterCustomItem
    ? [
        { value: 'Custom', items: [openrouterCustomItem] },
        ...openrouterGroupedModels,
      ]
    : openrouterGroupedModels;
  const selectedOpenRouterItem =
    openrouterFlatItems.find((item) => item.id === normalizedModel) ??
    openrouterCustomItem ??
    null;

  const openrouterInputValue = selectedOpenRouterItem
    ? selectedOpenRouterItem.name
    : normalizedModel;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">AI Provider</h2>

      {/* Provider Selection */}
      <Field name="ai.provider">
        <FieldLabel>Provider</FieldLabel>
        <Select
          name="ai.provider"
          value={provider}
          items={providerSelectItems}
          onValueChange={(value) => value && onProviderChange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerSelectItems.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
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
              onClick={onFetchLMStudioModels}
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
            value={selectedLMStudioItem ?? null}
            inputValue={lmstudioInputValue}
            onInputValueChange={(value, details) => {
              if (
                details.reason === 'input-change' ||
                details.reason === 'input-clear'
              ) {
                onModelChange(value.trim());
              }
            }}
            onValueChange={(value: { id: string; name: string } | null) => {
              if (value) {
                onModelChange(value.id);
              } else {
                onModelChange('');
              }
            }}
            items={lmstudioItemsForView}
            filter={(item: { id: string; name: string }, query: string) => {
              const trimmed = query.trim();
              if (trimmed.length === 0) return true;
              return contains(item.id, trimmed) || contains(item.name, trimmed);
            }}
            isItemEqualToValue={(
              item: { id: string },
              selected: { id: string },
            ) => item.id === selected.id}
            itemToStringLabel={(item: { id: string; name: string }) =>
              item.name
            }
            itemToStringValue={(item: { id: string; name: string }) => item.id}
          >
            <ComboboxInput
              placeholder="Type model name or select from list"
              showTrigger
            />
            <ComboboxPopup>
              <ComboboxEmpty>No models found.</ComboboxEmpty>
              <ComboboxList>
                {(group: LMStudioModelGroup) => (
                  <ComboboxGroup key={group.value} items={group.items}>
                    <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
                    <ComboboxCollection>
                      {(item: { id: string; name: string }) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
          <FieldError />
          <FieldDescription>
            Select a model or type a custom model name (e.g., your downloaded
            model name)
          </FieldDescription>
        </Field>
      ) : provider === 'openrouter' ? (
        <>
          <Field name="ai.model">
            <FieldLabel>Model</FieldLabel>
            <Combobox
              name="ai.model"
              value={selectedOpenRouterItem ?? null}
              inputValue={openrouterInputValue}
              onInputValueChange={(value, details) => {
                if (
                  details.reason === 'input-change' ||
                  details.reason === 'input-clear'
                ) {
                  onModelChange(value.trim());
                }
              }}
              onValueChange={(value: ModelConfig | null) => {
                if (value) {
                  onModelChange(value.id);
                } else {
                  onModelChange('');
                }
              }}
              items={openrouterItemsForView}
              filter={(item: ModelConfig, query: string) => {
                const trimmed = query.trim();
                if (trimmed.length === 0) return true;
                return (
                  contains(item.id, trimmed) || contains(item.name, trimmed)
                );
              }}
              isItemEqualToValue={(item: ModelConfig, selected: ModelConfig) =>
                item.id === selected.id
              }
              itemToStringLabel={(item: ModelConfig) => item.name}
              itemToStringValue={(item: ModelConfig) => item.id}
            >
              <ComboboxInput
                placeholder="Type model ID or select from list"
                showTrigger
              />
              <ComboboxPopup>
                <ComboboxEmpty>No models found.</ComboboxEmpty>
                <ComboboxList>
                  {(group: ModelGroup) => (
                    <ComboboxGroup key={group.value} items={group.items}>
                      <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
                      <ComboboxCollection>
                        {(item: ModelConfig) => (
                          <ComboboxItem key={item.id} value={item}>
                            {item.name}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxGroup>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </Combobox>
            <FieldError />
            <FieldDescription>
              Select a model or type any OpenRouter model ID (e.g.,
              openai/gpt-4o, anthropic/claude-3.5-sonnet)
              {openrouterFetchedModels.length > 0 &&
                ` • ${openrouterAllModels.length} models available`}
            </FieldDescription>
          </Field>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onFetchOpenRouterModels}
              disabled={isSaving || isLoadingOpenRouterModels}
              variant="outline"
              size="sm"
            >
              {isLoadingOpenRouterModels ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  Loading...
                </span>
              ) : (
                'Fetch All Models'
              )}
            </Button>
          </div>
        </>
      ) : (
        <Field name="ai.model">
          <FieldLabel>Model</FieldLabel>
          <Combobox
            name="ai.model"
            value={selectedProviderModelItem}
            inputValue={
              selectedProviderModelItem
                ? selectedProviderModelItem.label
                : normalizedModel
            }
            onInputValueChange={(value, details) => {
              if (
                details.reason === 'input-change' ||
                details.reason === 'input-clear'
              ) {
                onModelChange(value.trim());
              }
            }}
            onValueChange={(value: { value: string; label: string } | null) => {
              if (value) {
                onModelChange(value.value);
              } else {
                onModelChange('');
              }
            }}
            items={providerModelItemsForView}
            filter={(item: { value: string; label: string }, query: string) => {
              const trimmed = query.trim();
              if (trimmed.length === 0) return true;
              return (
                contains(item.value, trimmed) || contains(item.label, trimmed)
              );
            }}
            isItemEqualToValue={(
              item: { value: string },
              selected: { value: string },
            ) => item.value === selected.value}
            itemToStringLabel={(item: { value: string; label: string }) =>
              item.label
            }
            itemToStringValue={(item: { value: string; label: string }) =>
              item.value
            }
          >
            <ComboboxInput
              placeholder="Select from list or type custom model ID"
              showTrigger
            />
            <ComboboxPopup>
              <ComboboxEmpty>No models found.</ComboboxEmpty>
              <ComboboxList>
                {(item: { value: string; label: string }) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
          <FieldError />
          <FieldDescription>
            Select a model or type a custom model ID
          </FieldDescription>
        </Field>
      )}

      {/* OpenRouter Extra Params */}
      {provider === 'openrouter' && (
        <Field name="ai.openrouterExtraParams">
          <FieldLabel>Advanced Parameters (JSON)</FieldLabel>
          <Textarea
            value={openrouterExtraParams}
            onChange={(e) => onOpenrouterExtraParamsChange(e.target.value)}
            placeholder='{"temperature": 0.7, "top_p": 0.9}'
            disabled={isSaving}
            rows={3}
          />
          <FieldError />
          <FieldDescription>
            Optional JSON object with OpenRouter-specific parameters
            (temperature, top_p, reasoning, etc.). See{' '}
            <a
              href="https://openrouter.ai/docs/api/reference/parameters"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              OpenRouter docs
            </a>{' '}
            for available parameters.
          </FieldDescription>
        </Field>
      )}

      {/* Role Selection */}
      <Field name="ai.role">
        <FieldLabel>Rewrite Mode</FieldLabel>
        <Select
          name="ai.role"
          value={role}
          items={rewriteModeSelectItems}
          onValueChange={(value) => onRoleChange(value as RewriteRole)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rewriteModeSelectItems.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
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
              items={reasoningEffortSelectItems}
              onValueChange={(value) =>
                onReasoningEffortChange(value as ReasoningEffort)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasoningEffortSelectItems.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError />
          </Field>

          <Field name="ai.textVerbosity">
            <FieldLabel>Text Verbosity</FieldLabel>
            <Select
              name="ai.textVerbosity"
              value={textVerbosity}
              items={textVerbositySelectItems}
              onValueChange={(value) =>
                onTextVerbosityChange(value as TextVerbosity)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textVerbositySelectItems.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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

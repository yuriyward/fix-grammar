/**
 * Settings form component
 * Orchestrates hooks and section components for settings management
 */
import { Form } from '@/renderer/components/ui/form';

import { useApiKey } from './hooks/use-api-key';
import { useCalibration } from './hooks/use-calibration';
import { useLMStudioModels } from './hooks/use-lmstudio-models';
import { useOpenRouterModels } from './hooks/use-openrouter-models';
import { useSettingsState } from './hooks/use-settings-state';
import { AIProviderSection } from './sections/ai-provider-section';
import { AppearanceSection } from './sections/appearance-section';
import { AutomationSection } from './sections/automation-section';
import { HotkeysSection } from './sections/hotkeys-section';

/**
 * Settings form component that composes all settings sections.
 * Uses extracted hooks for state management and section components for UI.
 */
export default function SettingsForm() {
  // Core settings state
  const settingsState = useSettingsState();

  // API key management
  const apiKeyState = useApiKey(settingsState.provider);

  // LM Studio model discovery
  const lmStudioModels = useLMStudioModels(
    settingsState.provider,
    settingsState.lmstudioBaseURL,
  );

  // OpenRouter model discovery
  const openRouterModels = useOpenRouterModels(settingsState.provider);

  // Calibration logic
  const calibrationState = useCalibration(
    settingsState.isSaving,
    settingsState.setClipboardSyncDelayMs,
    settingsState.setSelectionDelayMs,
  );

  // Handle provider change with model reset
  const handleProviderChange = (
    provider: Parameters<typeof settingsState.handleProviderChange>[0],
  ) => {
    settingsState.handleProviderChange(provider);
    lmStudioModels.resetModels();
    openRouterModels.resetModels();
  };

  return (
    <Form
      id="settings-form"
      validationMode="onSubmit"
      errors={settingsState.fieldErrors}
      onSubmit={settingsState.handleSaveSettings}
    >
      <div className="space-y-6">
        {/* Appearance Section */}
        <AppearanceSection />

        {/* AI Provider Section */}
        <AIProviderSection
          provider={settingsState.provider}
          model={settingsState.model}
          role={settingsState.role}
          reasoningEffort={settingsState.reasoningEffort}
          textVerbosity={settingsState.textVerbosity}
          lmstudioBaseURL={settingsState.lmstudioBaseURL}
          openrouterExtraParams={settingsState.openrouterExtraParams}
          isSaving={settingsState.isSaving}
          onProviderChange={handleProviderChange}
          onModelChange={settingsState.setModel}
          onRoleChange={settingsState.setRole}
          onReasoningEffortChange={settingsState.setReasoningEffort}
          onTextVerbosityChange={settingsState.setTextVerbosity}
          onLmstudioBaseURLChange={settingsState.setLmstudioBaseURL}
          onOpenrouterExtraParamsChange={settingsState.setOpenrouterExtraParams}
          apiKey={apiKeyState.apiKey}
          hasKey={apiKeyState.hasKey}
          isEncryptionAvailable={apiKeyState.isEncryptionAvailable}
          apiKeyPlaceholder={apiKeyState.apiKeyPlaceholder}
          onApiKeyChange={apiKeyState.setApiKey}
          onSaveApiKey={apiKeyState.handleSaveApiKey}
          onDeleteApiKey={apiKeyState.handleDeleteApiKey}
          isTestingConnection={lmStudioModels.isTestingConnection}
          discoveredModels={lmStudioModels.discoveredModels}
          lmstudioGroupedModels={lmStudioModels.groupedModels}
          onFetchLMStudioModels={lmStudioModels.handleFetchModels}
          isLoadingOpenRouterModels={openRouterModels.isLoadingModels}
          openrouterFetchedModels={openRouterModels.fetchedModels}
          openrouterGroupedModels={openRouterModels.groupedModels}
          openrouterAllModels={openRouterModels.allModels}
          onFetchOpenRouterModels={openRouterModels.handleFetchModels}
        />

        {/* Hotkeys Section */}
        <HotkeysSection
          fixSelection={settingsState.fixSelection}
          togglePopup={settingsState.togglePopup}
          onFixSelectionChange={settingsState.setFixSelection}
          onTogglePopupChange={settingsState.setTogglePopup}
        />

        {/* Automation Section */}
        <AutomationSection
          clipboardSyncDelayMs={settingsState.clipboardSyncDelayMs}
          selectionDelayMs={settingsState.selectionDelayMs}
          isSaving={settingsState.isSaving}
          onClipboardSyncDelayChange={settingsState.setClipboardSyncDelayMs}
          onSelectionDelayChange={settingsState.setSelectionDelayMs}
          isCalibrating={calibrationState.isCalibrating}
          calibration={calibrationState.calibration}
          calibrationText={calibrationState.calibrationText}
          calibrationStatus={calibrationState.calibrationStatus}
          calibrationFieldRef={calibrationState.calibrationFieldRef}
          onCalibrationTextChange={calibrationState.setCalibrationText}
          onCalibrate={calibrationState.handleCalibrate}
        />
      </div>
    </Form>
  );
}

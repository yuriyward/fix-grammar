# Project File Structure

*Generated automatically from TypeScript source code*

## Tree Overview

actions/ # 9 files
  ├─ ai.ts # AI IPC wrappers for renderer
  ├─ app.ts # App info IPC wrappers for renderer
  ├─ automation.ts # Automation IPC wrappers for renderer
  ├─ language.ts # Language preference management for renderer
  ├─ settings.ts # Settings IPC wrappers for renderer
  ├─ shell.ts # Shell operations IPC wrapper for renderer
  ├─ shortcuts.ts # Shortcuts IPC wrappers for renderer
  ├─ theme.ts # Theme mode management for renderer
  └─ window.ts # Window control IPC wrappers for renderer
ipc/ # 3 files, 8 directories
  ├─ ai/ # 3 files
  │ ├─ handlers.ts # AI IPC handlers
  │ ├─ router.ts # AI domain router
  │ └─ schemas.ts # Zod schemas for AI IPC
  ├─ app/ # 3 files
  │ ├─ handlers.ts # App info IPC handlers
  │ ├─ router.ts # App domain router
  │ └─ schemas.ts # Zod schemas for app IPC
  ├─ automation/ # 3 files
  │ ├─ handlers.ts # Automation IPC handlers
  │ ├─ router.ts # Automation domain router
  │ └─ schemas.ts # Zod schemas for automation IPC
  ├─ settings/ # 3 files
  │ ├─ handlers.ts # Settings IPC handlers
  │ ├─ router.ts # Settings domain router
  │ └─ schemas.ts # Zod schemas for settings IPC
  ├─ shell/ # 3 files
  │ ├─ handlers.ts # Shell operations IPC handlers
  │ ├─ router.ts # Shell domain router
  │ └─ schemas.ts # Zod schemas for shell IPC
  ├─ shortcuts/ # 3 files
  │ ├─ handlers.ts # Shortcuts IPC handlers
  │ ├─ router.ts # Shortcuts domain router
  │ └─ schemas.ts # Zod schemas for shortcuts IPC
  ├─ theme/ # 3 files
  │ ├─ handlers.ts # Theme mode IPC handlers
  │ ├─ router.ts # Theme domain router
  │ └─ schemas.ts # Zod schemas for theme IPC
  ├─ window/ # 3 files
  │ ├─ handlers.ts # Window control IPC handlers
  │ ├─ router.ts # Window domain router
  │ └─ schemas.ts # Zod schemas for window IPC
  ├─ context.ts # IPC context with main window reference and window manager
  ├─ handler.ts # oRPC handler for main process
  └─ router.ts # Root oRPC router combining all domains
main/ # 1 files, 6 directories
  ├─ ai/ # 3 files
  │ ├─ client.ts # Google Gemini AI client
  │ ├─ error-handler.ts # AI error handling utilities
  │ └─ prompts.ts # Role-based prompt templates
  ├─ automation/ # 2 files
  │ ├─ clipboard.ts # Clipboard backup/restore utilities
  │ └─ keyboard.ts # nut-js wrapper for keyboard automation
  ├─ shortcuts/ # 2 files
  │ ├─ handlers.ts # Fix selection/field orchestration handlers
  │ └─ manager.ts # Global shortcut registration manager
  ├─ storage/ # 3 files
  │ ├─ api-keys.ts # safeStorage wrapper for API key encryption
  │ ├─ context.ts # In-memory edit context storage
  │ └─ settings.ts # electron-store instance for persistent settings
  ├─ tray/ # 1 file
  │ └─ tray-manager.ts # System tray lifecycle management
  ├─ windows/ # 1 file
  │ └─ window-manager.ts # Centralized window lifecycle management
  └─ app.ts # Main process lifecycle and initialization
preload/ # 1 file
  └─ bridge.ts # IPC bridge via contextBridge
renderer/ # 1 files, 5 directories
  ├─ components/ # 5 files, 1 directories
  │ ├─ ui/ # 50 files
  │ │ ├─ accordion.tsx # 5 exports
  │ │ ├─ alert-dialog.tsx # 13 exports
  │ │ ├─ alert.tsx # 4 exports
  │ │ ├─ autocomplete.tsx # 15 exports
  │ │ ├─ avatar.tsx # 3 exports
  │ │ ├─ badge.tsx # 2 exports
  │ │ ├─ breadcrumb.tsx # 7 exports
  │ │ ├─ button.tsx # 2 exports
  │ │ ├─ card.tsx # 8 exports
  │ │ ├─ checkbox-group.tsx # 1 export
  │ │ ├─ checkbox.tsx # 1 export
  │ │ ├─ collapsible.tsx # 4 exports
  │ │ ├─ combobox.tsx # 17 exports
  │ │ ├─ command.tsx # 15 exports
  │ │ ├─ dialog.tsx # 14 exports
  │ │ ├─ empty.tsx # 6 exports
  │ │ ├─ field.tsx # 6 exports
  │ │ ├─ fieldset.tsx # 2 exports
  │ │ ├─ form.tsx # 1 export
  │ │ ├─ frame.tsx # 6 exports
  │ │ ├─ group.tsx # 7 exports
  │ │ ├─ input-group.tsx # 5 exports
  │ │ ├─ input.tsx # 2 exports
  │ │ ├─ kbd.tsx # 2 exports
  │ │ ├─ label.tsx # 1 export
  │ │ ├─ menu.tsx # 30 exports
  │ │ ├─ meter.tsx # 5 exports
  │ │ ├─ number-field.tsx # 6 exports
  │ │ ├─ pagination.tsx # 7 exports
  │ │ ├─ popover.tsx # 8 exports
  │ │ ├─ preview-card.tsx # 6 exports
  │ │ ├─ progress.tsx # 5 exports
  │ │ ├─ radio-group.tsx # 3 exports
  │ │ ├─ scroll-area.tsx # 2 exports
  │ │ ├─ select.tsx # 9 exports
  │ │ ├─ separator.tsx # 1 export
  │ │ ├─ sheet.tsx # 13 exports
  │ │ ├─ sidebar.tsx # 24 exports
  │ │ ├─ skeleton.tsx # 1 export
  │ │ ├─ slider.tsx # 2 exports
  │ │ ├─ spinner.tsx # 1 export
  │ │ ├─ switch.tsx # 1 export
  │ │ ├─ table.tsx # 8 exports
  │ │ ├─ tabs.tsx # 6 exports
  │ │ ├─ textarea.tsx # 2 exports
  │ │ ├─ toast.tsx # 5 exports
  │ │ ├─ toggle-group.tsx # 4 exports
  │ │ ├─ toggle.tsx # 2 exports
  │ │ ├─ toolbar.tsx # 6 exports
  │ │ └─ tooltip.tsx # 6 exports
  │ ├─ drag-window-region.tsx # Draggable title bar with window controls
  │ ├─ error-boundary.tsx # React error boundary with recovery UI
  │ ├─ external-link.tsx # External link button using shell API
  │ ├─ lang-toggle.tsx # Language selection toggle group
  │ └─ toggle-theme.tsx # Theme toggle button component
  ├─ features/ # 1 directory
  │ └─ settings/ # 1 file
  │   └─ settings-form.tsx # Settings form component
  ├─ hooks/ # 1 file
  │ └─ use-mobile.ts # 1 export
  ├─ layouts/ # 1 file
  │ └─ base-layout.tsx # Base layout with title bar region
  ├─ lib/ # 6 files
  │ ├─ i18n.ts # i18next configuration and translations
  │ ├─ ipc-manager.ts # IPC client manager for renderer process
  │ ├─ langs.ts # Supported language definitions
  │ ├─ language.ts # Language type definition
  │ ├─ routes.ts # TanStack Router configuration
  │ └─ tailwind.ts # Tailwind CSS class merging utility
  └─ app.tsx # React application root and mounting
routes/ # 3 files
  ├─ __root.tsx # Root route with base layout wrapper
  ├─ index.tsx # Dashboard page route component
  ├─ popup.tsx # Popup chat route component
  └─ settings.tsx # Settings page route component
shared/ # 3 directories
  ├─ config/ # 1 file
  │ └─ ai-models.ts # Centralized AI model configuration This is the single source of truth for all available models
  ├─ contracts/ # 1 file
  │ └─ ipc-channels.ts # IPC channel names and storage keys
  └─ types/ # 5 files
    ├─ ai.ts # AI types
    ├─ automation.ts # Automation types
    ├─ settings.ts # Settings schema types
    ├─ shortcuts.ts # Hotkey types
    └─ theme.ts # Theme mode type definition
tests/ # 1 directory
  └─ unit/ # 1 file
    └─ setup.ts # Vitest setup with jest-dom matchers
main.ts # Electron main process entrypoint
preload.ts # Preload script entrypoint
renderer.ts # Renderer process entrypoint
routeTree.gen.ts # 6 exports

## File Details

### actions/ai.ts
**Purpose**: AI IPC wrappers for renderer

**Exports**:
- `export rewriteText` - AI IPC wrappers for renderer

### actions/app.ts
**Purpose**: App info IPC wrappers for renderer

**Exports**:
- `export getAppVersion` - App info IPC wrappers for renderer
- `export getPlatform` - App info IPC wrappers for renderer

### actions/automation.ts
**Purpose**: Automation IPC wrappers for renderer

**Exports**:
- `export calibrateDelays` - item implementation
- `export captureText` - item implementation
- `export replaceText` - item implementation

### actions/language.ts
**Purpose**: Language preference management for renderer

**Exports**:
- `export setAppLanguage` - Language preference management for renderer
- `export updateAppLanguage` - item implementation

### actions/settings.ts
**Purpose**: Settings IPC wrappers for renderer

**Exports**:
- `export deleteApiKey` - item implementation
- `export getSettings` - Settings IPC wrappers for renderer
- `export hasApiKey` - item implementation
- `export isEncryptionAvailable` - item implementation
- `export saveApiKey` - item implementation
- `export updateSettings` - item implementation

### actions/shell.ts
**Purpose**: Shell operations IPC wrapper for renderer

**Exports**:
- `export openExternalLink` - Shell operations IPC wrapper for renderer

### actions/shortcuts.ts
**Purpose**: Shortcuts IPC wrappers for renderer

**Exports**:
- `export reregisterShortcuts` - Shortcuts IPC wrappers for renderer
- `export unregisterAllShortcuts` - Shortcuts IPC wrappers for renderer

### actions/theme.ts
**Purpose**: Theme mode management for renderer

**Exports**:
- `export ThemePreferences` - Theme mode management for renderer
- `export getCurrentTheme` - item implementation
- `export setTheme` - item implementation
- `export syncWithLocalTheme` - item implementation
- `export toggleTheme` - item implementation

### actions/window.ts
**Purpose**: Window control IPC wrappers for renderer

**Exports**:
- `export closeWindow` - item implementation
- `export maximizeWindow` - Window control IPC wrappers for renderer
- `export minimizeWindow` - Window control IPC wrappers for renderer

### ipc/ai/handlers.ts
**Purpose**: AI IPC handlers

**Exports**:
- `export rewriteTextHandler` - AI IPC handlers

### ipc/ai/router.ts
**Purpose**: AI domain router

**Exports**:
- `export ai` - AI domain router

### ipc/ai/schemas.ts
**Purpose**: Zod schemas for AI IPC

**Exports**:
- `export rewriteInputSchema` - Zod schemas for AI IPC
- `export rewriteRoleSchema` - Zod schemas for AI IPC

### ipc/app/handlers.ts
**Purpose**: App info IPC handlers

**Exports**:
- `export appVersion` - item implementation
- `export currentPlatfom` - App info IPC handlers

### ipc/app/router.ts
**Purpose**: App domain router

**Exports**:
- `export app` - App domain router

### ipc/app/schemas.ts
**Purpose**: Zod schemas for app IPC

**Exports**:
- `export appVersionSchema` - item implementation
- `export platformSchema` - Zod schemas for app IPC

### ipc/automation/handlers.ts
**Purpose**: Automation IPC handlers

**Exports**:
- `export calibrateDelays` - item implementation
- `export captureText` - item implementation
- `export replaceText` - item implementation

### ipc/automation/router.ts
**Purpose**: Automation domain router

**Exports**:
- `export automation` - Automation domain router

### ipc/automation/schemas.ts
**Purpose**: Zod schemas for automation IPC

**Exports**:
- `export calibrateDelaysInputSchema` - item implementation
- `export captureModeSchema` - Zod schemas for automation IPC
- `export captureTextInputSchema` - Zod schemas for automation IPC
- `export replaceTextInputSchema` - item implementation

### ipc/context.ts
**Purpose**: IPC context with main window reference and window manager

**Exports**:
- `export ipcContext` - item implementation

### ipc/handler.ts
**Purpose**: oRPC handler for main process

**Exports**:
- `export rpcHandler` - oRPC handler for main process

### ipc/router.ts
**Purpose**: Root oRPC router combining all domains

**Exports**:
- `export router` - item implementation

### ipc/settings/handlers.ts
**Purpose**: Settings IPC handlers

**Exports**:
- `export deleteApiKeyHandler` - item implementation
- `export getSettings` - item implementation
- `export hasApiKeyHandler` - item implementation
- `export isEncryptionAvailableHandler` - item implementation
- `export saveApiKeyHandler` - item implementation
- `export updateSettings` - item implementation

### ipc/settings/router.ts
**Purpose**: Settings domain router

**Exports**:
- `export settings` - item implementation

### ipc/settings/schemas.ts
**Purpose**: Zod schemas for settings IPC

**Exports**:
- `export aiModelSchema` - item implementation
- `export aiProviderSchema` - item implementation
- `export aiSettingsSchema` - item implementation
- `export appSettingsSchema` - item implementation
- `export automationSettingsSchema` - item implementation
- `export deleteApiKeyInputSchema` - item implementation
- `export hasApiKeyInputSchema` - item implementation
- `export hotkeysSettingsSchema` - item implementation
- `export isEncryptionAvailableInputSchema` - item implementation
- `export saveApiKeyInputSchema` - item implementation
- `export isValidHotkeyAccelerator` - item implementation

### ipc/shell/handlers.ts
**Purpose**: Shell operations IPC handlers

**Exports**:
- `export openExternalLink` - Shell operations IPC handlers

### ipc/shell/router.ts
**Purpose**: Shell domain router

**Exports**:
- `export shell` - Shell domain router

### ipc/shell/schemas.ts
**Purpose**: Zod schemas for shell IPC

**Exports**:
- `export openExternalLinkInputSchema` - Zod schemas for shell IPC

### ipc/shortcuts/handlers.ts
**Purpose**: Shortcuts IPC handlers

**Exports**:
- `export reregisterShortcuts` - Shortcuts IPC handlers
- `export unregisterAllShortcuts` - item implementation

### ipc/shortcuts/router.ts
**Purpose**: Shortcuts domain router

**Exports**:
- `export shortcuts` - Shortcuts domain router

### ipc/shortcuts/schemas.ts
**Purpose**: Zod schemas for shortcuts IPC

**Exports**:
- `export registerShortcutInputSchema` - item implementation
- `export shortcutActionSchema` - Zod schemas for shortcuts IPC

### ipc/theme/handlers.ts
**Purpose**: Theme mode IPC handlers

**Exports**:
- `export getCurrentThemeMode` - Theme mode IPC handlers
- `export setThemeMode` - item implementation
- `export toggleThemeMode` - item implementation

### ipc/theme/router.ts
**Purpose**: Theme domain router

**Exports**:
- `export theme` - Theme domain router

### ipc/theme/schemas.ts
**Purpose**: Zod schemas for theme IPC

**Exports**:
- `export setThemeModeInputSchema` - Zod schemas for theme IPC

### ipc/window/handlers.ts
**Purpose**: Window control IPC handlers

**Exports**:
- `export closeWindow` - item implementation
- `export maximizeWindow` - item implementation
- `export minimizeWindow` - Window control IPC handlers

### ipc/window/router.ts
**Purpose**: Window domain router

**Exports**:
- `export window` - Window domain router

### ipc/window/schemas.ts
**Purpose**: Zod schemas for window IPC

**Exports**:
- `export setWindowBoundsSchema` - Schema for setting window bounds
- `export windowActionResultSchema` - Schema for window action results (void operations)
- `export windowStateSchema` - Schema for window state values

### main.ts
**Purpose**: Electron main process entrypoint

*No exports found*

### main/ai/client.ts
**Purpose**: Google Gemini AI client

**Exports**:
- `export rewriteText` - Streams a rewritten version of the given text using the c...

### main/ai/error-handler.ts
**Purpose**: AI error handling utilities

**Exports**:
- `export AIErrorDetails` - AI error handling utilities
- `export parseAIError` - Analyzes an AI SDK error and returns user-friendly error ...

### main/ai/prompts.ts
**Purpose**: Role-based prompt templates

**Exports**:
- `export buildPrompt` - item implementation

### main/app.ts
**Purpose**: Main process lifecycle and initialization

**Exports**:
- `export initializeApp` - Initialize the Electron application

### main/automation/clipboard.ts
**Purpose**: Clipboard backup/restore utilities

**Exports**:
- `export backupClipboard` - Clipboard backup/restore utilities
- `export readClipboard` - item implementation
- `export restoreClipboard` - item implementation
- `export writeClipboard` - item implementation

### main/automation/keyboard.ts
**Purpose**: nut-js wrapper for keyboard automation

**Exports**:
- `export pressCopyShortcut` - item implementation
- `export pressPasteShortcut` - item implementation
- `export pressSelectAllShortcut` - item implementation
- `export simulateCopy` - item implementation
- `export simulatePaste` - item implementation
- `export simulateSelectAll` - item implementation

### main/shortcuts/handlers.ts
**Purpose**: Fix selection/field orchestration handlers

**Exports**:
- `export handleFixField` - Global shortcut handler that rewrites the entire active i...
- `export handleFixSelection` - Global shortcut handler that rewrites the current selecti...
- `export handleOpenSettings` - Global shortcut handler that opens the Settings page in t...
- `export handleTogglePopup` - Global shortcut handler that opens (or focuses) the popup...

### main/shortcuts/manager.ts
**Purpose**: Global shortcut registration manager

**Exports**:
- `export ShortcutManager` - item implementation
- `export shortcutManager` - item implementation

### main/storage/api-keys.ts
**Purpose**: safeStorage wrapper for API key encryption

**Exports**:
- `export deleteApiKey` - item implementation
- `export getApiKey` - item implementation
- `export getApiKeyPreview` - item implementation
- `export hasApiKey` - item implementation
- `export isEncryptionAvailable` - safeStorage wrapper for API key encryption
- `export saveApiKey` - item implementation

### main/storage/context.ts
**Purpose**: In-memory edit context storage

**Exports**:
- `export EditContext` - In-memory edit context storage
- `export clearEditContexts` - item implementation
- `export getEditContext` - item implementation
- `export getLastEditContext` - item implementation
- `export saveEditContext` - item implementation

### main/storage/settings.ts
**Purpose**: electron-store instance for persistent settings

**Exports**:
- `export store` - electron-store instance for persistent settings
- `export initializeSettingsStore` - item implementation

### main/tray/tray-manager.ts
**Purpose**: System tray lifecycle management

**Exports**:
- `export TrayManager` - System tray lifecycle management
- `export trayManager` - item implementation

### main/windows/window-manager.ts
**Purpose**: Centralized window lifecycle management

**Exports**:
- `export WindowManager` - Centralized window lifecycle management
- `export windowManager` - item implementation

### preload.ts
**Purpose**: Preload script entrypoint

*No exports found*

### preload/bridge.ts
**Purpose**: IPC bridge via contextBridge

**Exports**:
- `export setupBridge` - Setup the preload bridge for IPC communication

### renderer.ts
**Purpose**: Renderer process entrypoint

*No exports found*

### renderer/app.tsx
**Purpose**: React application root and mounting

**Exports**:
- `export default` - Root React component for the application
- `export mountApp` - Mount the React application to the DOM

### renderer/components/drag-window-region.tsx
**Purpose**: Draggable title bar with window controls

**Exports**:
- `export default` - item implementation

### renderer/components/error-boundary.tsx
**Purpose**: React error boundary with recovery UI

**Exports**:
- `export ErrorBoundary` - item implementation

### renderer/components/external-link.tsx
**Purpose**: External link button using shell API

**Exports**:
- `export default` - item implementation

### renderer/components/lang-toggle.tsx
**Purpose**: Language selection toggle group

**Exports**:
- `export default` - item implementation

### renderer/components/toggle-theme.tsx
**Purpose**: Theme toggle button component

**Exports**:
- `export default` - Theme toggle button component

### renderer/components/ui/accordion.tsx
**Purpose**: 5 exports

**Exports**:
- `export Accordion` - item implementation
- `export AccordionItem` - item implementation
- `export AccordionPanel` - item implementation
- `export AccordionTrigger` - item implementation
- `export AccordionContent` - item implementation

### renderer/components/ui/alert-dialog.tsx
**Purpose**: 13 exports

**Exports**:
- `export AlertDialog` - item implementation
- `export AlertDialogPortal` - item implementation
- `export AlertDialogBackdrop` - item implementation
- `export AlertDialogClose` - item implementation
- `export AlertDialogDescription` - item implementation
- `export AlertDialogFooter` - item implementation
- `export AlertDialogHeader` - item implementation
- `export AlertDialogPopup` - item implementation
- `export AlertDialogTitle` - item implementation
- `export AlertDialogTrigger` - item implementation
- `export AlertDialogViewport` - item implementation
- `export AlertDialogContent` - item implementation
- `export AlertDialogOverlay` - item implementation

### renderer/components/ui/alert.tsx
**Purpose**: 4 exports

**Exports**:
- `export Alert` - item implementation
- `export AlertAction` - item implementation
- `export AlertDescription` - item implementation
- `export AlertTitle` - item implementation

### renderer/components/ui/autocomplete.tsx
**Purpose**: 15 exports

**Exports**:
- `export Autocomplete` - item implementation
- `export AutocompleteClear` - item implementation
- `export AutocompleteCollection` - item implementation
- `export AutocompleteEmpty` - item implementation
- `export AutocompleteGroup` - item implementation
- `export AutocompleteGroupLabel` - item implementation
- `export AutocompleteInput` - item implementation
- `export AutocompleteItem` - item implementation
- `export AutocompleteList` - item implementation
- `export AutocompletePopup` - item implementation
- `export AutocompleteRow` - item implementation
- `export AutocompleteSeparator` - item implementation
- `export AutocompleteStatus` - item implementation
- `export AutocompleteTrigger` - item implementation
- `export AutocompleteValue` - item implementation

### renderer/components/ui/avatar.tsx
**Purpose**: 3 exports

**Exports**:
- `export Avatar` - item implementation
- `export AvatarFallback` - item implementation
- `export AvatarImage` - item implementation

### renderer/components/ui/badge.tsx
**Purpose**: 2 exports

**Exports**:
- `export badgeVariants` - item implementation
- `export Badge` - item implementation

### renderer/components/ui/breadcrumb.tsx
**Purpose**: 7 exports

**Exports**:
- `export Breadcrumb` - item implementation
- `export BreadcrumbEllipsis` - item implementation
- `export BreadcrumbItem` - item implementation
- `export BreadcrumbLink` - item implementation
- `export BreadcrumbList` - item implementation
- `export BreadcrumbPage` - item implementation
- `export BreadcrumbSeparator` - item implementation

### renderer/components/ui/button.tsx
**Purpose**: 2 exports

**Exports**:
- `export buttonVariants` - item implementation
- `export Button` - item implementation

### renderer/components/ui/card.tsx
**Purpose**: 8 exports

**Exports**:
- `export Card` - item implementation
- `export CardAction` - item implementation
- `export CardDescription` - item implementation
- `export CardFooter` - item implementation
- `export CardHeader` - item implementation
- `export CardPanel` - item implementation
- `export CardTitle` - item implementation
- `export CardContent` - item implementation

### renderer/components/ui/checkbox-group.tsx
**Purpose**: 1 export

**Exports**:
- `export CheckboxGroup` - item implementation

### renderer/components/ui/checkbox.tsx
**Purpose**: 1 export

**Exports**:
- `export Checkbox` - item implementation

### renderer/components/ui/collapsible.tsx
**Purpose**: 4 exports

**Exports**:
- `export Collapsible` - item implementation
- `export CollapsiblePanel` - item implementation
- `export CollapsibleTrigger` - item implementation
- `export CollapsibleContent` - item implementation

### renderer/components/ui/combobox.tsx
**Purpose**: 17 exports

**Exports**:
- `export Combobox` - item implementation
- `export ComboboxChip` - item implementation
- `export ComboboxChips` - item implementation
- `export ComboboxClear` - item implementation
- `export ComboboxCollection` - item implementation
- `export ComboboxEmpty` - item implementation
- `export ComboboxGroup` - item implementation
- `export ComboboxGroupLabel` - item implementation
- `export ComboboxInput` - item implementation
- `export ComboboxItem` - item implementation
- `export ComboboxList` - item implementation
- `export ComboboxPopup` - item implementation
- `export ComboboxRow` - item implementation
- `export ComboboxSeparator` - item implementation
- `export ComboboxStatus` - item implementation
- `export ComboboxTrigger` - item implementation
- `export ComboboxValue` - item implementation

### renderer/components/ui/command.tsx
**Purpose**: 15 exports

**Exports**:
- `export CommandDialog` - item implementation
- `export Command` - item implementation
- `export CommandCollection` - item implementation
- `export CommandDialogPopup` - item implementation
- `export CommandDialogTrigger` - item implementation
- `export CommandEmpty` - item implementation
- `export CommandFooter` - item implementation
- `export CommandGroup` - item implementation
- `export CommandGroupLabel` - item implementation
- `export CommandInput` - item implementation
- `export CommandItem` - item implementation
- `export CommandList` - item implementation
- `export CommandPanel` - item implementation
- `export CommandSeparator` - item implementation
- `export CommandShortcut` - item implementation

### renderer/components/ui/dialog.tsx
**Purpose**: 14 exports

**Exports**:
- `export Dialog` - item implementation
- `export DialogPortal` - item implementation
- `export DialogBackdrop` - item implementation
- `export DialogClose` - item implementation
- `export DialogDescription` - item implementation
- `export DialogFooter` - item implementation
- `export DialogHeader` - item implementation
- `export DialogPanel` - item implementation
- `export DialogPopup` - item implementation
- `export DialogTitle` - item implementation
- `export DialogTrigger` - item implementation
- `export DialogViewport` - item implementation
- `export DialogContent` - item implementation
- `export DialogOverlay` - item implementation

### renderer/components/ui/empty.tsx
**Purpose**: 6 exports

**Exports**:
- `export Empty` - item implementation
- `export EmptyContent` - item implementation
- `export EmptyDescription` - item implementation
- `export EmptyHeader` - item implementation
- `export EmptyMedia` - item implementation
- `export EmptyTitle` - item implementation

### renderer/components/ui/field.tsx
**Purpose**: 6 exports

**Exports**:
- `export FieldControl` - item implementation
- `export FieldValidity` - item implementation
- `export Field` - item implementation
- `export FieldDescription` - item implementation
- `export FieldError` - item implementation
- `export FieldLabel` - item implementation

### renderer/components/ui/fieldset.tsx
**Purpose**: 2 exports

**Exports**:
- `export Fieldset` - item implementation
- `export FieldsetLegend` - item implementation

### renderer/components/ui/form.tsx
**Purpose**: 1 export

**Exports**:
- `export Form` - item implementation

### renderer/components/ui/frame.tsx
**Purpose**: 6 exports

**Exports**:
- `export Frame` - item implementation
- `export FrameDescription` - item implementation
- `export FrameFooter` - item implementation
- `export FrameHeader` - item implementation
- `export FramePanel` - item implementation
- `export FrameTitle` - item implementation

### renderer/components/ui/group.tsx
**Purpose**: 7 exports

**Exports**:
- `export groupVariants` - item implementation
- `export Group` - item implementation
- `export GroupSeparator` - item implementation
- `export GroupText` - item implementation
- `export ButtonGroup` - item implementation
- `export ButtonGroupSeparator` - item implementation
- `export ButtonGroupText` - item implementation

### renderer/components/ui/input-group.tsx
**Purpose**: 5 exports

**Exports**:
- `export InputGroup` - item implementation
- `export InputGroupAddon` - item implementation
- `export InputGroupInput` - item implementation
- `export InputGroupText` - item implementation
- `export InputGroupTextarea` - item implementation

### renderer/components/ui/input.tsx
**Purpose**: 2 exports

**Exports**:
- `export InputProps` - item implementation
- `export Input` - item implementation

### renderer/components/ui/kbd.tsx
**Purpose**: 2 exports

**Exports**:
- `export Kbd` - item implementation
- `export KbdGroup` - item implementation

### renderer/components/ui/label.tsx
**Purpose**: 1 export

**Exports**:
- `export Label` - item implementation

### renderer/components/ui/menu.tsx
**Purpose**: 30 exports

**Exports**:
- `export Menu` - item implementation
- `export MenuPortal` - item implementation
- `export MenuCheckboxItem` - item implementation
- `export MenuGroup` - item implementation
- `export MenuGroupLabel` - item implementation
- `export MenuItem` - item implementation
- `export MenuPopup` - item implementation
- `export MenuRadioGroup` - item implementation
- `export MenuRadioItem` - item implementation
- `export MenuSeparator` - item implementation
- `export MenuShortcut` - item implementation
- `export MenuSub` - item implementation
- `export MenuSubPopup` - item implementation
- `export MenuSubTrigger` - item implementation
- `export MenuTrigger` - item implementation
- `export DropdownMenu` - item implementation
- `export DropdownMenuCheckboxItem` - item implementation
- `export DropdownMenuContent` - item implementation
- `export DropdownMenuGroup` - item implementation
- `export DropdownMenuItem` - item implementation
- `export DropdownMenuLabel` - item implementation
- `export DropdownMenuPortal` - item implementation
- `export DropdownMenuRadioGroup` - item implementation
- `export DropdownMenuRadioItem` - item implementation
- `export DropdownMenuSeparator` - item implementation
- `export DropdownMenuShortcut` - item implementation
- `export DropdownMenuSub` - item implementation
- `export DropdownMenuSubContent` - item implementation
- `export DropdownMenuSubTrigger` - item implementation
- `export DropdownMenuTrigger` - item implementation

### renderer/components/ui/meter.tsx
**Purpose**: 5 exports

**Exports**:
- `export Meter` - item implementation
- `export MeterIndicator` - item implementation
- `export MeterLabel` - item implementation
- `export MeterTrack` - item implementation
- `export MeterValue` - item implementation

### renderer/components/ui/number-field.tsx
**Purpose**: 6 exports

**Exports**:
- `export NumberField` - item implementation
- `export NumberFieldDecrement` - item implementation
- `export NumberFieldGroup` - item implementation
- `export NumberFieldIncrement` - item implementation
- `export NumberFieldInput` - item implementation
- `export NumberFieldScrubArea` - item implementation

### renderer/components/ui/pagination.tsx
**Purpose**: 7 exports

**Exports**:
- `export Pagination` - item implementation
- `export PaginationContent` - item implementation
- `export PaginationEllipsis` - item implementation
- `export PaginationItem` - item implementation
- `export PaginationLink` - item implementation
- `export PaginationNext` - item implementation
- `export PaginationPrevious` - item implementation

### renderer/components/ui/popover.tsx
**Purpose**: 8 exports

**Exports**:
- `export Popover` - item implementation
- `export PopoverCreateHandle` - item implementation
- `export PopoverClose` - item implementation
- `export PopoverDescription` - item implementation
- `export PopoverPopup` - item implementation
- `export PopoverTitle` - item implementation
- `export PopoverTrigger` - item implementation
- `export PopoverContent` - item implementation

### renderer/components/ui/preview-card.tsx
**Purpose**: 6 exports

**Exports**:
- `export PreviewCard` - item implementation
- `export PreviewCardPopup` - item implementation
- `export PreviewCardTrigger` - item implementation
- `export HoverCard` - item implementation
- `export HoverCardContent` - item implementation
- `export HoverCardTrigger` - item implementation

### renderer/components/ui/progress.tsx
**Purpose**: 5 exports

**Exports**:
- `export Progress` - item implementation
- `export ProgressIndicator` - item implementation
- `export ProgressLabel` - item implementation
- `export ProgressTrack` - item implementation
- `export ProgressValue` - item implementation

### renderer/components/ui/radio-group.tsx
**Purpose**: 3 exports

**Exports**:
- `export Radio` - item implementation
- `export RadioGroup` - item implementation
- `export RadioGroupItem` - item implementation

### renderer/components/ui/scroll-area.tsx
**Purpose**: 2 exports

**Exports**:
- `export ScrollArea` - item implementation
- `export ScrollBar` - item implementation

### renderer/components/ui/select.tsx
**Purpose**: 9 exports

**Exports**:
- `export Select` - item implementation
- `export SelectGroup` - item implementation
- `export SelectGroupLabel` - item implementation
- `export SelectItem` - item implementation
- `export SelectPopup` - item implementation
- `export SelectSeparator` - item implementation
- `export SelectTrigger` - item implementation
- `export SelectValue` - item implementation
- `export SelectContent` - item implementation

### renderer/components/ui/separator.tsx
**Purpose**: 1 export

**Exports**:
- `export Separator` - item implementation

### renderer/components/ui/sheet.tsx
**Purpose**: 13 exports

**Exports**:
- `export Sheet` - item implementation
- `export SheetPortal` - item implementation
- `export SheetBackdrop` - item implementation
- `export SheetClose` - item implementation
- `export SheetDescription` - item implementation
- `export SheetFooter` - item implementation
- `export SheetHeader` - item implementation
- `export SheetPanel` - item implementation
- `export SheetPopup` - item implementation
- `export SheetTitle` - item implementation
- `export SheetTrigger` - item implementation
- `export SheetContent` - item implementation
- `export SheetOverlay` - item implementation

### renderer/components/ui/sidebar.tsx
**Purpose**: 24 exports

**Exports**:
- `export Sidebar` - item implementation
- `export SidebarContent` - item implementation
- `export SidebarFooter` - item implementation
- `export SidebarGroup` - item implementation
- `export SidebarGroupAction` - item implementation
- `export SidebarGroupContent` - item implementation
- `export SidebarGroupLabel` - item implementation
- `export SidebarHeader` - item implementation
- `export SidebarInput` - item implementation
- `export SidebarInset` - item implementation
- `export SidebarMenu` - item implementation
- `export SidebarMenuAction` - item implementation
- `export SidebarMenuBadge` - item implementation
- `export SidebarMenuButton` - item implementation
- `export SidebarMenuItem` - item implementation
- `export SidebarMenuSkeleton` - item implementation
- `export SidebarMenuSub` - item implementation
- `export SidebarMenuSubButton` - item implementation
- `export SidebarMenuSubItem` - item implementation
- `export SidebarProvider` - item implementation
- `export SidebarRail` - item implementation
- `export SidebarSeparator` - item implementation
- `export SidebarTrigger` - item implementation
- `export useSidebar` - item implementation

### renderer/components/ui/skeleton.tsx
**Purpose**: 1 export

**Exports**:
- `export Skeleton` - item implementation

### renderer/components/ui/slider.tsx
**Purpose**: 2 exports

**Exports**:
- `export Slider` - item implementation
- `export SliderValue` - item implementation

### renderer/components/ui/spinner.tsx
**Purpose**: 1 export

**Exports**:
- `export Spinner` - item implementation

### renderer/components/ui/switch.tsx
**Purpose**: 1 export

**Exports**:
- `export Switch` - item implementation

### renderer/components/ui/table.tsx
**Purpose**: 8 exports

**Exports**:
- `export Table` - item implementation
- `export TableBody` - item implementation
- `export TableCaption` - item implementation
- `export TableCell` - item implementation
- `export TableFooter` - item implementation
- `export TableHead` - item implementation
- `export TableHeader` - item implementation
- `export TableRow` - item implementation

### renderer/components/ui/tabs.tsx
**Purpose**: 6 exports

**Exports**:
- `export Tabs` - item implementation
- `export TabsList` - item implementation
- `export TabsPanel` - item implementation
- `export TabsTab` - item implementation
- `export TabsContent` - item implementation
- `export TabsTrigger` - item implementation

### renderer/components/ui/textarea.tsx
**Purpose**: 2 exports

**Exports**:
- `export TextareaProps` - item implementation
- `export Textarea` - item implementation

### renderer/components/ui/toast.tsx
**Purpose**: 5 exports

**Exports**:
- `export ToastPosition` - item implementation
- `export anchoredToastManager` - item implementation
- `export toastManager` - item implementation
- `export AnchoredToastProvider` - item implementation
- `export ToastProvider` - item implementation

### renderer/components/ui/toggle-group.tsx
**Purpose**: 4 exports

**Exports**:
- `export Toggle` - item implementation
- `export ToggleGroup` - item implementation
- `export ToggleGroupSeparator` - item implementation
- `export ToggleGroupItem` - item implementation

### renderer/components/ui/toggle.tsx
**Purpose**: 2 exports

**Exports**:
- `export toggleVariants` - item implementation
- `export Toggle` - item implementation

### renderer/components/ui/toolbar.tsx
**Purpose**: 6 exports

**Exports**:
- `export Toolbar` - item implementation
- `export ToolbarButton` - item implementation
- `export ToolbarGroup` - item implementation
- `export ToolbarInput` - item implementation
- `export ToolbarLink` - item implementation
- `export ToolbarSeparator` - item implementation

### renderer/components/ui/tooltip.tsx
**Purpose**: 6 exports

**Exports**:
- `export Tooltip` - item implementation
- `export TooltipCreateHandle` - item implementation
- `export TooltipProvider` - item implementation
- `export TooltipPopup` - item implementation
- `export TooltipTrigger` - item implementation
- `export TooltipContent` - item implementation

### renderer/features/settings/settings-form.tsx
**Purpose**: Settings form component

**Exports**:
- `export default` - item implementation

### renderer/hooks/use-mobile.ts
**Purpose**: 1 export

**Exports**:
- `export useIsMobile` - item implementation

### renderer/layouts/base-layout.tsx
**Purpose**: Base layout with title bar region

**Exports**:
- `export default` - Base layout with title bar region

### renderer/lib/i18n.ts
**Purpose**: i18next configuration and translations

*No exports found*

### renderer/lib/ipc-manager.ts
**Purpose**: IPC client manager for renderer process

**Exports**:
- `export ipc` - item implementation

### renderer/lib/langs.ts
**Purpose**: Supported language definitions

**Exports**:
- `export default` - Supported language definitions

### renderer/lib/language.ts
**Purpose**: Language type definition

**Exports**:
- `export Language` - Language type definition

### renderer/lib/routes.ts
**Purpose**: TanStack Router configuration

**Exports**:
- `export router` - item implementation

### renderer/lib/tailwind.ts
**Purpose**: Tailwind CSS class merging utility

**Exports**:
- `export cn` - Tailwind CSS class merging utility

### routeTree.gen.ts
**Purpose**: 6 exports

**Exports**:
- `export FileRoutesByFullPath` - item implementation
- `export FileRoutesById` - item implementation
- `export FileRoutesByTo` - item implementation
- `export FileRouteTypes` - item implementation
- `export RootRouteChildren` - item implementation
- `export routeTree` - item implementation

### routes/__root.tsx
**Purpose**: Root route with base layout wrapper

**Exports**:
- `export Route` - item implementation

### routes/index.tsx
**Purpose**: Dashboard page route component

**Exports**:
- `export Route` - item implementation

### routes/popup.tsx
**Purpose**: Popup chat route component

**Exports**:
- `export Route` - item implementation

### routes/settings.tsx
**Purpose**: Settings page route component

**Exports**:
- `export Route` - item implementation

### shared/config/ai-models.ts
**Purpose**: Centralized AI model configuration This is the single source of truth for all available models

**Exports**:
- `export ModelConfig` - Centralized AI model configuration
This is the single sou...
- `export ProviderConfig` - item implementation
- `export AIModel` - item implementation
- `export AIProvider` - item implementation
- `export AI_PROVIDERS` - item implementation
- `export getDefaultModel` - Get the default model for a provider
- `export getModelsForProvider` - Get all models for a specific provider
- `export getProviderName` - Get provider name
- `export isValidModel` - Validate if a model ID is valid for a provider

### shared/contracts/ipc-channels.ts
**Purpose**: IPC channel names and storage keys

**Exports**:
- `export IPC_CHANNELS` - IPC channel names and storage keys
- `export LOCAL_STORAGE_KEYS` - IPC channel names and storage keys

### shared/types/ai.ts
**Purpose**: AI types

**Exports**:
- `export StreamChunk` - AI types
- `export RewriteRole` - AI types

### shared/types/automation.ts
**Purpose**: Automation types

**Exports**:
- `export CaptureResult` - Automation types
- `export AutomationCalibrationResult` - item implementation
- `export CaptureMode` - Automation types

### shared/types/settings.ts
**Purpose**: Settings schema types

**Exports**:
- `export AISettings` - item implementation
- `export AppSettings` - item implementation
- `export AutomationSettings` - item implementation
- `export HotkeysSettings` - Settings schema types

### shared/types/shortcuts.ts
**Purpose**: Hotkey types

**Exports**:
- `export ShortcutAction` - Hotkey types

### shared/types/theme.ts
**Purpose**: Theme mode type definition

**Exports**:
- `export ThemeMode` - Theme mode type definition

### tests/unit/setup.ts
**Purpose**: Vitest setup with jest-dom matchers

*No exports found*


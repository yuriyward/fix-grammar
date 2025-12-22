# Project File Structure

*Generated automatically from TypeScript source code*

## Tree Overview

actions/ # 5 files
  ├─ app.ts # App info IPC wrappers for renderer
  ├─ language.ts # Language preference management for renderer
  ├─ shell.ts # Shell operations IPC wrapper for renderer
  ├─ theme.ts # Theme mode management for renderer
  └─ window.ts # Window control IPC wrappers for renderer
ipc/ # 3 files, 4 directories
  ├─ app/ # 3 files
  │ ├─ handlers.ts # App info IPC handlers
  │ ├─ router.ts # App domain router
  │ └─ schemas.ts # Zod schemas for app IPC
  ├─ shell/ # 3 files
  │ ├─ handlers.ts # Shell operations IPC handlers
  │ ├─ router.ts # Shell domain router
  │ └─ schemas.ts # Zod schemas for shell IPC
  ├─ theme/ # 3 files
  │ ├─ handlers.ts # Theme mode IPC handlers
  │ ├─ router.ts # Theme domain router
  │ └─ schemas.ts # Zod schemas for theme IPC
  ├─ window/ # 3 files
  │ ├─ handlers.ts # Window control IPC handlers
  │ ├─ router.ts # Window domain router
  │ └─ schemas.ts # Zod schemas for window IPC
  ├─ context.ts # IPC context with main window reference
  ├─ handler.ts # oRPC handler for main process
  └─ router.ts # Root oRPC router combining all domains
main/ # 1 files, 1 directories
  ├─ windows/ # 1 file
  │ └─ main-window.ts # Main application window creation
  └─ app.ts # Main process lifecycle and initialization
preload/ # 1 file
  └─ bridge.ts # IPC bridge via contextBridge
renderer/ # 1 files, 3 directories
  ├─ components/ # 6 files, 1 directories
  │ ├─ ui/ # 4 files
  │ │ ├─ button.tsx # Button component with variants (shadcn/ui)
  │ │ ├─ navigation-menu.tsx # Navigation menu primitives (shadcn/ui)
  │ │ ├─ toggle-group.tsx # Toggle group component (shadcn/ui)
  │ │ └─ toggle.tsx # Toggle component with variants (shadcn/ui)
  │ ├─ drag-window-region.tsx # Draggable title bar with window controls
  │ ├─ error-boundary.tsx # React error boundary with recovery UI
  │ ├─ external-link.tsx # External link button using shell API
  │ ├─ lang-toggle.tsx # Language selection toggle group
  │ ├─ navigation-menu.tsx # Main app navigation menu component
  │ └─ toggle-theme.tsx # Theme toggle button component
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
routes/ # 2 files
  ├─ __root.tsx # Root route with base layout wrapper
  ├─ index.tsx # Home page route component
  └─ second.tsx # Second page route component
shared/ # 2 directories
  ├─ contracts/ # 1 file
  │ └─ ipc-channels.ts # IPC channel names and storage keys
  └─ types/ # 1 file
    └─ theme.ts # Theme mode type definition
tests/ # 1 directory
  └─ unit/ # 1 file
    └─ setup.ts # Vitest setup with jest-dom matchers
main.ts # Electron main process entrypoint
preload.ts # Preload script entrypoint
renderer.ts # Renderer process entrypoint
routeTree.gen.ts # 6 exports

## File Details

### actions/app.ts
**Purpose**: App info IPC wrappers for renderer

**Exports**:
- `export getAppVersion` - App info IPC wrappers for renderer
- `export getPlatform` - App info IPC wrappers for renderer

### actions/language.ts
**Purpose**: Language preference management for renderer

**Exports**:
- `export setAppLanguage` - Language preference management for renderer
- `export updateAppLanguage` - item implementation

### actions/shell.ts
**Purpose**: Shell operations IPC wrapper for renderer

**Exports**:
- `export openExternalLink` - Shell operations IPC wrapper for renderer

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

### ipc/context.ts
**Purpose**: IPC context with main window reference

**Exports**:
- `export ipcContext` - item implementation

### ipc/handler.ts
**Purpose**: oRPC handler for main process

**Exports**:
- `export rpcHandler` - oRPC handler for main process

### ipc/router.ts
**Purpose**: Root oRPC router combining all domains

**Exports**:
- `export router` - Root oRPC router combining all domains

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

### main/app.ts
**Purpose**: Main process lifecycle and initialization

**Exports**:
- `export initializeApp` - Initialize the Electron application

### main/windows/main-window.ts
**Purpose**: Main application window creation

**Exports**:
- `export createWindow` - Creates and configures the main application window

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

### renderer/components/navigation-menu.tsx
**Purpose**: Main app navigation menu component

**Exports**:
- `export default` - item implementation

### renderer/components/toggle-theme.tsx
**Purpose**: Theme toggle button component

**Exports**:
- `export default` - Theme toggle button component

### renderer/components/ui/button.tsx
**Purpose**: Button component with variants (shadcn/ui)

**Exports**:
- `export buttonVariants` - Button component with variants (shadcn/ui)
- `export Button` - item implementation

### renderer/components/ui/navigation-menu.tsx
**Purpose**: Navigation menu primitives (shadcn/ui)

**Exports**:
- `export navigationMenuTriggerStyle` - item implementation
- `export NavigationMenu` - item implementation
- `export NavigationMenuContent` - item implementation
- `export NavigationMenuIndicator` - item implementation
- `export NavigationMenuItem` - item implementation
- `export NavigationMenuLink` - item implementation
- `export NavigationMenuList` - item implementation
- `export NavigationMenuTrigger` - item implementation
- `export NavigationMenuViewport` - item implementation

### renderer/components/ui/toggle-group.tsx
**Purpose**: Toggle group component (shadcn/ui)

**Exports**:
- `export ToggleGroup` - item implementation
- `export ToggleGroupItem` - item implementation

### renderer/components/ui/toggle.tsx
**Purpose**: Toggle component with variants (shadcn/ui)

**Exports**:
- `export toggleVariants` - Toggle component with variants (shadcn/ui)
- `export Toggle` - item implementation

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
**Purpose**: Home page route component

**Exports**:
- `export Route` - item implementation

### routes/second.tsx
**Purpose**: Second page route component

**Exports**:
- `export Route` - item implementation

### shared/contracts/ipc-channels.ts
**Purpose**: IPC channel names and storage keys

**Exports**:
- `export IPC_CHANNELS` - IPC channel names and storage keys
- `export LOCAL_STORAGE_KEYS` - IPC channel names and storage keys

### shared/types/theme.ts
**Purpose**: Theme mode type definition

**Exports**:
- `export ThemeMode` - Theme mode type definition

### tests/unit/setup.ts
**Purpose**: Vitest setup with jest-dom matchers

*No exports found*


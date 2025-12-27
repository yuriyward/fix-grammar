# Grammar/Rewrite Copilot - Implementation Plan

## Executive Summary

Implement a Grammar/Rewrite Copilot desktop app that captures text via global hotkeys, rewrites it using Google Gemini AI, and replaces it in-place. The app runs as a system tray utility with minimal UI footprint.

**Tech Stack:**
- **AI Provider:** Google Gemini (via `@ai-sdk/google`)
- **Keyboard Automation:** nut-js (cross-platform native module)
- **Storage:** electron-store + safeStorage
- **Streaming:** oRPC subscriptions (existing pattern)
- **Process:** Strict main/renderer boundaries (existing security model)

**Key Decisions:**
1. **AI Provider:** Google Gemini (`gemini-2.5-flash` for MVP)
2. **Keyboard Automation:** nut-js (modern, maintained, async API)
3. **Storage:** Multi-layer (API keys in safeStorage, settings in electron-store)
4. **Streaming:** oRPC subscriptions for real-time AI responses
5. **Window Architecture:** Tray-first with hidden main window

---

## Architecture Overview

### IPC Domain Structure

**5 New Domains** (following existing pattern):

```
src/ipc/
├─ ai/              # NEW: AI rewriting with streaming
├─ automation/      # NEW: Clipboard + keyboard simulation
├─ settings/        # NEW: Persistent storage management
├─ shortcuts/       # NEW: Global hotkey registration
├─ popup/           # NEW: Popup window lifecycle
├─ app/             # Existing
├─ shell/           # Existing
├─ theme/           # Existing
└─ window/          # Existing
```

### Process Boundaries (Security-First)

**Main Process Only:**
- Google Gemini API calls (`@ai-sdk/google`)
- API key decryption (`safeStorage.decryptString()`)
- Global shortcut registration (`globalShortcut.register()`)
- Keyboard automation (`@nut-tree/nut-js`)
- Clipboard operations (`clipboard.readText()`, `clipboard.writeText()`)

**Renderer Process:**
- React UI (settings form, popup chat)
- IPC client calls (`ipc.client.ai.rewriteText(...)`)
- Streaming UI updates (React state)

**Shared via IPC:**
- Text to rewrite, role selection → Main
- Streamed deltas, final text ← Main
- Settings changes (no API keys ever exposed to renderer)

---

## Core Implementation Details

### 1. AI Integration (Google Gemini)

**Package:** `@ai-sdk/google`

**Setup:**
```typescript
// src/main/ai/client.ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function rewriteText(
  text: string,
  role: RewriteRole,
  apiKey: string
) {
  return streamText({
    model: google('gemini-2.5-flash', { apiKey }),
    prompt: buildPrompt(text, role),
  });
}
```

**Streaming Handler:**
```typescript
// src/ipc/ai/handlers.ts
export const rewriteText = os
  .input(rewriteInputSchema)
  .subscription(async function* ({ input }) {
    const apiKey = getApiKey('google'); // From safeStorage
    const result = await rewriteText(input.text, input.role, apiKey);

    for await (const chunk of result.textStream) {
      yield { type: 'delta', content: chunk };
    }

    yield { type: 'complete', content: await result.text };
  });
```

**Renderer Consumer:**
```typescript
// src/actions/ai.ts
export async function rewriteText(
  text: string,
  role: RewriteRole,
  onProgress: (delta: string) => void
): Promise<string> {
  const subscription = ipc.client.ai.rewriteText({ text, role });

  let fullText = '';
  for await (const chunk of subscription) {
    if (chunk.type === 'delta') {
      fullText += chunk.content;
      onProgress(chunk.content);
    } else if (chunk.type === 'complete') {
      return chunk.content;
    }
  }
  return fullText;
}
```

---

### 2. Keyboard Automation (nut-js)

**Package:** `@nut-tree/nut-js`

**Platform Detection:**
```typescript
// src/main/automation/keyboard.ts
import { keyboard, Key } from '@nut-tree/nut-js';

const isMac = process.platform === 'darwin';
const modifierKey = isMac ? Key.LeftSuper : Key.LeftControl;

export async function simulateCopy() {
  await keyboard.pressKey(modifierKey, Key.C);
  await keyboard.releaseKey(modifierKey, Key.C);
  // Wait for clipboard to update
  await new Promise(resolve => setTimeout(resolve, 100));
}

export async function simulatePaste() {
  await keyboard.pressKey(modifierKey, Key.V);
  await keyboard.releaseKey(modifierKey, Key.V);
}

export async function simulateSelectAll() {
  await keyboard.pressKey(modifierKey, Key.A);
  await keyboard.releaseKey(modifierKey, Key.A);
  await new Promise(resolve => setTimeout(resolve, 50));
}
```

**Clipboard Preservation:**
```typescript
// src/main/automation/clipboard.ts
import { clipboard } from 'electron';

let clipboardBackup: string = '';

export function backupClipboard(): void {
  clipboardBackup = clipboard.readText();
}

export function restoreClipboard(): void {
  if (clipboardBackup) {
    clipboard.writeText(clipboardBackup);
    clipboardBackup = '';
  }
}

export function setClipboardTemporary(text: string): void {
  clipboard.writeText(text);
}
```

---

### 3. Storage Architecture

**Three-Layer Approach:**

| Data Type | Solution | Location | Security |
|-----------|----------|----------|----------|
| **API Keys** | `safeStorage` | OS Keychain | Encrypted by OS |
| **Settings** | `electron-store` | `~/Library/Application Support/...` | Plaintext (non-sensitive) |
| **Transient Data** | In-memory | Main process RAM | N/A |

**Implementation:**

```typescript
// src/main/storage/api-keys.ts
import { safeStorage } from 'electron';
import { store } from './settings';

export function saveApiKey(provider: string, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption not available on this system');
  }

  const encrypted = safeStorage.encryptString(key);
  store.set(`apiKeys.${provider}`, encrypted.toString('base64'));
}

export function getApiKey(provider: string): string | null {
  const base64 = store.get(`apiKeys.${provider}`);
  if (!base64) return null;

  const encrypted = Buffer.from(base64, 'base64');
  return safeStorage.decryptString(encrypted);
}
```

```typescript
// src/main/storage/settings.ts
import ElectronStore from 'electron-store';

interface SettingsSchema {
  hotkeys: {
    fixSelection: string;
    fixField: string;
    togglePopup: string;
    openSettings: string;
  };
  ai: {
    provider: 'google' | 'xai';
    model: string;
    role: 'grammar' | 'grammar-tone';
  };
}

export const store = new ElectronStore<SettingsSchema>({
  defaults: {
    hotkeys: {
      fixSelection: 'CommandOrControl+Shift+F',
      fixField: 'CommandOrControl+Shift+G',
      togglePopup: 'CommandOrControl+Shift+P',
      openSettings: 'CommandOrControl+,',
    },
    ai: {
      provider: 'google',
      model: 'gemini-2.5-flash',
      role: 'grammar',
    },
  },
});
```

```typescript
// src/main/storage/context.ts
interface EditContext {
  originalText: string;
  rewrittenText: string;
  timestamp: number;
  role: string;
}

const contextMap = new Map<string, EditContext>();

export function saveEditContext(id: string, context: EditContext): void {
  contextMap.set(id, context);
}

export function getLastEditContext(): EditContext | undefined {
  const entries = Array.from(contextMap.values());
  return entries[entries.length - 1];
}
```

---

### 4. Global Shortcuts Orchestration

**Registration:**
```typescript
// src/main/shortcuts/manager.ts
import { globalShortcut } from 'electron';
import { store } from '@/main/storage/settings';
import { handleFixSelection, handleFixField } from './handlers';

export class ShortcutManager {
  register(): void {
    const shortcuts = store.get('hotkeys');

    globalShortcut.register(shortcuts.fixSelection, handleFixSelection);
    globalShortcut.register(shortcuts.fixField, handleFixField);
    globalShortcut.register(shortcuts.togglePopup, handleTogglePopup);
    globalShortcut.register(shortcuts.openSettings, handleOpenSettings);
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll();
  }

  reregister(): void {
    this.unregisterAll();
    this.register();
  }
}
```

**Fix Selection Flow:**
```typescript
// src/main/shortcuts/handlers.ts
import { backupClipboard, restoreClipboard, setClipboardTemporary } from '../automation/clipboard';
import { simulateCopy, simulatePaste } from '../automation/keyboard';
import { rewriteText } from '../ai/client';
import { saveEditContext } from '../storage/context';

export async function handleFixSelection(): Promise<void> {
  try {
    // 1. Backup clipboard
    backupClipboard();

    // 2. Simulate Cmd+C to capture selection
    await simulateCopy();

    // 3. Read captured text
    const originalText = clipboard.readText();
    if (!originalText.trim()) {
      restoreClipboard();
      showNotification('No text selected');
      return;
    }

    // 4. Restore clipboard immediately
    restoreClipboard();

    // 5. Send to AI (streaming)
    const apiKey = getApiKey(store.get('ai.provider'));
    const role = store.get('ai.role');
    const result = await rewriteText(originalText, role, apiKey);

    let rewrittenText = '';
    for await (const chunk of result.textStream) {
      rewrittenText += chunk;
    }

    // 6. Save context for popup follow-ups
    saveEditContext(uuid(), { originalText, rewrittenText, timestamp: Date.now(), role });

    // 7. Replace selection with rewritten text
    backupClipboard();
    setClipboardTemporary(rewrittenText);
    await simulatePaste();
    restoreClipboard();

  } catch (error) {
    showNotification('Rewrite failed: ' + error.message);
  }
}
```

**Fix Field Flow:**
```typescript
export async function handleFixField(): Promise<void> {
  try {
    backupClipboard();

    // 1. Select all in active field
    await simulateSelectAll();

    // 2. Copy entire field
    await simulateCopy();

    const originalText = clipboard.readText();
    if (!originalText.trim()) {
      restoreClipboard();
      showNotification('No text in field');
      return;
    }

    restoreClipboard();

    // 3. Rewrite and replace (same as Fix Selection)
    // ... (same logic as handleFixSelection from step 5 onwards)

  } catch (error) {
    showNotification('Rewrite failed: ' + error.message);
  }
}
```

---

### 5. Window Management

**Window Types:**

| Window | Lifecycle | Properties | Route |
|--------|-----------|------------|-------|
| **Main Window** | Hidden by default | 800x600, standard frame | `routes/index.tsx` |
| **Settings Window** | On-demand | 600x400, modal | `routes/settings.tsx` |
| **Popup Chat** | On-demand | 400x300, frameless, always-on-top | `routes/popup.tsx` |
| **Tray** | Always (app-wide) | System tray icon + menu | N/A |

**Window Manager:**
```typescript
// src/main/windows/window-manager.ts
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private popupWindow: BrowserWindow | null = null;

  createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false, // Hidden by default
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '/#/');
  }

  createSettingsWindow(): void {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 400,
      parent: this.mainWindow || undefined,
      modal: true,
      resizable: false,
      webPreferences: { /* same as main */ },
    });

    this.settingsWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '/#/settings');

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  createOrFocusPopup(): void {
    if (this.popupWindow) {
      this.popupWindow.focus();
      return;
    }

    this.popupWindow = new BrowserWindow({
      width: 400,
      height: 300,
      alwaysOnTop: true,
      frame: false,
      resizable: true,
      webPreferences: { /* same as main */ },
    });

    this.popupWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '/#/popup');

    this.popupWindow.on('closed', () => {
      this.popupWindow = null;
    });
  }
}
```

**Tray Manager:**
```typescript
// src/main/tray/tray-manager.ts
import { Tray, Menu, nativeImage } from 'electron';

export class TrayManager {
  private tray: Tray | null = null;

  create(): void {
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets/tray-icon.png'));
    this.tray = new Tray(icon);

    this.updateMenu();
    this.tray.setToolTip('Grammar Copilot');
  }

  updateMenu(): void {
    const shortcuts = store.get('hotkeys');

    const menu = Menu.buildFromTemplate([
      {
        label: 'Fix Selection',
        accelerator: shortcuts.fixSelection,
        click: () => handleFixSelection(),
      },
      {
        label: 'Fix Field',
        accelerator: shortcuts.fixField,
        click: () => handleFixField(),
      },
      { type: 'separator' },
      {
        label: 'Settings...',
        click: () => windowManager.createSettingsWindow(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ]);

    this.tray?.setContextMenu(menu);
  }
}
```

---

### 6. Lifecycle & Initialization

**Startup Sequence:**
```typescript
// src/main/app.ts (MODIFIED)
export function initializeApp() {
  app.whenReady().then(async () => {
    // 1. Storage (must be first)
    // electron-store initializes automatically

    // 2. Windows (hidden main window)
    windowManager.createMainWindow();
    ipcContext.setMainWindow(windowManager.mainWindow);

    // 3. Tray (always visible)
    trayManager.create();

    // 4. IPC/oRPC
    await setupORPC();

    // 5. Global shortcuts (depends on settings)
    shortcutManager.register();

    // 6. Dev tools
    if (inDevelopment) await installExtensions();
    checkForUpdates();
  });

  app.on('window-all-closed', () => {
    // Don't quit - tray keeps app alive
  });

  app.on('before-quit', async () => {
    shortcutManager.unregisterAll();
    trayManager.destroy();
  });

  app.on('activate', () => {
    // macOS: Show main window on dock click
    windowManager.showMainWindow();
  });
}
```

---

## File Structure

### New Files to Create (35 files)

**IPC Domains (15 files):**
- `src/ipc/ai/handlers.ts` - Streaming rewrite handler
- `src/ipc/ai/router.ts` - AI domain router
- `src/ipc/ai/schemas.ts` - Zod validation for AI requests
- `src/ipc/automation/handlers.ts` - Clipboard/keyboard handlers
- `src/ipc/automation/router.ts`
- `src/ipc/automation/schemas.ts`
- `src/ipc/settings/handlers.ts` - Get/set settings, API key management
- `src/ipc/settings/router.ts`
- `src/ipc/settings/schemas.ts`
- `src/ipc/shortcuts/handlers.ts` - Register/unregister hotkeys
- `src/ipc/shortcuts/router.ts`
- `src/ipc/shortcuts/schemas.ts`
- `src/ipc/popup/handlers.ts` - Popup window control
- `src/ipc/popup/router.ts`
- `src/ipc/popup/schemas.ts`

**Main Process Modules (13 files):**
- `src/main/windows/window-manager.ts` - Centralized window lifecycle
- `src/main/windows/settings-window.ts` - Settings window creation
- `src/main/windows/popup-window.ts` - Popup window creation
- `src/main/tray/tray-manager.ts` - System tray lifecycle
- `src/main/shortcuts/manager.ts` - Global shortcut registration
- `src/main/shortcuts/handlers.ts` - Fix selection/field orchestration
- `src/main/automation/keyboard.ts` - nut-js wrapper
- `src/main/automation/clipboard.ts` - Clipboard backup/restore
- `src/main/storage/settings.ts` - electron-store instance
- `src/main/storage/api-keys.ts` - safeStorage wrapper
- `src/main/storage/context.ts` - In-memory edit context
- `src/main/ai/client.ts` - Google Gemini initialization
- `src/main/ai/prompts.ts` - Role-based prompt templates

**Renderer & Routes (7 files):**
- `src/actions/ai.ts` - Renderer AI actions
- `src/actions/automation.ts` - Renderer automation actions
- `src/actions/settings.ts` - Renderer settings actions
- `src/actions/shortcuts.ts` - Renderer shortcuts actions
- `src/routes/settings.tsx` - Settings route
- `src/routes/popup.tsx` - Popup chat route
- `src/renderer/features/settings/settings-form.tsx` - Settings UI component

**Shared Types (4 files):**
- `src/shared/types/ai.ts` - AI types (RewriteRole, etc.)
- `src/shared/types/automation.ts` - Automation types
- `src/shared/types/settings.ts` - Settings schema types
- `src/shared/types/shortcuts.ts` - Hotkey types

### Files to Modify (4 files)

- `src/ipc/router.ts` - Add new domains to root router
- `src/ipc/context.ts` - Add popup window reference
- `src/main/app.ts` - Add tray, shortcuts initialization
- `package.json` - Add dependencies

---

## Implementation Phases

### Phase 1: Foundation (Storage + Tray + Window Management)
**Goal:** App runs with tray, stores settings, manages windows

**Files:** 10 files (settings storage, tray, window manager, IPC settings domain)

**Dependencies:**
```json
{
  "electron-store": "^10.0.0"
}
```

**Verification:**
- [ ] App starts with tray icon
- [ ] Tray menu shows (Settings, Quit)
- [ ] Settings can be saved/loaded
- [ ] API key stored securely (check `safeStorage.isEncryptionAvailable()`)

**Estimated Time:** 1-2 days

---

### Phase 2: Clipboard & Automation (Capture/Replace Flow)
**Goal:** Can capture text, backup clipboard, simulate paste

**Files:** 8 files (automation domain, keyboard/clipboard modules)

**Dependencies:**
```json
{
  "@nut-tree/nut-js": "^5.1.1"
}
```

**Verification:**
- [ ] Manual test: Call `captureText()` from dev console
- [ ] Clipboard preserved before/after
- [ ] Simulated Cmd+C captures text
- [ ] Simulated Cmd+V pastes text
- [ ] Cross-platform test (macOS + Windows)

**Estimated Time:** 2-3 days

---

### Phase 3: AI Integration (Google Gemini Streaming)
**Goal:** Can send text to Gemini, receive streaming response

**Files:** 9 files (AI domain, client, prompts, actions)

**Dependencies:**
```json
{
  "ai": "^4.3.29",
  "@ai-sdk/google": "^1.2.23"
}
```

**Verification:**
- [ ] API key from settings used
- [ ] Streaming works (partial text visible)
- [ ] Role-based prompts applied (grammar vs grammar+tone)
- [ ] Error handling (network, timeout, invalid key)
- [ ] Test with `gemini-2.5-flash` model

**Estimated Time:** 2-3 days

---

### Phase 4: Hotkeys & Orchestration (End-to-End Flow)
**Goal:** Global hotkeys trigger full capture → AI → replace flow

**Files:** 8 files (shortcuts domain, manager, handlers)

**Verification:**
- [ ] Cmd+Shift+F captures selection, rewrites, replaces in-place
- [ ] Cmd+Shift+G selects all in field, rewrites, replaces
- [ ] Clipboard preserved across operations
- [ ] Edit context saved for follow-ups
- [ ] Error notifications via tray
- [ ] Test in: TextEdit, VS Code, Chrome textarea, Slack

**Estimated Time:** 3-4 days

---

### Phase 5: Settings UI & Popup Chat (User Configuration)
**Goal:** User can configure app, do follow-up corrections

**Files:** 10 files (settings window, popup window, UI components, routes)

**Verification:**
- [ ] Settings window: API key, model, role, hotkeys configurable
- [ ] Hotkey capture works (press keys, display "Cmd+Shift+F")
- [ ] Popup chat: Shows last edit, allows follow-up
- [ ] Popup always-on-top, frameless, resizable
- [ ] Settings persisted across app restarts

**Estimated Time:** 2-3 days

---

**Total Estimated Time:** 10-15 days for full implementation

---

## Critical Files Reference

### Phase 1 (Foundation)
- `src/main/storage/settings.ts`
- `src/main/storage/api-keys.ts`
- `src/main/tray/tray-manager.ts`
- `src/main/windows/window-manager.ts`
- `src/ipc/settings/handlers.ts`

### Phase 2 (Automation)
- `src/main/automation/keyboard.ts`
- `src/main/automation/clipboard.ts`
- `src/ipc/automation/handlers.ts`

### Phase 3 (AI)
- `src/main/ai/client.ts`
- `src/main/ai/prompts.ts`
- `src/ipc/ai/handlers.ts`
- `src/actions/ai.ts`

### Phase 4 (Hotkeys)
- `src/main/shortcuts/manager.ts`
- `src/main/shortcuts/handlers.ts`
- `src/main/app.ts` (modified)

### Phase 5 (UI)
- `src/renderer/features/settings/settings-form.tsx`
- `src/routes/settings.tsx`
- `src/routes/popup.tsx`

---

## Dependencies to Add

```json
{
  "dependencies": {
    "ai": "^4.3.29",
    "@ai-sdk/google": "^1.2.23",
    "@nut-tree/nut-js": "^5.1.1",
    "electron-store": "^10.0.0"
  }
}
```

**Total Bundle Size Impact:** ~5MB

---

## Security Considerations

1. **API Key Protection:**
   - Encrypted at rest with OS keychain (`safeStorage`)
   - Never exposed to renderer process
   - Injected server-side in IPC handlers

2. **Clipboard Data:**
   - Backed up before any operation
   - Restored after replacement
   - Cleared from memory after use

3. **Process Isolation:**
   - `contextIsolation: true` maintained
   - `nodeIntegration: false` maintained
   - `sandbox: true` maintained

4. **Input Validation:**
   - All IPC inputs validated with Zod schemas
   - Max text length enforced (10K chars)
   - Error responses via structured `ORPCError`

---

## Error Handling

### Capture Failures
- **Scenario:** No text selected when hotkey pressed
- **Handling:** Show tray notification ("No text selected")
- **Recovery:** No-op, wait for next trigger

### AI Timeouts
- **Scenario:** Gemini request exceeds 30s timeout
- **Handling:** Stream yields error event, renderer shows message
- **Recovery:** User can retry via popup chat

### Network Errors
- **Scenario:** No internet during rewrite
- **Handling:** Caught in subscription, yield error chunk
- **Recovery:** Original text preserved, user notified

### Clipboard Preservation Failure
- **Scenario:** Another app overwrites clipboard during operation
- **Handling:** Backup taken before any operations, restored after
- **Recovery:** User's original clipboard intact

### Keyboard Automation Failure
- **Scenario:** nut-js fails to simulate key press
- **Handling:** Try/catch around automation calls, log error
- **Recovery:** Fallback to manual copy/paste (user notification)

---

## Cross-Platform Compatibility

### macOS
- Modifier key: `Key.LeftSuper` (Cmd)
- Tray icon: 22x22 template image
- Global shortcuts: `CommandOrControl` → Cmd

### Windows
- Modifier key: `Key.LeftControl` (Ctrl)
- Tray icon: 16x16 PNG
- Global shortcuts: `CommandOrControl` → Ctrl

**Testing Strategy:**
- Primary development on macOS
- CI/CD builds on Windows (GitHub Actions)
- Manual testing on Windows VM before release

---

## Future Extensibility

### Adding xAI Grok Support
**Architecture Ready:**
- Provider abstraction: `ai.provider` setting already supports `'google' | 'xai'`
- Model selection: Settings schema supports dynamic models
- AI client: Can add xAI initialization alongside Google

**Changes Needed:**
1. Add `@ai-sdk/xai` dependency
2. Update `src/main/ai/client.ts` to support provider switching
3. Add xAI API key storage alongside Google key
4. Update settings UI with provider dropdown

**Estimated Time:** 1 day (infrastructure already in place)

---

## Testing Strategy

### Unit Tests (Vitest)
- Storage functions (settings, API keys)
- Prompt builders (role-based templates)
- IPC schema validation
- Clipboard backup/restore logic

### Integration Tests
- Full capture → rewrite → replace flow
- Hotkey triggers orchestration
- Window lifecycle (create/focus/close)
- Streaming subscription end-to-end

### E2E Tests (Playwright)
- Launch app, verify tray appears
- Open settings, save API key
- Trigger hotkey, verify rewrite
- Open popup, send follow-up

### Manual Testing Checklist
- [ ] TextEdit (macOS native)
- [ ] VS Code (Electron app)
- [ ] Chrome textarea (web)
- [ ] Slack (Electron app)
- [ ] Notion (web/desktop)
- [ ] Edge cases: empty selection, very long text (10K chars), network offline

---

## Next Steps

1. **Review this plan** - Ensure alignment with your vision
2. **Confirm AI provider** - Google Gemini only or add xAI Grok now?
3. **Start Phase 1** - Foundation (storage, tray, windows)
4. **Iterate incrementally** - Each phase builds on previous

**Ready to implement when you approve!**

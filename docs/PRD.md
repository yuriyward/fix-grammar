## PRD (general): Desktop “Rewrite/Grammar Copilot” (MVP)

### 1) Summary

A lightweight cross-platform desktop app (macOS + Windows first) that lets you press a hotkey anywhere to:

* capture either **selected text** or **all text in the active editable field**,
* send it to a **remote LLM** (via **Vercel AI SDK**),
* then **replace the selection / field content in-place**,
* and optionally open a **small chat popup** showing the last edit so you can send follow-ups.

You’ll build it on top of **electron-shadcn** (Electron Forge + Vite + React + TS + Tailwind + shadcn/ui). ([GitHub][1])

---

### 2) Goals

* **Fast “fix writing” loop** anywhere you type (email, Notion, Slack, browser, IDE comment box).
* **Two capture actions**:

  1. Fix **selection** (if any), otherwise do nothing or fallback (configurable later).
  2. Fix **entire active field** (Select All + Copy).
* **In-place replace** without breaking the user’s clipboard history (clipboard preservation).
* **Follow-up corrections** via a minimal popup “chat” tied to the last edit.
* Add **Settings early**: API key input + hotkey customization + role selector (grammar-only vs tone+grammar).

---

### 3) Non-goals (for this PRD / MVP scope)

* Local LLM support (LM Studio / bundled model) — explicitly postponed.
* Prompt gallery / advanced role editor / message schema design.
* Perfect compatibility with every app/editable surface (some apps block automation or behave differently).

---

### 4) Target users

* People who write frequently and want quick rewriting without context switching.
* Power users who prefer keyboard-first workflows and minimal UI.

---

### 5) Primary user flows

**Flow A — Fix selection (hotkey)**

1. User highlights text in any app.
2. Press hotkey “Fix selection”.
3. App copies selection (likely by simulating `Cmd/Ctrl+C`), reads captured text, restores clipboard.
4. App sends text to LLM (streaming).
5. App replaces the original selection (likely by temporarily setting clipboard to result and simulating paste), then restores clipboard again. ([Electron][2])

**Flow B — Fix all in active field (hotkey)**

1. Cursor is inside an editable field.
2. Press hotkey “Fix field”.
3. App simulates `Cmd/Ctrl+A`, then `Cmd/Ctrl+C`, captures text, restores clipboard.
4. Send to LLM, then paste back.
   (Exact OS/app edge cases handled progressively.)

**Flow C — Follow-up via popup chat**

1. After an edit completes, user presses hotkey “Open last edit”.
2. Small always-on-top popup appears near cursor/center (no taskbar, minimal chrome).
3. User types follow-up instruction (“make it more formal”, “keep meaning but shorter”).
4. App sends follow-up + last input/output context and applies replacement again.

(For the popup behavior you’ll likely rely on `BrowserWindow` options like `alwaysOnTop`, `focusable`, and `showInactive()` carefully. ([Electron][3]))

---

### 6) Functional requirements

#### 6.1 Global hotkeys (customizable)

* Register system-wide shortcuts using Electron `globalShortcut`. ([Electron][4])
* Allow per-action hotkey mapping:

  * Fix selection
  * Fix field
  * Toggle popup chat (last edit)
  * Open settings

#### 6.2 Capture & replace (clipboard-safe)

* Must preserve clipboard contents across capture and paste operations (best effort).
* Use Electron clipboard module where needed. ([Electron][2])
* Store “last edit” context in memory (and optionally persisted later).

#### 6.3 AI calls (remote only)

* Use **Vercel AI SDK Core** for generation/streaming and **AI SDK UI** patterns for chat-like interactions. ([AI SDK][5])
* MVP supports remote providers only; API key comes from Settings.

#### 6.4 Roles (selector, not prompt editor)

* Simple dropdown: “Grammar only” vs “Grammar + tone”.
* Internally map roles to prompts (details intentionally deferred).

#### 6.5 Settings (must be in early MVP)

* API key input + storage.
* Hotkey customization UI.
* Role selection default.
* Basic provider/model selection can be minimal (even a single provider first).

Implementation note: API keys should be stored encrypted using `safeStorage` (with platform caveats). ([Electron][6])

#### 6.6 UI shell

* Tray icon with menu: quick actions + Settings + Quit. ([Electron][7])
* Settings UI can be:

  * Electron menu item that opens a Settings window, **or**
  * shadcn Dialog within the main window (if you keep a “main” window around).

---

### 7) Technical approach & stack (recommended)

**Base:** electron-shadcn template (Electron Forge + Vite + React + TS + Tailwind + shadcn/ui). ([GitHub][1])

**Why this fits your MVP**

* Forge covers packaging/distribution cleanly. ([Electron Forge][8])
* Template already uses context isolation (good security default). ([GitHub][1])
* shadcn/ui gives fast, clean UI primitives; `components.json` is the standard config file if you use their CLI. ([GitHub][9])

**Process split**

* **Main process**: hotkeys, tray, capture/replace automation, secure storage, provider calls if you want to keep secrets out of renderer.
* **Preload**: expose a minimal API to renderer via `contextBridge` (don’t expose Node broadly). ([Electron][10])
* **Renderer (React)**: settings UI + popup chat UI.

**AI integration choice**

* If you adopt “chat” UX quickly, lean on the AI SDK `useChat` transport architecture (you can route calls through your own IPC-backed transport). ([AI SDK][11])
* If you keep MVP simpler, use `streamText`/`generateText` directly in main and stream partials to renderer. ([AI SDK][12])
* Chat SDK (Vercel’s template) is useful for UI patterns, but you’ll be embedding into Electron rather than deploying a web app. ([Vercel][13])

---

### 8) Security & privacy requirements

* Keep `contextIsolation` enabled and follow Electron security checklist. ([Electron][14])
* Minimize data sent: only the selected text / field text + your prompt role.
* Store API key with `safeStorage` (and document limitations). ([Electron][6])

---

### 9) Quality bar & success metrics (MVP)

* **Latency**: user perceives “instant action” (show spinner/toast/popup within ~100ms).
* **Reliability**: capture+replace works in the most common targets (Chrome textareas, Slack, Notion, native text fields) with documented exceptions.
* **Safety**: clipboard preserved; no accidental large pastes; visible confirmation of what will be replaced.


[1]: https://github.com/LuanRoger/electron-shadcn "GitHub - LuanRoger/electron-shadcn: :electron: Electron Forge with shadcn-ui (Vite + Typescript)"
[2]: https://electronjs.org/docs/latest/api/clipboard?utm_source=chatgpt.com "clipboard"
[3]: https://electronjs.org/docs/latest/api/browser-window?utm_source=chatgpt.com "BrowserWindow"
[4]: https://electronjs.org/docs/latest/api/global-shortcut?utm_source=chatgpt.com "globalShortcut"
[5]: https://ai-sdk.dev/docs/introduction?utm_source=chatgpt.com "AI SDK by Vercel"
[6]: https://electronjs.org/docs/latest/api/safe-storage?utm_source=chatgpt.com "safeStorage"
[7]: https://electronjs.org/docs/latest/tutorial/tray?utm_source=chatgpt.com "Tray Menu"
[8]: https://www.electronforge.io/?utm_source=chatgpt.com "Electron Forge: Getting Started"
[9]: https://github.com/shadcn/shadcn-electron-app?utm_source=chatgpt.com "shadcn-electron-app"
[10]: https://electronjs.org/docs/latest/tutorial/context-isolation?utm_source=chatgpt.com "Context Isolation"
[11]: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat?utm_source=chatgpt.com "AI SDK UI: useChat"
[12]: https://ai-sdk.dev/docs/ai-sdk-core/generating-text?utm_source=chatgpt.com "AI SDK Core: Generating Text"
[13]: https://vercel.com/blog/introducing-chat-sdk?utm_source=chatgpt.com "Introducing Chat SDK"
[14]: https://electronjs.org/docs/latest/tutorial/security?utm_source=chatgpt.com "Security"
[15]: https://biomejs.dev/reference/cli/?utm_source=chatgpt.com "CLI - Biome"

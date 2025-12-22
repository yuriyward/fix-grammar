---
description: Review git staged files against AI.md rules and maintainability best practices
---

You are conducting a comprehensive code review of git staged files for this Electron (Forge + Vite) + React + TypeScript project. Analyze each staged file against the project's architectural and quality standards from `AI.md`.

**Review Criteria:**

## Architecture & Boundaries
- **Main / Preload / Renderer separation**: No Node/Electron APIs in renderer; keep preload as a narrow bridge.
- **IPC discipline**: Prefer oRPC + Zod typed contracts (`src/ipc/**`, `src/actions/**`); avoid ad-hoc `ipcRenderer` usage.
- **Routing**: Changes under `src/routes/` should respect TanStack Router conventions; don’t hand-edit `src/routeTree.gen.ts`.

## AI.md Rules Compliance
- **File size & scope**: Keep files under ~300 lines; keep <=3 concerns per file; extract shared logic after 2+ uses.
- **Imports**: Prefer `@/` absolute imports; avoid barrel files/re-export `index.ts` patterns.
- **TypeScript**: Keep strict types; avoid `any` and unsafe assertions.
- **Styling**: Prefer Tailwind + existing UI components (`src/components/ui/`) over ad-hoc CSS.
- **Code quality**: Biome formatting/lint rules (2-space indent, single quotes, organized imports).

## Maintainability & Best Practices
- **Security (Electron)**:
  - Avoid enabling `nodeIntegration` in renderer; keep `contextIsolation` enabled.
  - Never load/execute remote code in the renderer.
  - Preload should expose only minimal, explicit APIs (prefer `contextBridge`).
- **Performance**: Avoid unnecessary IPC chatter; keep renderer work lightweight.
- **Error Handling**: Clear error paths and user-facing feedback where appropriate.
- **Naming**: Clear, descriptive variable and function names
- **Dependencies**: Explicit dependency management, no hidden dependencies

**Instructions:**
1. Get the list of staged files: `!git diff --staged --name-only`
2. For each staged file, read its content and analyze it thoroughly
3. Provide structured feedback with priority levels:
   - **P0 (Blockers)**: Critical issues that violate core principles and must be fixed
   - **P1 (Important)**: Significant improvements for maintainability and consistency
   - **P2 (Nits)**: Minor suggestions and optimizations

**Output Format:**
For each file, provide:
- File path and brief summary
- Priority-categorized issues with specific line references
- Concrete recommendations with code snippets when helpful
- Overall assessment of architectural compliance

Focus on actionable feedback that helps maintain the codebase's architectural integrity and future maintainability.

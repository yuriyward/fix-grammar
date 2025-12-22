---
description: Review all commits and changes in the current branch against AI.md rules and maintainability best practices
---

You are conducting a comprehensive code review of all commits in the current branch for this Electron (Forge + Vite) + React + TypeScript project. Analyze all changes introduced by this branch against the project's architectural and quality standards from `AI.md`.

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

## Commit History Analysis
- **Commit Messages**: Clear, descriptive messages following conventional commits
- **Logical Grouping**: Related changes grouped in appropriate commits
- **Incremental Progress**: Commits show logical progression of feature development

**Instructions:**
1. Get current branch name: `!git branch --show-current`
2. Get commit history for this branch (adjust base branch if needed): `!git log main..HEAD --oneline`
3. Get all changed files in this branch (adjust base branch if needed): `!git diff main...HEAD --name-only`
4. Get detailed diff for all changes (adjust base branch if needed): `!git diff main...HEAD`
5. For each changed file, read the current content to understand the final state
6. Analyze both the changes (diff) and the final file states

**Analysis Approach:**
- Review the overall branch changes as a cohesive feature/improvement
- Examine individual commits for logical organization
- Assess cumulative impact on codebase architecture
- Check for consistency across all modified files

**Output Format:**

## Branch Overview
- Branch name and commit count
- High-level summary of changes
- Overall architectural impact assessment

## Commit Analysis
For each commit:
- Commit hash and message
- Files changed and purpose
- Architectural compliance notes

## File-by-File Review
For each modified file:
- File path and change summary
- Priority-categorized issues:
  - **P0 (Blockers)**: Critical issues that violate core principles
  - **P1 (Important)**: Significant improvements needed
  - **P2 (Nits)**: Minor suggestions and optimizations
- Specific line references with recommendations
- Code snippets for complex suggestions

## Branch-Level Recommendations
- Overall architectural assessment
- Cross-file consistency issues
- Integration and testing suggestions
- Next steps for improvement

Focus on how the branch changes work together as a cohesive improvement while maintaining architectural integrity.

/**
 * In-memory edit context storage
 */
import type { AppContext } from '@/main/shortcuts/app-context';
import type { AIModel, AIProvider } from '@/shared/config/ai-models';

/**
 * Stored context for a grammar fix operation
 * Used to apply fixes later via notifications
 */
export interface EditContext {
  originalText: string;
  rewrittenText: string;
  startedAt: number;
  role: string;
  provider: AIProvider;
  model: AIModel;
  sourceApp?: AppContext;
}

const contextMap = new Map<string, EditContext>();

export function saveEditContext(id: string, context: EditContext): void {
  contextMap.set(id, context);
}

export function getEditContext(id: string): EditContext | undefined {
  return contextMap.get(id);
}

export function getLastEditContext(): EditContext | undefined {
  const entries = Array.from(contextMap.values());
  return entries[entries.length - 1];
}

export function clearEditContexts(): void {
  contextMap.clear();
}

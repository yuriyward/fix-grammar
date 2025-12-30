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

const MAX_CONTEXTS = 100;
const contextMap = new Map<string, EditContext>();

export function saveEditContext(id: string, context: EditContext): void {
  // If key exists, delete it first to update its position
  if (contextMap.has(id)) {
    contextMap.delete(id);
  }

  contextMap.set(id, context);

  // LRU eviction: remove oldest entry if exceeding limit
  if (contextMap.size > MAX_CONTEXTS) {
    const oldestKey = contextMap.keys().next().value;
    if (oldestKey !== undefined) {
      contextMap.delete(oldestKey);
    }
  }
}

export function getEditContext(id: string): EditContext | undefined {
  const context = contextMap.get(id);

  // LRU: move accessed item to end (most recently used)
  if (context !== undefined) {
    contextMap.delete(id);
    contextMap.set(id, context);
  }

  return context;
}

export function getLastEditContext(): EditContext | undefined {
  const entries = Array.from(contextMap.values());
  return entries[entries.length - 1];
}

export function clearEditContexts(): void {
  contextMap.clear();
}

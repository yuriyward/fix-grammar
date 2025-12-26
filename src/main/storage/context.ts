/**
 * In-memory edit context storage
 */
export interface EditContext {
  originalText: string;
  rewrittenText: string;
  timestamp: number;
  role: string;
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

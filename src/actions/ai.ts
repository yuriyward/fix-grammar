/**
 * AI IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { RewriteRole } from '@/shared/types/ai';

export async function rewriteText(
  text: string,
  role: RewriteRole,
): Promise<string> {
  const result = await ipc.client.ai.rewriteText({ text, role });
  return result.content;
}

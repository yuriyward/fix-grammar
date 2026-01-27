/**
 * AI IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';

export async function rewriteText(
  text: string,
  skillId: string,
): Promise<string> {
  const result = await ipc.client.ai.rewriteText({ text, skillId });
  return result.content;
}

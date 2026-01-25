/**
 * Clipboard sentinel value generation
 */
import { randomUUID } from 'node:crypto';

export function createClipboardSentinel(
  operation: 'selection' | 'copy',
): string {
  return `__grammar_copilot_${operation}_${randomUUID()}__`;
}

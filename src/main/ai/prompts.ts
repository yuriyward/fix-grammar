/**
 * Role-based prompt templates
 */
import { ROLE_PROMPTS } from '@/shared/config/prompts';
import type { RewriteRole } from '@/shared/types/ai';

export function buildPrompt(text: string, role: RewriteRole): string {
  return `${ROLE_PROMPTS[role]}\n\n${text}`;
}

/**
 * Prompt building utilities
 */

export function buildPrompt(text: string, skillPrompt: string): string {
  return `${skillPrompt}\n\n${text}`;
}

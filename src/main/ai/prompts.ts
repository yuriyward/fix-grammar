/**
 * Role-based prompt templates
 */
import type { RewriteRole } from '@/shared/types/ai';

const GRAMMAR_ONLY_PROMPT = `You are a grammar correction assistant. Your task is to fix grammatical errors, spelling mistakes, and punctuation issues in the provided text while preserving the original meaning and tone.

Rules:
- Fix ONLY grammar, spelling, and punctuation errors
- Do NOT change the tone, style, or word choice unless grammatically incorrect
- Preserve the original meaning exactly
- Return ONLY the corrected text without explanations or commentary
- If the text has no errors, return it unchanged

Text to correct:`;

const GRAMMAR_TONE_PROMPT = `You are a professional writing assistant. Your task is to improve the provided text by fixing grammar errors and enhancing clarity and tone.

Rules:
- Fix grammar, spelling, and punctuation errors
- Improve clarity and readability
- Make the tone more professional and polished
- Preserve the core meaning and intent
- Return ONLY the improved text without explanations or commentary

Text to improve:`;

export function buildPrompt(text: string, role: RewriteRole): string {
  const basePrompt =
    role === 'grammar' ? GRAMMAR_ONLY_PROMPT : GRAMMAR_TONE_PROMPT;
  return `${basePrompt}\n\n${text}`;
}

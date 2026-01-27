/**
 * Persistent skill storage using electron-store.
 * Skills are prompt templates with metadata, seeded with built-in defaults.
 */
import { randomUUID } from 'node:crypto';
import ElectronStore from 'electron-store';
import type { Skill, SkillSummary } from '@/shared/types/skill';
import { store as settingsStore } from './settings';

/** Deterministic UUIDs for built-in skills */
export const BUILTIN_GRAMMAR_ID = '00000000-0000-4000-8000-000000000001';
export const BUILTIN_GRAMMAR_TONE_ID = '00000000-0000-4000-8000-000000000002';

const BUILTIN_SKILLS: Skill[] = [
  {
    id: BUILTIN_GRAMMAR_ID,
    name: 'Grammar Fix',
    description: 'Fix grammar, spelling, and punctuation errors',
    prompt: `You are a grammar correction assistant. Your task is to fix grammatical errors, spelling mistakes, and punctuation issues in the provided text while preserving the original meaning and tone.

Rules:
- Fix ONLY grammar, spelling, and punctuation errors
- Do NOT change the tone, style, or word choice unless grammatically incorrect
- Preserve the original meaning exactly
- Return ONLY the corrected text without explanations or commentary
- If the text has no errors, return it unchanged`,
    builtIn: true,
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: BUILTIN_GRAMMAR_TONE_ID,
    name: 'Polish Writing',
    description: 'Improve clarity and readability while preserving meaning',
    prompt: `You are an expert writing assistant focused on improving clarity, grammar, and readability. Your primary goal is to take input text and make it more natural, human, clear, and direct, without altering its original meaning or underlying goal. You should adapt your tone and style to match the user's input.

<personality>
You are direct, pragmatic, and helpful. You maintain a natural, human, and conversational voice, mirroring the user's input style. You avoid AI clichés, forced tones, and overly formal language unless the input specifically requires it.
</personality>

<rules>
- **Preserve Language**: Always respond in the same language as the input. Never translate to English or any other language.
- **Preserve Meaning**: Absolutely do not change the core meaning or intent of the original text.
- **Preserve Goal**: Ensure the polished text still achieves the user's original communication objective.
- **Match Tone**: Adapt your output tone to closely match the input text's original tone (e.g., if input is casual, output is casual).
- **Clarity First**: Prioritize clarity above all else, even over strict grammatical perfection if casual grammar is present in the input and aligns with the desired tone.
- **Simplicity**: Use short, plain sentences.
- **Conciseness**: Cut filler words and unnecessary phrases.
- **No Hype or Clichés**: Avoid marketing language, corporate jargon, and overused phrases (e.g., "dive into," "unlock potential," "game-changing," "revolutionary").
- **Natural Language**: Sound conversational. It's acceptable to start sentences with "and" or "but" if it enhances natural flow.
- **No Em Dashes**: Absolutely do not use the em dash (—) character.
- **Remove Redundancy**: Eliminate unnecessary adjectives and adverbs.
- **Reduce Weasel Words**: Minimize empty qualifiers like "somewhat," "rather," "quite," "basically," "actually" that add no meaning. Keep qualifiers that contribute to tone or emphasis.
- **Directness**: Be real and honest in your improvements, avoiding fake friendliness.
- **Use & over "and"**: Prefer "&" instead of "and" when listing items or joining concepts.
- **Use Numerals**: Use numerals for counts instead of spelling them out. "8 deployments" not "eight deployments".
- Return ONLY the improved text without explanations or commentary.
</rules>

<main_objective>
To refine user-provided text to be grammatically correct, clearer, more concise, and natural-sounding, while strictly maintaining the original message, tone, and purpose. The output should read like a normal, polished version of what the user originally wrote.
</main_objective>

<examples>
<example>
<input>Let's dive into this game-changing solution that will transform your life.</input>
<output>Here's how it works.</output>
</example>

<example>
<input>This revolutionary product will unleash your potential.</input>
<output>This product can help you.</output>
</example>

<example>
<input>Hej, chciałem sie zapytać czy mógłbyś mi pomóc z tym projektem? Mam kilka pytań odnośnie implementacji.</input>
<output>Hej, chciałem się zapytać, czy mógłbyś mi pomóc z tym projektem? Mam kilka pytań dotyczących implementacji.</output>
</example>

<example>
<input>Cześć, myślę że to dobry pomysł ale musimy jeszcze przemysleć kilka rzeczy zanim zaczniemy.</input>
<output>Cześć, myślę, że to dobry pomysł, ale musimy jeszcze przemyśleć kilka rzeczy, zanim zaczniemy.</output>
</example>

<example>
<input>to jest mega ważne żebyśmy skończyli to przed deadlinem bo inaczej będziemy mieli problem</input>
<output>To jest mega ważne, żebyśmy skończyli to przed deadlinem, bo inaczej będziemy mieli problem.</output>
</example>

<example>
<input>Bonjour, je voulais savoir si tu pouvais m'aider avec ce projet? J'ai quelques questions.</input>
<output>Bonjour, je voulais savoir si tu pouvais m'aider avec ce projet. J'ai quelques questions.</output>
</example>

<example>
<input>Hallo, ich wollte fragen ob du mir mit diesem Projekt helfen könntest? Ich habe ein paar Fragen.</input>
<output>Hallo, ich wollte fragen, ob du mir mit diesem Projekt helfen könntest. Ich habe ein paar Fragen.</output>
</example>

<example>
<input>The system processed eight deployments and three builds yesterday.</input>
<output>The system processed 8 deployments & 3 builds yesterday.</output>
</example>

<example>
<input>There are approximately fifteen users and twenty-three active sessions.</input>
<output>There are approximately 15 users & 23 active sessions.</output>
</example>

<example>
<input>This is actually quite a very important feature that basically everyone really needs.</input>
<output>This is an important feature that everyone needs.</output>
</example>

<example>
<input>I just wanted to say that this is really something we should probably consider.</input>
<output>I wanted to mention that we should consider this.</output>
</example>

<example>
<input>The results were quite impressive — they exceeded our expectations — and the team was very happy.</input>
<output>The results were impressive. They exceeded our expectations, and the team was very happy.</output>
</example>

</examples>
`,
    builtIn: true,
    createdAt: 0,
    updatedAt: 0,
  },
];

interface SkillsSchema {
  skills: Record<string, Skill>;
  order: string[];
  migrated: boolean;
}

const store = new ElectronStore<SkillsSchema>({
  name: 'skills',
  defaults: {
    skills: {},
    order: [],
    migrated: false,
  },
});

/** Map old `ai.role` values to built-in skill IDs */
const LEGACY_ROLE_TO_SKILL: Record<string, string> = {
  grammar: BUILTIN_GRAMMAR_ID,
  'grammar-tone': BUILTIN_GRAMMAR_TONE_ID,
};

function seedBuiltIns(): void {
  const skills = store.get('skills');
  const order = store.get('order');

  for (const builtIn of BUILTIN_SKILLS) {
    if (!skills[builtIn.id]) {
      skills[builtIn.id] = builtIn;
      if (!order.includes(builtIn.id)) {
        order.unshift(builtIn.id);
      }
    }
  }

  store.set('skills', skills);
  store.set('order', order);
}

function migrateFromRole(): void {
  if (store.get('migrated')) return;

  // Read old role setting and map to skill ID
  const oldRole = settingsStore.get('ai.defaultSkillId') as string | undefined;

  // Check if it's still an old-style role value (not a UUID)
  if (oldRole && LEGACY_ROLE_TO_SKILL[oldRole]) {
    settingsStore.set('ai.defaultSkillId', LEGACY_ROLE_TO_SKILL[oldRole]);
  } else if (!oldRole || oldRole === 'grammar') {
    // Default: set to built-in grammar skill
    settingsStore.set('ai.defaultSkillId', BUILTIN_GRAMMAR_ID);
  }

  store.set('migrated', true);
}

/** Initialize skills store: seed built-ins and migrate settings */
export function initializeSkillsStore(): void {
  seedBuiltIns();
  migrateFromRole();
}

export function listSkills(): SkillSummary[] {
  const skills = store.get('skills');
  const order = store.get('order');

  return order
    .map((id) => {
      const skill = skills[id];
      if (!skill) return null;
      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        builtIn: skill.builtIn,
      };
    })
    .filter((s): s is SkillSummary => s !== null);
}

export function getSkill(id: string): Skill | null {
  const skills = store.get('skills');
  return skills[id] ?? null;
}

export function createSkill(
  name: string,
  description: string,
  prompt: string,
): Skill {
  const now = Date.now();
  const skill: Skill = {
    id: randomUUID(),
    name,
    description,
    prompt,
    builtIn: false,
    createdAt: now,
    updatedAt: now,
  };

  const skills = store.get('skills');
  const order = store.get('order');

  skills[skill.id] = skill;
  order.push(skill.id);

  store.set('skills', skills);
  store.set('order', order);

  return skill;
}

export function updateSkill(
  id: string,
  updates: { name?: string; description?: string; prompt?: string },
): Skill | null {
  const skills = store.get('skills');
  const skill = skills[id];
  if (!skill) return null;

  if (updates.name !== undefined) skill.name = updates.name;
  if (updates.description !== undefined)
    skill.description = updates.description;
  if (updates.prompt !== undefined) skill.prompt = updates.prompt;
  skill.updatedAt = Date.now();

  store.set('skills', skills);
  return skill;
}

export function deleteSkill(id: string): boolean {
  const skills = store.get('skills');
  const skill = skills[id];

  if (!skill) return false;
  if (skill.builtIn) return false;

  const order = store.get('order');
  delete skills[id];
  const newOrder = order.filter((oid) => oid !== id);

  store.set('skills', skills);
  store.set('order', newOrder);

  return true;
}

/** Reset built-in skills to their default definitions */
export function resetBuiltInSkills(): void {
  const skills = store.get('skills');
  const order = store.get('order');

  for (const builtIn of BUILTIN_SKILLS) {
    skills[builtIn.id] = builtIn;
    if (!order.includes(builtIn.id)) {
      order.unshift(builtIn.id);
    }
  }

  store.set('skills', skills);
  store.set('order', order);
}

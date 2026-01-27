/**
 * Persistent skill storage using electron-store.
 * Skills are prompt templates with metadata, seeded with built-in defaults.
 */
import { randomUUID } from 'node:crypto';
import ElectronStore from 'electron-store';
import type { Skill, SkillSummary } from '@/shared/types/skill';
import {
  BUILTIN_GRAMMAR_ID,
  BUILTIN_GRAMMAR_TONE_ID,
  BUILTIN_SKILLS,
} from './builtin-skills';
import { store as settingsStore } from './settings';

export { BUILTIN_GRAMMAR_ID, BUILTIN_GRAMMAR_TONE_ID };

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

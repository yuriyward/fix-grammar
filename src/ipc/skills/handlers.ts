/**
 * Skills IPC handlers
 */
import { os } from '@orpc/server';
import {
  createSkill,
  deleteSkill,
  getSkill,
  listSkills,
  resetBuiltInSkills,
  updateSkill,
} from '@/main/storage/skills';
import {
  parseSkillMarkdown,
  serializeSkillMarkdown,
} from '@/shared/utils/skill-markdown';
import {
  createSkillInputSchema,
  deleteSkillInputSchema,
  exportSkillInputSchema,
  getSkillInputSchema,
  importSkillInputSchema,
  updateSkillInputSchema,
} from './schemas';

export const listSkillsHandler = os.handler(() => {
  return listSkills();
});

export const getSkillHandler = os
  .input(getSkillInputSchema)
  .handler(({ input }) => {
    return getSkill(input.id);
  });

export const createSkillHandler = os
  .input(createSkillInputSchema)
  .handler(({ input }) => {
    return createSkill(input.name, input.description, input.prompt);
  });

export const updateSkillHandler = os
  .input(updateSkillInputSchema)
  .handler(({ input }) => {
    const { id, name, description, prompt } = input;
    const updates: { name?: string; description?: string; prompt?: string } =
      {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (prompt !== undefined) updates.prompt = prompt;

    const skill = updateSkill(id, updates);
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    return skill;
  });

export const deleteSkillHandler = os
  .input(deleteSkillInputSchema)
  .handler(({ input }) => {
    const success = deleteSkill(input.id);
    return { success };
  });

export const importSkillHandler = os
  .input(importSkillInputSchema)
  .handler(({ input }) => {
    const parsed = parseSkillMarkdown(input.markdown);
    return createSkill(parsed.name, parsed.description, parsed.prompt);
  });

export const exportSkillHandler = os
  .input(exportSkillInputSchema)
  .handler(({ input }) => {
    const skill = getSkill(input.id);
    if (!skill) {
      throw new Error(`Skill not found: ${input.id}`);
    }
    return {
      markdown: serializeSkillMarkdown(
        skill.name,
        skill.description,
        skill.prompt,
      ),
    };
  });

export const resetBuiltInSkillsHandler = os.handler(() => {
  resetBuiltInSkills();
  return { success: true };
});

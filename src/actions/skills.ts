/**
 * Skills IPC wrappers for renderer
 */
import { ipc } from '@/renderer/lib/ipc-manager';
import type { Skill, SkillSummary } from '@/shared/types/skill';

export async function listSkills(): Promise<SkillSummary[]> {
  return ipc.client.skills.list();
}

export async function getSkill(id: string): Promise<Skill | null> {
  return ipc.client.skills.get({ id });
}

export async function createSkill(
  name: string,
  description: string,
  prompt: string,
): Promise<Skill> {
  return ipc.client.skills.create({ name, description, prompt });
}

export async function updateSkill(
  id: string,
  updates: { name?: string; description?: string; prompt?: string },
): Promise<Skill> {
  return ipc.client.skills.update({ id, ...updates });
}

export async function deleteSkill(id: string): Promise<{ success: boolean }> {
  return ipc.client.skills.delete({ id });
}

export async function importSkill(markdown: string): Promise<Skill> {
  return ipc.client.skills.import({ markdown });
}

export async function exportSkill(id: string): Promise<{ markdown: string }> {
  return ipc.client.skills.export({ id });
}

export async function resetBuiltInSkills(): Promise<{ success: boolean }> {
  return ipc.client.skills.resetBuiltIn();
}

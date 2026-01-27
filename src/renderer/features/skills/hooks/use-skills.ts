/**
 * Skills CRUD state hook
 */
import { useCallback, useEffect, useState } from 'react';
import {
  createSkill as createSkillAction,
  deleteSkill as deleteSkillAction,
  exportSkill as exportSkillAction,
  getSkill as getSkillAction,
  importSkill as importSkillAction,
  listSkills as listSkillsAction,
  updateSkill as updateSkillAction,
} from '@/actions/skills';
import type { Skill, SkillSummary } from '@/shared/types/skill';

export function useSkills() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listSkillsAction();
    setSkills(list);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectSkill = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const skill = await getSkillAction(id);
      setSelectedSkill(skill);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSkill(null);
  }, []);

  const createSkill = useCallback(
    async (name: string, description: string, prompt: string) => {
      const skill = await createSkillAction(name, description, prompt);
      await refresh();
      setSelectedSkill(skill);
      return skill;
    },
    [refresh],
  );

  const updateSkill = useCallback(
    async (
      id: string,
      updates: { name?: string; description?: string; prompt?: string },
    ) => {
      const skill = await updateSkillAction(id, updates);
      await refresh();
      setSelectedSkill(skill);
      return skill;
    },
    [refresh],
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      await deleteSkillAction(id);
      if (selectedSkill?.id === id) {
        setSelectedSkill(null);
      }
      await refresh();
    },
    [refresh, selectedSkill],
  );

  const importSkill = useCallback(
    async (markdown: string) => {
      const skill = await importSkillAction(markdown);
      await refresh();
      setSelectedSkill(skill);
      return skill;
    },
    [refresh],
  );

  const exportSkill = useCallback(async (id: string) => {
    const result = await exportSkillAction(id);
    return result.markdown;
  }, []);

  return {
    skills,
    selectedSkill,
    isLoading,
    refresh,
    selectSkill,
    clearSelection,
    createSkill,
    updateSkill,
    deleteSkill,
    importSkill,
    exportSkill,
  };
}

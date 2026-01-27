/**
 * Skills management page route component
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { toastManager } from '@/renderer/components/ui/toast';
import { SkillEditor } from '@/renderer/features/skills/components/skill-editor';
import { SkillsList } from '@/renderer/features/skills/components/skills-list';
import { useSkills } from '@/renderer/features/skills/hooks/use-skills';

function SkillsPage() {
  const navigate = useNavigate();
  const {
    skills,
    selectedSkill,
    selectSkill,
    clearSelection,
    createSkill,
    updateSkill,
    deleteSkill,
    importSkill,
    exportSkill,
  } = useSkills();
  const [isNew, setIsNew] = useState(false);

  const handleNew = useCallback(() => {
    clearSelection();
    setIsNew(true);
  }, [clearSelection]);

  const handleSelect = useCallback(
    (id: string) => {
      setIsNew(false);
      void selectSkill(id);
    },
    [selectSkill],
  );

  const handleSave = useCallback(
    async (data: { name: string; description: string; prompt: string }) => {
      try {
        if (isNew) {
          await createSkill(data.name, data.description, data.prompt);
          setIsNew(false);
          toastManager.add({ type: 'success', title: 'Skill created' });
        } else if (selectedSkill) {
          await updateSkill(selectedSkill.id, data);
          toastManager.add({ type: 'success', title: 'Skill updated' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastManager.add({
          type: 'error',
          title: 'Failed to save skill',
          description: message,
        });
      }
    },
    [isNew, selectedSkill, createSkill, updateSkill],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteSkill(id);
        setIsNew(false);
        toastManager.add({ type: 'success', title: 'Skill deleted' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastManager.add({
          type: 'error',
          title: 'Failed to delete skill',
          description: message,
        });
      }
    },
    [deleteSkill],
  );

  const handleImport = useCallback(
    async (markdown: string) => {
      try {
        await importSkill(markdown);
        setIsNew(false);
        toastManager.add({ type: 'success', title: 'Skill imported' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toastManager.add({
          type: 'error',
          title: 'Failed to import skill',
          description: message,
        });
      }
    },
    [importSkill],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => navigate({ to: '/settings' })}>
            ← Back to Settings
          </Button>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Skills</h1>
        <p className="text-sm text-muted-foreground">
          Manage prompt templates for text rewriting
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72">
          <SkillsList
            skills={skills}
            selectedId={selectedSkill?.id}
            onSelect={handleSelect}
            onNew={handleNew}
            onDelete={handleDelete}
            onImport={handleImport}
          />
        </div>
        <SkillEditor
          skill={selectedSkill}
          isNew={isNew}
          onSave={handleSave}
          onExport={exportSkill}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/skills')({
  component: SkillsPage,
});

/**
 * Skill create/edit form with export
 */
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/renderer/components/ui/field';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import type { Skill } from '@/shared/types/skill';

interface SkillEditorProps {
  skill: Skill | null;
  onSave: (data: {
    name: string;
    description: string;
    prompt: string;
  }) => Promise<void>;
  onExport?: (id: string) => Promise<string>;
  isNew?: boolean;
}

export function SkillEditor({
  skill,
  onSave,
  onExport,
  isNew,
}: SkillEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setPrompt(skill.prompt);
    } else {
      setName('');
      setDescription('');
      setPrompt('');
    }
  }, [skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        prompt: prompt.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!skill?.id || !onExport) return;
    const markdown = await onExport(skill.id);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!skill && !isNew) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a skill to edit or create a new one
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          {isNew ? 'New Skill' : 'Edit Skill'}
        </h2>
        <div className="flex gap-2">
          {skill && onExport && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Upload className="mr-1.5 size-3.5" />
              Export
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !name.trim() || !prompt.trim()}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field name="skill.name">
          <FieldLabel>Name</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grammar Fix"
            disabled={isSaving}
            maxLength={100}
          />
        </Field>

        <Field name="skill.description">
          <FieldLabel>Description</FieldLabel>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of what this skill does"
            disabled={isSaving}
            maxLength={500}
          />
          <FieldDescription>Optional short description</FieldDescription>
        </Field>

        <Field name="skill.prompt">
          <FieldLabel>Prompt Template</FieldLabel>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="You are a grammar correction assistant..."
            disabled={isSaving}
            rows={12}
            className="min-h-48 font-mono text-sm"
          />
          <FieldDescription>
            The system prompt template. The selected text will be appended after
            this prompt.
          </FieldDescription>
        </Field>
      </div>
    </form>
  );
}

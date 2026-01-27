/**
 * Skills list with create/delete/import actions
 */
import { Download, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { cn } from '@/renderer/lib/tailwind';
import type { SkillSummary } from '@/shared/types/skill';

interface SkillsListProps {
  skills: SkillSummary[];
  selectedId?: string | undefined;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onImport: (markdown: string) => void;
}

export function SkillsList({
  skills,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onImport,
}: SkillsListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onImport(text);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center gap-2 border-b p-3">
        <Button size="sm" onClick={onNew} className="flex-1">
          <Plus className="mr-1.5 size-4" />
          New Skill
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          title="Import from .md file"
        >
          <Download className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt"
          className="hidden"
          onChange={handleFileImport}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {skills.map((skill) => (
          <button
            key={skill.id}
            type="button"
            className={cn(
              'group flex w-full cursor-pointer items-center justify-between border-b px-3 py-2.5 text-left transition-colors hover:bg-accent',
              selectedId === skill.id && 'bg-accent',
            )}
            onClick={() => onSelect(skill.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {skill.name}
                </span>
                {skill.builtIn && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    Built-in
                  </span>
                )}
              </div>
              {skill.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {skill.description}
                </p>
              )}
            </div>
            {!skill.builtIn && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 hidden shrink-0 size-7 p-0 text-destructive hover:text-destructive group-hover:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(skill.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </button>
        ))}
        {skills.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No skills yet
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable skill selector dropdown
 */
import { useEffect, useState } from 'react';
import { listSkills } from '@/actions/skills';
import type { SkillSummary } from '@/shared/types/skill';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface SkillSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  size?: 'sm' | 'default';
}

export function SkillSelector({
  value,
  onValueChange,
  disabled,
  name,
  size,
}: SkillSelectorProps) {
  const [skills, setSkills] = useState<SkillSummary[]>([]);

  useEffect(() => {
    listSkills().then(setSkills).catch(console.error);
  }, []);

  const items = skills.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <Select
      {...(name && { name })}
      value={value}
      items={items}
      {...(disabled && { disabled })}
      onValueChange={(v) => v && onValueChange(v)}
    >
      <SelectTrigger {...(size && { size })}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {skills.map((skill) => (
          <SelectItem key={skill.id} value={skill.id}>
            {skill.name}
            {skill.description && (
              <span className="ml-2 text-muted-foreground">
                — {skill.description}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

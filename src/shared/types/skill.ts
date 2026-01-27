/**
 * Skill types for the user-manageable prompt template system
 */

export interface Skill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  builtIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
}

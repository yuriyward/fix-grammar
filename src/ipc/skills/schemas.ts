/**
 * Zod schemas for skills IPC
 */
import { z } from 'zod';

export const listSkillsInputSchema = z.object({}).optional();

export const getSkillInputSchema = z.object({
  id: z.string().min(1),
});

export const createSkillInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  prompt: z.string().min(1).max(10_000),
});

export const updateSkillInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10_000).optional(),
});

export const deleteSkillInputSchema = z.object({
  id: z.string().min(1),
});

export const importSkillInputSchema = z.object({
  markdown: z.string().min(1),
});

export const exportSkillInputSchema = z.object({
  id: z.string().min(1),
});

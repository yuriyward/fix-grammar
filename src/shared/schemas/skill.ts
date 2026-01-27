/**
 * Zod schemas for skill CRUD and import/export
 */
import { z } from 'zod';

export const skillSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  prompt: z.string().min(1).max(10_000),
  builtIn: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createSkillInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  prompt: z.string().min(1).max(10_000),
});

export const updateSkillInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10_000).optional(),
});

export const deleteSkillInputSchema = z.object({
  id: z.string().uuid(),
});

export const getSkillInputSchema = z.object({
  id: z.string().uuid(),
});

export const importSkillInputSchema = z.object({
  markdown: z.string().min(1),
});

export const exportSkillInputSchema = z.object({
  id: z.string().uuid(),
});

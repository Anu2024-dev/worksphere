import { z } from 'zod';
import { RequestPriority } from '@prisma/client';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required').max(100),
  description: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name is required').max(100),
  departmentId: z.string().uuid('Invalid department ID'),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  departmentId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  description: z.string().optional(),
  defaultDepartmentId: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  defaultDepartmentId: z.string().uuid().optional().nullable(),
});

export const updateSLAPolicySchema = z.object({
  responseTimeHours: z.number().int().min(1, 'Response time must be at least 1 hour'),
  resolutionTimeHours: z.number().int().min(1, 'Resolution time must be at least 1 hour'),
  isBusinessHours: z.boolean().default(false),
  description: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

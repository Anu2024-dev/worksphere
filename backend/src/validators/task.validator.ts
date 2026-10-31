import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(200),
  description: z.string().optional(),
  taskType: z.string().default('GENERAL'),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  departmentId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  labels: z.array(z.string()).default([]),
  serviceRequestId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional().nullable(),
  taskType: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  labels: z.array(z.string()).optional(),
  serviceRequestId: z.string().uuid().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  note: z.string().optional(),
});

export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
  reason: z.string().optional(),
});

export const addTaskCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

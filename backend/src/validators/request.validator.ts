import { z } from 'zod';
import { RequestPriority, RequestStatus } from '@prisma/client';

export const createRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
  description: z.string().min(15, 'Please provide a detailed description (at least 15 characters)'),
  categoryId: z.string().uuid('Invalid category ID'),
  subcategory: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.nativeEnum(RequestPriority).default(RequestPriority.MEDIUM),
  contactInfo: z.string().optional(),
});

export const updateRequestSchema = z.object({
  title: z.string().min(5).max(150).optional(),
  description: z.string().min(15).optional(),
  categoryId: z.string().uuid().optional(),
  subcategory: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  contactInfo: z.string().optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  note: z.string().optional(),
});

export const assignRequestSchema = z.object({
  assigneeId: z.string().uuid('Invalid assignee user ID'),
  reason: z.string().optional(),
});

export const addRequestCommentSchema = z.object({
  content: z.string().min(2, 'Comment must be at least 2 characters'),
  isInternal: z.boolean().default(false),
});

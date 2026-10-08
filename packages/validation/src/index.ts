/**
 * @pms/validation
 * Zod validation schemas for client and server input validation
 */

import { z } from 'zod';
import { AUTH_CONFIG } from '@pms/config';

// ==========================================
// Auth Schemas
// ==========================================
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(
      AUTH_CONFIG.PASSWORD_MIN_LENGTH,
      `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`,
    )
    .max(
      AUTH_CONFIG.PASSWORD_MAX_LENGTH,
      `Password must not exceed ${AUTH_CONFIG.PASSWORD_MAX_LENGTH} characters`,
    ),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// ==========================================
// Project Schemas
// ==========================================
export const projectStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

const isValidDateString = (val: string): boolean => {
  return !isNaN(Date.parse(val));
};

export const dateStringSchema = z
  .string()
  .refine(isValidDateString, { message: 'Must be a valid date or ISO 8601 string' });

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(120, 'Project name cannot exceed 120 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    status: projectStatusSchema.default('NOT_STARTED'),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    },
  );

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name cannot be empty').max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    status: projectStatusSchema.optional(),
    startDate: dateStringSchema.optional().nullable(),
    endDate: dateStringSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be greater than or equal to start date',
      path: ['endDate'],
    },
  );

export const projectSortBySchema = z.enum(['createdAt', 'name', 'startDate', 'endDate', 'status']);
export const sortOrderSchema = z.enum(['asc', 'desc']);

export const projectFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: projectStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: projectSortBySchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type ProjectFilterInput = z.infer<typeof projectFilterSchema>;

// ==========================================
// Task Schemas
// ==========================================
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

export const createTaskSchema = z.object({
  name: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, 'Task name cannot be empty')
    .max(150, 'Task name cannot exceed 150 characters'),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional(),
  priority: taskPrioritySchema.default('MEDIUM'),
  status: taskStatusSchema.default('PENDING'),
  dueDate: dateStringSchema.optional(),
  projectId: z.string().uuid({ message: 'A valid project ID is required' }).optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name cannot be empty').max(150).optional(),
  description: z.string().trim().max(2000).optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  dueDate: dateStringSchema.optional().nullable(),
});

export const taskSortBySchema = z.enum(['createdAt', 'name', 'dueDate', 'priority', 'status']);

export const taskFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: taskSortBySchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});

export type TaskFilterInput = z.infer<typeof taskFilterSchema>;

// ==========================================
// Query Schemas
// ==========================================
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const projectFilterQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
});

export const taskFilterQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().uuid().optional(),
});

// Inferred Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type ProjectFilterQueryInput = z.infer<typeof projectFilterQuerySchema>;
export type TaskFilterQueryInput = z.infer<typeof taskFilterQuerySchema>;

/**
 * @pms/shared-types
 * Strongly typed domain models, DTOs, and API contracts shared across API, Web, and Mobile.
 */

import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS } from '@pms/config';

// ==========================================
// Enum Types
// ==========================================
export type ProjectStatus = keyof typeof PROJECT_STATUS;
export type TaskPriority = keyof typeof TASK_PRIORITY;
export type TaskStatus = keyof typeof TASK_STATUS;

// ==========================================
// User & Auth Types
// ==========================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken?: string;
}

// ==========================================
// Project Types
// ==========================================
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export type ProjectSortBy = 'createdAt' | 'name' | 'startDate' | 'endDate' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface ProjectFilterQuery {
  search?: string;
  status?: ProjectStatus;
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: ProjectSortBy;
  sortOrder?: SortOrder;
}

// ==========================================
// Task Types
// ==========================================
export interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  name: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  projectId: string;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}

export interface TaskFilterQuery {
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  page?: number;
  limit?: number;
}

// ==========================================
// Dashboard Metrics
// ==========================================
export interface DashboardMetrics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressProjects: number;
}

// ==========================================
// Standard API Envelope Formats
// ==========================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

import { apiClient } from '../lib/api-client';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterQuery,
  PaginatedResponse,
} from '@pms/shared-types';

export const tasksService = {
  async listByProject(
    projectId: string,
    query?: TaskFilterQuery,
  ): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.priority) params.append('priority', query.priority);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    const endpoint = `/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`;
    return apiClient.get<PaginatedResponse<Task>>(endpoint);
  },

  async get(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(projectId: string, dto: CreateTaskDto): Promise<Task> {
    return apiClient.post<Task>(`/projects/${projectId}/tasks`, dto);
  },

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return apiClient.put<Task>(`/tasks/${id}`, dto);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/tasks/${id}`);
  },
};

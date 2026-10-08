import { apiClient } from '../lib/api-client';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilterQuery,
  PaginatedResponse,
} from '@pms/shared-types';

export const projectsService = {
  async list(query?: ProjectFilterQuery): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.status) params.append('status', query.status);
    if (query?.page) params.append('page', String(query.page));
    if (query?.pageSize) params.append('pageSize', String(query.pageSize));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

    const qs = params.toString();
    const endpoint = `/projects${qs ? `?${qs}` : ''}`;
    return apiClient.get<PaginatedResponse<Project>>(endpoint);
  },

  async get(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  async create(dto: CreateProjectDto): Promise<Project> {
    return apiClient.post<Project>('/projects', dto);
  },

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    return apiClient.put<Project>(`/projects/${id}`, dto);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(`/projects/${id}`);
  },
};

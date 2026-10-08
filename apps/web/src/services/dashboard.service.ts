import { apiClient } from '../lib/api-client';
import { DashboardMetrics } from '@pms/shared-types';

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/dashboard');
  },
};

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DashboardMetrics } from '@pms/shared-types';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute aggregated workspace metrics strictly scoped to the authenticated user
   */
  async getMetrics(userId: string): Promise<DashboardMetrics> {
    const [totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress] =
      await Promise.all([
        this.prisma.project.count({
          where: { userId },
        }),
        this.prisma.task.count({
          where: { userId },
        }),
        this.prisma.task.count({
          where: {
            userId,
            status: 'COMPLETED',
          },
        }),
        this.prisma.task.count({
          where: {
            userId,
            status: 'PENDING',
          },
        }),
        this.prisma.project.count({
          where: {
            userId,
            status: 'IN_PROGRESS',
          },
        }),
      ]);

    this.logger.log(
      `[DASHBOARD] METRICS_CALCULATED userId=${userId} projects=${totalProjects} tasks=${totalTasks}`,
    );

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      projectsInProgress,
    };
  }
}

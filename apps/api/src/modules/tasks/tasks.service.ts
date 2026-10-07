import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import {
  Task,
  PaginatedResponse,
  TaskSortBy,
  PaginationMeta,
  TaskPriority,
  TaskStatus,
} from '@pms/shared-types';
import { ResourceNotFoundException } from '../../common/exceptions';

const ALLOWED_SORT_FIELDS: readonly TaskSortBy[] = [
  'createdAt',
  'name',
  'dueDate',
  'priority',
  'status',
];

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new task under a specific project with strict ownership verification
   */
  async create(userId: string, projectId: string, dto: CreateTaskDto): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      this.logger.warn(
        `[TASK] CREATE_REJECTED_PROJECT_NOT_FOUND projectId=${projectId} userId=${userId}`,
      );
      throw new ResourceNotFoundException('Project', projectId);
    }

    const dueDate = dto.dueDate ? this.parseDate(dto.dueDate) : null;

    const task = await this.prisma.task.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        priority: dto.priority ?? 'MEDIUM',
        status: dto.status ?? 'PENDING',
        dueDate,
        projectId,
        userId,
      },
    });

    this.logger.log(`[TASK] CREATED taskId=${task.id} projectId=${projectId} userId=${userId}`);

    return this.formatTask(task);
  }

  /**
   * List tasks for a specific project with pagination, search, status, priority, and sorting
   */
  async findAllForProject(
    userId: string,
    projectId: string,
    query: QueryTasksDto,
  ): Promise<PaginatedResponse<Task>> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      this.logger.warn(`[TASK] LIST_PROJECT_NOT_FOUND projectId=${projectId} userId=${userId}`);
      throw new ResourceNotFoundException('Project', projectId);
    }

    return this.executePaginatedQuery(query, userId, projectId);
  }

  /**
   * List tasks across user projects with optional project filtering, search, status, priority, and sorting
   */
  async findAll(userId: string, query: QueryTasksDto): Promise<PaginatedResponse<Task>> {
    if (query.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: query.projectId },
      });

      if (!project || project.userId !== userId) {
        this.logger.warn(
          `[TASK] LIST_PROJECT_NOT_FOUND projectId=${query.projectId} userId=${userId}`,
        );
        throw new ResourceNotFoundException('Project', query.projectId);
      }

      return this.executePaginatedQuery(query, userId, query.projectId);
    }

    return this.executePaginatedQuery(query, userId);
  }

  /**
   * Get a single task by ID with strict user and project ownership verification
   */
  async findOne(userId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task || task.userId !== userId) {
      this.logger.warn(`[TASK] NOT_FOUND_OR_FORBIDDEN taskId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Task', id);
    }

    return this.formatTask(task);
  }

  /**
   * Update an existing task with strict ownership verification
   */
  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      this.logger.warn(`[TASK] UPDATE_REJECTED taskId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Task', id);
    }

    const data: Prisma.TaskUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate === null ? null : this.parseDate(dto.dueDate);
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });

    this.logger.log(`[TASK] UPDATED taskId=${id} userId=${userId}`);

    return this.formatTask(updated);
  }

  /**
   * Delete an existing task with strict ownership verification
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      this.logger.warn(`[TASK] DELETE_REJECTED taskId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Task', id);
    }

    await this.prisma.task.delete({
      where: { id },
    });

    this.logger.log(`[TASK] DELETED taskId=${id} userId=${userId}`);

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  /**
   * Shared helper for paginated and filtered task queries
   */
  private async executePaginatedQuery(
    query: QueryTasksDto,
    userId: string,
    projectId?: string,
  ): Promise<PaginatedResponse<Task>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const rawPageSize = query.pageSize ?? query.limit ?? 20;
    const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.TaskWhereInput = {
      userId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.search && query.search.trim().length > 0) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortBy: TaskSortBy =
      query.sortBy && ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    const meta: PaginationMeta = {
      total,
      page,
      pageSize,
      limit: pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return {
      items: items.map((t) => this.formatTask(t)),
      meta,
    };
  }

  /**
   * Helper to parse date strings (ISO 8601 or YYYY-MM-DD)
   */
  private parseDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date format: '${dateStr}'`);
    }
    return date;
  }

  /**
   * Format Prisma task to strongly typed domain model
   */
  private formatTask(task: {
    id: string;
    name: string;
    description: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: Date | null;
    projectId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      projectId: task.projectId,
      userId: task.userId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}

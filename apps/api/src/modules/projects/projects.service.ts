import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { Project, PaginatedResponse, ProjectSortBy, PaginationMeta } from '@pms/shared-types';
import { ResourceNotFoundException } from '../../common/exceptions';

const ALLOWED_SORT_FIELDS: readonly ProjectSortBy[] = [
  'createdAt',
  'name',
  'startDate',
  'endDate',
  'status',
];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new project belonging to the authenticated user
   */
  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const startDate = dto.startDate ? this.parseDate(dto.startDate) : null;
    const endDate = dto.endDate ? this.parseDate(dto.endDate) : null;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? 'NOT_STARTED',
        startDate,
        endDate,
        userId,
      },
    });

    this.logger.log(`[PROJECT] CREATED projectId=${project.id} userId=${userId}`);

    return this.formatProject(project);
  }

  /**
   * List projects belonging to the authenticated user with search, filter, sorting, and pagination
   */
  async findAll(userId: string, query: QueryProjectsDto): Promise<PaginatedResponse<Project>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const rawPageSize = query.pageSize ?? query.limit ?? 20;
    const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.ProjectWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      where.name = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    const sortBy: ProjectSortBy =
      query.sortBy && ALLOWED_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, items] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
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
      items: items.map((p) => this.formatProject(p)),
      meta,
    };
  }

  /**
   * Get a single project with strict ownership verification
   */
  async findOne(userId: string, id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.userId !== userId) {
      this.logger.warn(`[PROJECT] NOT_FOUND_OR_FORBIDDEN projectId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Project', id);
    }

    return this.formatProject(project);
  }

  /**
   * Update a project with ownership verification and date validation
   */
  async update(userId: string, id: string, dto: UpdateProjectDto): Promise<Project> {
    const existing = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      this.logger.warn(`[PROJECT] UPDATE_REJECTED projectId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Project', id);
    }

    const newStartDate =
      dto.startDate !== undefined
        ? dto.startDate === null
          ? null
          : this.parseDate(dto.startDate)
        : existing.startDate;

    const newEndDate =
      dto.endDate !== undefined
        ? dto.endDate === null
          ? null
          : this.parseDate(dto.endDate)
        : existing.endDate;

    if (newStartDate && newEndDate && newStartDate > newEndDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const data: Prisma.ProjectUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.startDate !== undefined) {
      data.startDate = newStartDate;
    }
    if (dto.endDate !== undefined) {
      data.endDate = newEndDate;
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data,
    });

    this.logger.log(`[PROJECT] UPDATED projectId=${id} userId=${userId}`);

    return this.formatProject(updated);
  }

  /**
   * Delete a project with ownership verification
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      this.logger.warn(`[PROJECT] DELETE_REJECTED projectId=${id} userId=${userId}`);
      throw new ResourceNotFoundException('Project', id);
    }

    await this.prisma.project.delete({
      where: { id },
    });

    this.logger.log(`[PROJECT] DELETED projectId=${id} userId=${userId}`);

    return {
      success: true,
      message: 'Project deleted successfully',
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
   * Format Prisma project to strongly typed domain model
   */
  private formatProject(project: {
    id: string;
    name: string;
    description: string | null;
    status: Project['status'];
    startDate: Date | null;
    endDate: Date | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      userId: project.userId,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}

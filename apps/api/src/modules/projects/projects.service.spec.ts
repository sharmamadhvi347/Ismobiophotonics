import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../database/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions';
import { ProjectSortBy } from '@pms/shared-types';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const userA = 'user-uuid-aaa';
  const userB = 'user-uuid-bbb';

  const mockDate = new Date('2026-10-01T00:00:00.000Z');
  const mockEndDate = new Date('2026-10-31T00:00:00.000Z');

  const mockProjectA = {
    id: 'project-uuid-1',
    name: 'Project Alpha',
    description: 'Alpha description',
    status: 'IN_PROGRESS' as const,
    startDate: mockDate,
    endDate: mockEndDate,
    userId: userA,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project for authenticated user', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue(mockProjectA);

      const dto = {
        name: 'Project Alpha',
        description: 'Alpha description',
        status: 'IN_PROGRESS' as const,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      };

      const result = await service.create(userA, dto);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Project Alpha',
          description: 'Alpha description',
          status: 'IN_PROGRESS',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          userId: userA,
        },
      });
      expect(result.id).toBe(mockProjectA.id);
      expect(result.userId).toBe(userA);
      expect(result.startDate).toBe('2026-10-01T00:00:00.000Z');
    });

    it('should reject invalid date range where startDate is after endDate', async () => {
      const dto = {
        name: 'Invalid Dates Project',
        startDate: '2026-12-01',
        endDate: '2026-10-01',
      };

      await expect(service.create(userA, dto)).rejects.toThrow(BadRequestException);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('should reject invalid date string format', async () => {
      const dto = {
        name: 'Malformed Date Project',
        startDate: 'not-a-valid-date',
      };

      await expect(service.create(userA, dto)).rejects.toThrow(BadRequestException);
      expect(prisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated projects scoped exclusively to authenticated user', async () => {
      (prisma.project.count as jest.Mock).mockResolvedValue(1);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([mockProjectA]);

      const result = await service.findAll(userA, {
        page: 1,
        pageSize: 10,
      });

      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: userA },
      });
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: userA },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 10,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });

    it('should filter by status and search by name case-insensitively', async () => {
      (prisma.project.count as jest.Mock).mockResolvedValue(1);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([mockProjectA]);

      await service.findAll(userA, {
        search: 'alpha',
        status: 'IN_PROGRESS',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: {
          userId: userA,
          status: 'IN_PROGRESS',
          name: {
            contains: 'alpha',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 20,
        orderBy: { name: 'asc' },
      });
    });

    it('should fallback to createdAt desc if unknown sortBy provided', async () => {
      (prisma.project.count as jest.Mock).mockResolvedValue(0);
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(userA, {
        sortBy: 'maliciousField' as unknown as ProjectSortBy,
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne (Authorization & IDOR protection)', () => {
    it('should return project if owned by requesting user', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      const result = await service.findOne(userA, mockProjectA.id);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
      });
      expect(result.id).toBe(mockProjectA.id);
    });

    it('should throw ResourceNotFoundException if project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userA, 'non-existent-id')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('should throw ResourceNotFoundException when user B accesses user A project (IDOR)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      await expect(service.findOne(userB, mockProjectA.id)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update project if owned by requesting user', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProjectA,
        name: 'Project Alpha Updated',
        status: 'COMPLETED' as const,
      });

      const result = await service.update(userA, mockProjectA.id, {
        name: 'Project Alpha Updated',
        status: 'COMPLETED',
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
        data: {
          name: 'Project Alpha Updated',
          status: 'COMPLETED',
        },
      });
      expect(result.name).toBe('Project Alpha Updated');
      expect(result.status).toBe('COMPLETED');
    });

    it('should block user B from updating user A project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      await expect(service.update(userB, mockProjectA.id, { name: 'Hacked' })).rejects.toThrow(
        ResourceNotFoundException,
      );

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should reject invalid date range update where new startDate > existing endDate', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA); // endDate is 2026-10-31

      await expect(
        service.update(userA, mockProjectA.id, {
          startDate: '2026-11-15', // after existing endDate
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should reject invalid date range update where existing startDate > new endDate', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA); // startDate is 2026-10-01

      await expect(
        service.update(userA, mockProjectA.id, {
          endDate: '2026-09-15', // before existing startDate
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete project if owned by requesting user', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.project.delete as jest.Mock).mockResolvedValue(mockProjectA);

      const result = await service.remove(userA, mockProjectA.id);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
      });
      expect(result).toEqual({
        success: true,
        message: 'Project deleted successfully',
      });
    });

    it('should block user B from deleting user A project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      await expect(service.remove(userB, mockProjectA.id)).rejects.toThrow(
        ResourceNotFoundException,
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });

    it('should throw ResourceNotFoundException if deleting non-existent project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(userA, 'non-existent-id')).rejects.toThrow(
        ResourceNotFoundException,
      );

      expect(prisma.project.delete).not.toHaveBeenCalled();
    });
  });
});

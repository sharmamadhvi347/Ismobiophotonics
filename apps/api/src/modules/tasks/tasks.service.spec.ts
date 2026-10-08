import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../database/prisma.service';
import { ResourceNotFoundException } from '../../common/exceptions';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const userA = 'user-uuid-aaa';
  const userB = 'user-uuid-bbb';

  const mockDate = new Date('2026-10-10T00:00:00.000Z');
  const mockDueDate = new Date('2026-10-25T00:00:00.000Z');

  const mockProjectA = {
    id: 'project-uuid-1',
    name: 'Project Alpha',
    description: 'Alpha description',
    status: 'IN_PROGRESS' as const,
    startDate: mockDate,
    endDate: null,
    userId: userA,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockTaskA = {
    id: 'task-uuid-1',
    name: 'Task 1',
    description: 'Task 1 description',
    priority: 'HIGH' as const,
    status: 'PENDING' as const,
    dueDate: mockDueDate,
    projectId: mockProjectA.id,
    userId: userA,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    task: {
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
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task under an authorized project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.task.create as jest.Mock).mockResolvedValue(mockTaskA);

      const dto = {
        name: 'Task 1',
        description: 'Task 1 description',
        priority: 'HIGH' as const,
        status: 'PENDING' as const,
        dueDate: '2026-10-25',
      };

      const result = await service.create(userA, mockProjectA.id, dto);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
      });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          name: 'Task 1',
          description: 'Task 1 description',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: expect.any(Date),
          projectId: mockProjectA.id,
          userId: userA,
        },
      });
      expect(result.id).toBe(mockTaskA.id);
      expect(result.userId).toBe(userA);
      expect(result.projectId).toBe(mockProjectA.id);
    });

    it('should reject task creation if parent project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      const dto = { name: 'Orphan Task' };

      await expect(service.create(userA, 'non-existent-project', dto)).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should reject task creation if project is owned by another user (IDOR protection)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA); // owned by userA

      const dto = { name: 'Attacker Task' };

      // userB tries to create task under userA project
      await expect(service.create(userB, mockProjectA.id, dto)).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should reject task creation if dueDate is invalid', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      const dto = {
        name: 'Invalid Date Task',
        dueDate: 'invalid-date-string',
      };

      await expect(service.create(userA, mockProjectA.id, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllForProject', () => {
    it('should list tasks for an authorized project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.task.count as jest.Mock).mockResolvedValue(1);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTaskA]);

      const result = await service.findAllForProject(userA, mockProjectA.id, {
        page: 1,
        pageSize: 10,
      });

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
      });
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: userA,
          projectId: mockProjectA.id,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should reject listing if project belongs to another user (IDOR protection)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      await expect(service.findAllForProject(userB, mockProjectA.id, {})).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(prisma.task.findMany).not.toHaveBeenCalled();
    });

    it('should filter by status, priority, and search term', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.task.count as jest.Mock).mockResolvedValue(1);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTaskA]);

      await service.findAllForProject(userA, mockProjectA.id, {
        search: 'Task 1',
        status: 'PENDING',
        priority: 'HIGH',
        sortBy: 'dueDate',
        sortOrder: 'asc',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: userA,
          projectId: mockProjectA.id,
          status: 'PENDING',
          priority: 'HIGH',
          OR: [
            { name: { contains: 'Task 1', mode: 'insensitive' } },
            { description: { contains: 'Task 1', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { dueDate: 'asc' },
      });
    });
  });

  describe('findAll', () => {
    it('should list all tasks owned by user across projects', async () => {
      (prisma.task.count as jest.Mock).mockResolvedValue(1);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTaskA]);

      const result = await service.findAll(userA, { page: 1, pageSize: 20 });

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: userA },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.items).toHaveLength(1);
    });

    it('should verify project ownership when filtering by projectId', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);
      (prisma.task.count as jest.Mock).mockResolvedValue(1);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTaskA]);

      await service.findAll(userA, { projectId: mockProjectA.id });

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProjectA.id },
      });
    });

    it('should reject query with projectId belonging to another user', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProjectA);

      await expect(service.findAll(userB, { projectId: mockProjectA.id })).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a task if owned by user', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);

      const result = await service.findOne(userA, mockTaskA.id);

      expect(result.id).toBe(mockTaskA.id);
      expect(result.name).toBe(mockTaskA.name);
    });

    it('should throw ResourceNotFoundException if task does not exist', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userA, 'non-existent')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('should throw ResourceNotFoundException if task belongs to another user (IDOR protection)', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA); // owned by userA

      await expect(service.findOne(userB, mockTaskA.id)).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('update', () => {
    it('should update task attributes for owner', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);
      const updatedMock = { ...mockTaskA, status: 'COMPLETED' as const };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedMock);

      const result = await service.update(userA, mockTaskA.id, {
        status: 'COMPLETED',
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskA.id },
        data: { status: 'COMPLETED' },
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should allow clearing dueDate with null', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);
      const updatedMock = { ...mockTaskA, dueDate: null };
      (prisma.task.update as jest.Mock).mockResolvedValue(updatedMock);

      const result = await service.update(userA, mockTaskA.id, {
        dueDate: null,
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskA.id },
        data: { dueDate: null },
      });
      expect(result.dueDate).toBeNull();
    });

    it('should reject update if task belongs to another user (IDOR protection)', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);

      await expect(service.update(userB, mockTaskA.id, { name: 'Hacked Name' })).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('should reject update if dueDate format is invalid', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);

      await expect(
        service.update(userA, mockTaskA.id, { dueDate: 'invalid-date' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete task for owner', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);
      (prisma.task.delete as jest.Mock).mockResolvedValue(mockTaskA);

      const result = await service.remove(userA, mockTaskA.id);

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskA.id },
      });
      expect(result).toEqual({
        success: true,
        message: 'Task deleted successfully',
      });
    });

    it('should reject deletion if task belongs to another user (IDOR protection)', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTaskA);

      await expect(service.remove(userB, mockTaskA.id)).rejects.toThrow(ResourceNotFoundException);
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('should throw ResourceNotFoundException if task does not exist', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(userA, 'non-existent')).rejects.toThrow(
        ResourceNotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });
});

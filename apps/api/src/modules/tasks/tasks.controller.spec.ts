import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Task, PaginatedResponse } from '@pms/shared-types';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'engineer@example.com',
  };

  const mockTask: Task = {
    id: 'task-uuid-1',
    name: 'Task Alpha',
    description: 'Alpha task description',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-10-31T00:00:00.000Z',
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    userId: mockUser.id,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Task> = {
    items: [mockTask],
    meta: {
      total: 1,
      page: 1,
      pageSize: 20,
      limit: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  const mockTasksService = {
    create: jest.fn().mockResolvedValue(mockTask),
    findAllForProject: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockTask),
    update: jest.fn().mockResolvedValue(mockTask),
    remove: jest.fn().mockResolvedValue({ success: true, message: 'Task deleted successfully' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createForProject', () => {
    it('should delegate to tasksService.create with projectId from params', async () => {
      const params = { projectId: mockTask.projectId };
      const dto = {
        name: 'Task Alpha',
        priority: 'HIGH' as const,
        status: 'IN_PROGRESS' as const,
      };

      const result = await controller.createForProject(mockUser, params, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, params.projectId, dto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('findAllForProject', () => {
    it('should delegate to tasksService.findAllForProject with projectId and query', async () => {
      const params = { projectId: mockTask.projectId };
      const query = { page: 1, pageSize: 20, search: 'Alpha' };

      const result = await controller.findAllForProject(mockUser, params, query);

      expect(service.findAllForProject).toHaveBeenCalledWith(mockUser.id, params.projectId, query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findAll', () => {
    it('should delegate to tasksService.findAll with query', async () => {
      const query = { page: 1, pageSize: 20 };

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('create', () => {
    it('should delegate to tasksService.create with projectId from body', async () => {
      const dto = {
        name: 'Task Alpha',
        projectId: mockTask.projectId,
      };

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, mockTask.projectId, dto);
      expect(result).toEqual(mockTask);
    });

    it('should throw BadRequestException if projectId is omitted from body in flat create', async () => {
      const dto = {
        name: 'Task Alpha',
      };

      await expect(controller.create(mockUser, dto)).rejects.toThrow(BadRequestException);
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should delegate to tasksService.findOne with ID param', async () => {
      const params = { id: mockTask.id };

      const result = await controller.findOne(mockUser, params);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, mockTask.id);
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should delegate to tasksService.update with ID param and body', async () => {
      const params = { id: mockTask.id };
      const dto = { name: 'Updated Task Name' };

      const result = await controller.update(mockUser, params, dto);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, mockTask.id, dto);
      expect(result).toEqual(mockTask);
    });
  });

  describe('remove', () => {
    it('should delegate to tasksService.remove with ID param', async () => {
      const params = { id: mockTask.id };

      const result = await controller.remove(mockUser, params);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id, mockTask.id);
      expect(result).toEqual({
        success: true,
        message: 'Task deleted successfully',
      });
    });
  });
});

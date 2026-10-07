import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Project, PaginatedResponse } from '@pms/shared-types';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'engineer@example.com',
  };

  const mockProject: Project = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Project Alpha',
    description: 'Alpha description',
    status: 'IN_PROGRESS',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-31T00:00:00.000Z',
    userId: mockUser.id,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Project> = {
    items: [mockProject],
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

  const mockProjectsService = {
    create: jest.fn().mockResolvedValue(mockProject),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockProject),
    update: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue({ success: true, message: 'Project deleted successfully' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to projectsService.create with current user ID', async () => {
      const dto = {
        name: 'Project Alpha',
        description: 'Alpha description',
        status: 'IN_PROGRESS' as const,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      };

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('should delegate to projectsService.findAll with query parameters', async () => {
      const query = {
        page: 1,
        pageSize: 20,
        search: 'alpha',
        status: 'IN_PROGRESS' as const,
      };

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should delegate to projectsService.findOne with ID param', async () => {
      const params = { id: mockProject.id };

      const result = await controller.findOne(mockUser, params);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, mockProject.id);
      expect(result).toEqual(mockProject);
    });
  });

  describe('update', () => {
    it('should delegate to projectsService.update with ID param and body', async () => {
      const params = { id: mockProject.id };
      const dto = { name: 'Project Alpha Updated' };

      const result = await controller.update(mockUser, params, dto);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, mockProject.id, dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('remove', () => {
    it('should delegate to projectsService.remove with ID param', async () => {
      const params = { id: mockProject.id };

      const result = await controller.remove(mockUser, params);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id, mockProject.id);
      expect(result).toEqual({
        success: true,
        message: 'Project deleted successfully',
      });
    });
  });
});

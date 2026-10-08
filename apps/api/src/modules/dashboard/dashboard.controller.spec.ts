import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardMetrics } from '@pms/shared-types';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'engineer@example.com',
  };

  const mockMetrics: DashboardMetrics = {
    totalProjects: 3,
    totalTasks: 8,
    completedTasks: 4,
    pendingTasks: 2,
    projectsInProgress: 1,
  };

  const mockDashboardService = {
    getMetrics: jest.fn().mockResolvedValue(mockMetrics),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should delegate to dashboardService.getMetrics with authenticated user ID', async () => {
      const result = await controller.getMetrics(mockUser);

      expect(service.getMetrics).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockMetrics);
    });

    it('should have JwtAuthGuard applied at controller class level', () => {
      const guards = Reflect.getMetadata('__guards__', DashboardController);
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });
});

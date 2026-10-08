import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../database/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const userA = 'user-uuid-aaa';
  const userB = 'user-uuid-bbb';

  const mockPrismaService = {
    project: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return correct aggregated dashboard counts for authenticated user', async () => {
      // Mock counts:
      // totalProjects: 5
      // totalTasks: 12
      // completedTasks: 7
      // pendingTasks: 3
      // projectsInProgress: 2
      (prisma.project.count as jest.Mock).mockImplementation(({ where }) => {
        if (where.status === 'IN_PROGRESS') {
          return Promise.resolve(2);
        }
        return Promise.resolve(5);
      });

      (prisma.task.count as jest.Mock).mockImplementation(({ where }) => {
        if (where.status === 'COMPLETED') {
          return Promise.resolve(7);
        }
        if (where.status === 'PENDING') {
          return Promise.resolve(3);
        }
        return Promise.resolve(12);
      });

      const metrics = await service.getMetrics(userA);

      expect(metrics).toEqual({
        totalProjects: 5,
        totalTasks: 12,
        completedTasks: 7,
        pendingTasks: 3,
        projectsInProgress: 2,
      });

      // Verify total projects query was scoped to userA
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: userA },
      });

      // Verify total tasks query was scoped to userA
      expect(prisma.task.count).toHaveBeenCalledWith({
        where: { userId: userA },
      });

      // Verify completed tasks query was scoped to userA
      expect(prisma.task.count).toHaveBeenCalledWith({
        where: { userId: userA, status: 'COMPLETED' },
      });

      // Verify pending tasks query was scoped to userA
      expect(prisma.task.count).toHaveBeenCalledWith({
        where: { userId: userA, status: 'PENDING' },
      });

      // Verify in-progress projects query was scoped to userA
      expect(prisma.project.count).toHaveBeenCalledWith({
        where: { userId: userA, status: 'IN_PROGRESS' },
      });
    });

    it('should enforce strict user isolation between User A and User B', async () => {
      (prisma.project.count as jest.Mock).mockResolvedValue(0);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      await service.getMetrics(userB);

      // Verify that every count query specifically uses userB
      const projectCountCalls = (prisma.project.count as jest.Mock).mock.calls;
      for (const call of projectCountCalls) {
        expect(call[0].where.userId).toBe(userB);
        expect(call[0].where.userId).not.toBe(userA);
      }

      const taskCountCalls = (prisma.task.count as jest.Mock).mock.calls;
      for (const call of taskCountCalls) {
        expect(call[0].where.userId).toBe(userB);
        expect(call[0].where.userId).not.toBe(userA);
      }
    });

    it('should return zeros for empty workspace', async () => {
      (prisma.project.count as jest.Mock).mockResolvedValue(0);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);

      const metrics = await service.getMetrics(userA);

      expect(metrics).toEqual({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        projectsInProgress: 0,
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', async () => {
    const result = await controller.check();
    expect(result).toHaveProperty('status', 'ok');
    expect(result).toHaveProperty('database', 'connected');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('uptime');
  });

  it('should handle degraded database status gracefully', async () => {
    jest.spyOn(service, 'check').mockResolvedValueOnce({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      uptime: 5,
      environment: 'test',
      database: 'disconnected',
    });

    const result = await controller.check();
    expect(result.status).toBe('degraded');
    expect(result.database).toBe('disconnected');
  });
});

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'API & Database Health Readiness Check' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      example: {
        success: true,
        data: {
          status: 'ok',
          timestamp: '2026-10-06T18:00:00.000Z',
          uptime: 120,
          environment: 'development',
          database: 'connected',
        },
        timestamp: '2026-10-06T18:00:00.000Z',
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}

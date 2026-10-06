import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  database: 'connected' | 'disconnected';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    };
  }
}

import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/guards';
import { DashboardMetrics } from '@pms/shared-types';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get aggregated dashboard metrics',
    description:
      'Retrieves high-level workspace metrics (total projects, total tasks, completed tasks, pending tasks, in-progress projects) strictly scoped to the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard metrics calculated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async getMetrics(@CurrentUser() user: AuthenticatedUser): Promise<DashboardMetrics> {
    return this.dashboardService.getMetrics(user.id);
  }
}

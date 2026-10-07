import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { ProjectIdParamDto } from './dto/project-id-param.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/guards';
import { Project, PaginatedResponse } from '@pms/shared-types';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project owned exclusively by the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Project successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g., missing name or invalid date range)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List user projects with filtering, search, and pagination',
    description:
      'Retrieves a paginated list of projects owned by the authenticated user, with optional search and status filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of projects returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryProjectsDto,
  ): Promise<PaginatedResponse<Project>> {
    return this.projectsService.findAll(user.id, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a project by ID',
    description:
      'Retrieves full details of a specific project. Accessing non-existent or other users’ projects safely returns 404.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the project',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project details returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ProjectIdParamDto,
  ): Promise<Project> {
    return this.projectsService.findOne(user.id, params.id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing project',
    description:
      'Updates attributes of a project owned by the authenticated user. Ownership transfer is strictly prohibited.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the project',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g., invalid status or invalid date range)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ProjectIdParamDto,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(user.id, params.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a project',
    description:
      'Deletes a project owned by the authenticated user and cascades deletion to nested tasks.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the project',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Project successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ProjectIdParamDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.projectsService.remove(user.id, params.id);
  }
}

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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskIdParamDto } from './dto/task-id-param.dto';
import { ProjectTasksParamDto } from './dto/project-tasks-param.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { AuthenticatedUser } from '../../common/guards';
import { Task, PaginatedResponse } from '@pms/shared-types';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new task in a project',
    description:
      'Creates a new task associated with an authorized project owned exclusively by the user.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID v4 of the parent project',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (e.g., empty name or invalid due date)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async createForProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ProjectTasksParamDto,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(user.id, params.projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List tasks belonging to a specific project',
    description:
      'Retrieves a paginated list of tasks in the given project with search, status, and priority filters.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'UUID v4 of the parent project',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of tasks returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Parent project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async findAllForProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: ProjectTasksParamDto,
    @Query() query: QueryTasksDto,
  ): Promise<PaginatedResponse<Task>> {
    return this.tasksService.findAllForProject(user.id, params.projectId, query);
  }

  @Get('tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List tasks across projects with search, filter, and pagination',
    description:
      'Retrieves tasks owned by the authenticated user with optional project, status, and priority filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of tasks returned',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTasksDto,
  ): Promise<PaginatedResponse<Task>> {
    return this.tasksService.findAll(user.id, query);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new task with project ID in payload',
    description: 'Creates a new task specifying the target project ID in the body payload.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or missing projectId',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Target project not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto): Promise<Task> {
    if (!dto.projectId) {
      throw new BadRequestException('Project ID is required in request body');
    }
    return this.tasksService.create(user.id, dto.projectId, dto);
  }

  @Get('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a task by ID',
    description:
      'Retrieves details of a specific task. Accessing other users’ tasks safely returns 404.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the task',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task details returned',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: TaskIdParamDto,
  ): Promise<Task> {
    return this.tasksService.findOne(user.id, params.id);
  }

  @Put('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing task',
    description:
      'Updates attributes of a task owned by the authenticated user. Project and user reassignment is prohibited.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the task',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: TaskIdParamDto,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(user.id, params.id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a task',
    description: 'Deletes a task owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 of the task',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found or not owned by user',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid authentication token',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: TaskIdParamDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.tasksService.remove(user.id, params.id);
  }
}

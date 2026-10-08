import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TaskPriority, TaskSortBy, TaskStatus, SortOrder } from '@pms/shared-types';

export class QueryTasksDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Page number (1-indexed)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Number of items per page (maximum 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size cannot exceed 100' })
  pageSize?: number = 20;

  @ApiPropertyOptional({
    example: 20,
    description: 'Alias for pageSize (backward-compatible)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number;

  @ApiPropertyOptional({
    example: 'auth',
    description: 'Case-insensitive search string matching task name or description',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search term cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    description: 'Filter tasks by execution status',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    description: 'Filter tasks by priority level',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Optional filter by parent project ID',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'dueDate', 'priority', 'status'],
    default: 'createdAt',
    description: 'Field to sort tasks by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'dueDate', 'priority', 'status'], {
    message: 'sortBy must be one of: createdAt, name, dueDate, priority, status',
  })
  sortBy?: TaskSortBy = 'createdAt';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'desc',
    description: 'Sort ordering direction',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'sortOrder must be either asc or desc',
  })
  sortOrder?: SortOrder = 'desc';
}

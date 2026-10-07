import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskStatus } from '@pms/shared-types';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Implement JWT refresh rotation',
    description: 'Name of the task',
    minLength: 1,
    maxLength: 150,
  })
  @IsString({ message: 'Task name must be a string' })
  @IsNotEmpty({ message: 'Task name is required' })
  @MinLength(1, { message: 'Task name cannot be empty' })
  @MaxLength(150, { message: 'Task name cannot exceed 150 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    example: 'Add sliding window and family revocation to refresh tokens.',
    description: 'Detailed description of the task',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
    description: 'Priority level of the task',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority = 'MEDIUM';

  @ApiPropertyOptional({
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'PENDING',
    description: 'Execution status of the task',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus = 'PENDING';

  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'Target due date (ISO 8601 or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'Due date must be a valid date string' })
  dueDate?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Project ID (optional if supplied via route path)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority, TaskStatus } from '@pms/shared-types';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    example: 'Implement JWT refresh rotation and blacklisting',
    description: 'Updated name of the task',
    minLength: 1,
    maxLength: 150,
  })
  @IsOptional()
  @IsString({ message: 'Task name must be a string' })
  @MinLength(1, { message: 'Task name cannot be empty' })
  @MaxLength(150, { message: 'Task name cannot exceed 150 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description of requirements',
    description: 'Updated description of the task',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(2000, { message: 'Description cannot exceed 2000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    description: 'Updated priority level of the task',
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    description: 'Updated execution status of the task',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    example: '2026-10-20',
    description: 'Updated due date (ISO 8601 or YYYY-MM-DD, or null to clear)',
  })
  @IsOptional()
  @IsString({ message: 'Due date must be a valid date string' })
  dueDate?: string | null;
}

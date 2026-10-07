import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectStatus } from '@pms/shared-types';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Project Alpha',
    description: 'Name of the project',
    minLength: 1,
    maxLength: 120,
  })
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(120, { message: 'Project name cannot exceed 120 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    example: 'A critical initiative to rebuild the core infrastructure.',
    description: 'Optional description of the project',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'NOT_STARTED',
    description: 'Current execution status of the project',
  })
  @IsOptional()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Estimated or actual start date (ISO 8601 or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'Start date must be a valid date string' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Estimated or target end date (ISO 8601 or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'End date must be a valid date string' })
  endDate?: string;
}

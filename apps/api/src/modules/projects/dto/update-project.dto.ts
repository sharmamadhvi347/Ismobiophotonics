import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectStatus } from '@pms/shared-types';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Project Alpha Revised',
    description: 'Updated name of the project',
    minLength: 1,
    maxLength: 120,
  })
  @IsOptional()
  @IsString({ message: 'Project name must be a string' })
  @MinLength(1, { message: 'Project name cannot be empty' })
  @MaxLength(120, { message: 'Project name cannot exceed 120 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated project description.',
    description: 'Updated description of the project',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    description: 'Updated execution status',
  })
  @IsOptional()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Updated start date (ISO 8601 or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'Start date must be a valid date string' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Updated end date (ISO 8601 or YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString({ message: 'End date must be a valid date string' })
  endDate?: string;
}

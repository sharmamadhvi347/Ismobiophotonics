import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ProjectSortBy, ProjectStatus, SortOrder } from '@pms/shared-types';

export class QueryProjectsDto {
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
    example: 'alpha',
    description: 'Case-insensitive search string matching project name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search term cannot exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
    description: 'Filter projects by execution status',
  })
  @IsOptional()
  @IsEnum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  })
  status?: ProjectStatus;

  @ApiPropertyOptional({
    enum: ['createdAt', 'name', 'startDate', 'endDate', 'status'],
    default: 'createdAt',
    description: 'Field to sort projects by',
  })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'startDate', 'endDate', 'status'], {
    message: 'sortBy must be one of: createdAt, name, startDate, endDate, status',
  })
  sortBy?: ProjectSortBy = 'createdAt';

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

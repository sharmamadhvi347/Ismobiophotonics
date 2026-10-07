import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProjectIdParamDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique UUID v4 identifier of the project',
  })
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  id: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class TaskIdParamDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique UUID v4 identifier of the task',
  })
  @IsUUID('4', { message: 'Task ID must be a valid UUID' })
  id: string;
}

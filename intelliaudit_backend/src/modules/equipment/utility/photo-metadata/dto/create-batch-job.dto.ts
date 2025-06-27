import { IsString, IsInt, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBatchJobDto {
  @ApiProperty({
    description: 'Project ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  projectId: string;

  @ApiProperty({
    description: 'Total number of photos to process in this batch',
    example: 10,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  totalPhotos: number;

  @ApiProperty({
    description: 'Type of equipment to focus on for extraction (optional)',
    example: 'HVAC',
    required: false,
  })
  @IsString()
  @IsOptional()
  equipmentType?: string;

  @ApiProperty({
    description: 'Processing priority of the batch',
    enum: ['high', 'normal', 'low'],
    default: 'normal',
    required: false,
  })
  @IsEnum(['high', 'normal', 'low'])
  @IsOptional()
  priority?: 'high' | 'normal' | 'low' = 'normal';
} 
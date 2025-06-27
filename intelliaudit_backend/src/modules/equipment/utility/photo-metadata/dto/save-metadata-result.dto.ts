import { IsString, IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveMetadataResultDto {
  @ApiProperty({
    description: 'Batch job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  batchId: string;

  @ApiProperty({
    description: 'Photo ID in the system (if available)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  photoId?: string;

  @ApiProperty({
    description: 'URL of the photo being processed',
    example: 'https://storage.example.com/photos/hvac-unit-1.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({
    description: 'Type of equipment identified',
    example: 'HVAC',
    required: false,
  })
  @IsString()
  @IsOptional()
  equipmentType?: string;

  @ApiProperty({
    description: 'Manufacturer name extracted from the photo',
    example: 'Carrier',
    required: false,
  })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({
    description: 'Model number extracted from the photo',
    example: 'XR13',
    required: false,
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({
    description: 'Serial number extracted from the photo',
    example: 'S012345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({
    description: 'Capacity of the equipment',
    example: '5 tons',
    required: false,
  })
  @IsString()
  @IsOptional()
  capacity?: string;

  @ApiProperty({
    description: 'Efficiency rating of the equipment',
    example: '14',
    required: false,
  })
  @IsString()
  @IsOptional()
  efficiency?: string;

  @ApiProperty({
    description: 'Unit of efficiency measurement',
    example: 'SEER',
    required: false,
  })
  @IsString()
  @IsOptional()
  efficiencyUnit?: string;

  @ApiProperty({
    description: 'Manufacturing year',
    example: '2018',
    required: false,
  })
  @IsString()
  @IsOptional()
  year?: string;

  @ApiProperty({
    description: 'Condition of the equipment',
    example: 'good',
    required: false,
  })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({
    description: 'Confidence score of the extraction (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence?: number;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 1200,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  processingTime?: number;
} 
import { IsString, IsUUID, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PhotoDto {
  @ApiProperty({
    description: 'URL of the photo',
    example: 'https://storage.example.com/photos/hvac-unit-1.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'ID of the photo (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Original filename of the photo',
    example: 'hvac-unit-1.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class ProcessPhotosDto {
  @ApiProperty({
    description: 'Batch job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  batchId: string;

  @ApiProperty({
    description: 'Array of photos to process',
    type: [PhotoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos: PhotoDto[];
} 
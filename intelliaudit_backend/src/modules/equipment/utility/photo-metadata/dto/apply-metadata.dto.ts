import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyMetadataDto {
  @ApiProperty({
    description: 'Metadata result ID to apply',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  metadataResultId: string;

  @ApiProperty({
    description: 'Equipment ID to apply the metadata to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  equipmentId: string;
} 
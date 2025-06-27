import { IsNotEmpty, IsString, IsUUID, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFieldNotesDto {
  @ApiProperty({
    description: 'Raw field notes text to process',
    example: 'Observed three Carrier rooftop HVAC units. Model XYZ-123, 10-ton capacity each...'
  })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiProperty({
    description: 'Project ID to associate field notes with',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    description: 'OpenAI model to use for processing',
    example: 'o1',
    default: 'o1'
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Type of equipment to extract (lighting, hvac, etc.)',
    example: 'lighting',
    default: 'lighting',
    enum: ['lighting', 'hvac']
  })
  @IsString()
  @IsOptional()
  @IsIn(['lighting', 'hvac'])
  equipmentType?: string;

  @IsOptional()
  formPayload?: unknown;
}
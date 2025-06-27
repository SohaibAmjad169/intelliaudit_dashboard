import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsObject, IsArray, IsUUID, ValidateNested } from 'class-validator';

/**
 * DTO for equipment specifications in photo analysis
 */
export class SpecificationsDto {
  @ApiProperty({ required: false, example: '1.5 tons' })
  @IsString()
  @IsOptional()
  capacity?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  efficiency?: {
    cooling?: string;
    heating?: string;
  };

  @ApiProperty({ required: false, example: 'R-410A' })
  @IsString()
  @IsOptional()
  refrigerantType?: string;

  @ApiProperty({ required: false, example: '208-230V' })
  @IsString()
  @IsOptional()
  voltage?: string;

  @ApiProperty({ required: false, example: 'Single' })
  @IsString()
  @IsOptional()
  phase?: string;

  @ApiProperty({ required: false, example: 1500 })
  @IsNumber()
  @IsOptional()
  wattage?: number;

  @ApiProperty({ required: false, example: 'Electric' })
  @IsString()
  @IsOptional()
  fuelType?: string;
}

/**
 * DTO for equipment condition in photo analysis
 */
export class ConditionDto {
  @ApiProperty({ required: true, enum: ['Good', 'Fair', 'Poor'] })
  @IsString()
  overall: 'Good' | 'Fair' | 'Poor';

  @ApiProperty({ required: true, type: [String] })
  @IsArray()
  visibleIssues: string[];

  @ApiProperty({ required: false, example: '5-7 years' })
  @IsString()
  @IsOptional()
  estimatedAge?: string;

  @ApiProperty({ required: false, example: '3-5 years' })
  @IsString()
  @IsOptional()
  remainingLife?: string;
}

/**
 * DTO for location information in photo analysis
 */
export class LocationDto {
  @ApiProperty({ required: false, example: 'Roof' })
  @IsString()
  @IsOptional()
  room?: string;

  @ApiProperty({ required: false, example: '2' })
  @IsString()
  @IsOptional()
  floor?: string;
}

/**
 * DTO for photo analysis results
 */
export class PhotoAnalysisDto {
  @ApiProperty({ required: false, example: 'Carrier' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ required: false, example: '38MAQB12-3' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiProperty({ required: false, example: 'DX Split System Heat Pump' })
  @IsString()
  @IsOptional()
  equipment_type?: string;

  @ApiProperty({ required: false, example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, type: SpecificationsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SpecificationsDto)
  @IsOptional()
  specifications?: SpecificationsDto;

  @ApiProperty({ required: true, type: ConditionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ConditionDto)
  condition: ConditionDto;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto | string;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false, example: '0.8' })
  @IsString()
  @IsOptional()
  loadFactor?: string;

  @ApiProperty({ required: false, example: 'Thermostat controlled' })
  @IsString()
  @IsOptional()
  controlStrategy?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsNumber()
  @IsOptional()
  operating_hours?: number;

  @ApiProperty({ required: false, example: 5475 })
  @IsNumber()
  @IsOptional()
  annual_kwh?: number;

  @ApiProperty({ required: true, example: 0.85 })
  @IsNumber()
  confidence: number;

  @ApiProperty({ required: true })
  @IsString()
  notes: string;
}

/**
 * DTO for creating photo analysis records
 */
export class CreatePhotoAnalysisDto {
  @ApiProperty({ required: true })
  @IsUUID()
  project_id: string;

  @ApiProperty({ required: true })
  @IsString()
  photo_filename: string;

  @ApiProperty({ required: true })
  @IsString()
  photo_url: string;

  @ApiProperty({ required: true })
  @IsString()
  thumbnail_url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  equipment_type?: string;

  @ApiProperty({ required: false, example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  condition?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  location?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  load_factor?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  control_strategy?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  operating_hours?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  annual_kwh?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ai_model?: string;
}

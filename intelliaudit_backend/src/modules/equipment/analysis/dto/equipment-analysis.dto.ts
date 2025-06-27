import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsObject, 
  IsArray, 
  IsUUID, 
  ValidateNested,
  IsBoolean,
  IsDate
} from 'class-validator';

/**
 * DTO for equipment specifications in equipment analysis
 */
export class EquipmentSpecificationsDto {
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
  
  @ApiProperty({ required: false, example: '1200' })
  @IsNumber()
  @IsOptional()
  airflow_rate?: number;
  
  @ApiProperty({ required: false, example: 800 })
  @IsNumber()
  @IsOptional()
  lumens?: number;
  
  @ApiProperty({ required: false, example: 4000 })
  @IsNumber()
  @IsOptional()
  color_temperature?: number;
}

/**
 * DTO for equipment condition in equipment analysis
 */
export class EquipmentConditionDto {
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
 * DTO for location information in equipment analysis
 */
export class EquipmentLocationDto {
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
 * DTO for equipment analysis results
 */
export class EquipmentAnalysisDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id?: string;
  
  @ApiProperty({ required: true })
  @IsUUID()
  project_id: string;
  
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

  @ApiProperty({ required: false, type: EquipmentSpecificationsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EquipmentSpecificationsDto)
  @IsOptional()
  specifications?: EquipmentSpecificationsDto;

  @ApiProperty({ required: false, type: EquipmentConditionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => EquipmentConditionDto)
  @IsOptional()
  condition?: EquipmentConditionDto;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => EquipmentLocationDto)
  location?: EquipmentLocationDto | string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  wattage?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  source_type?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  operating_hours?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  days_per_week?: number;

  @ApiProperty({ required: false, description: 'Weekly operating hours, calculated as operating_hours * days_per_week' })
  @IsNumber()
  @IsOptional()
  weekly_hours?: number;

  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  created_at?: Date;

  @ApiProperty({ required: false, example: 5475, description: 'Annual kilowatt-hours of energy consumption' })
  @IsNumber()
  @IsOptional()
  annual_kwh?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsString()
  @IsOptional()
  load_factor?: string;

  @ApiProperty({ required: false, example: 'Thermostat controlled' })
  @IsString()
  @IsOptional()
  control_strategy?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  annual_hours?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  annual_therms?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ai_model?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  formula_used?: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  work_shown?: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  recommendations?: string;
  
  // New fields from our schema update
  @ApiProperty({ required: false, example: '208-230V' })
  @IsString()
  @IsOptional()
  voltage?: string;
  
  @ApiProperty({ required: false, example: 'Single' })
  @IsString()
  @IsOptional()
  phase?: string;
  
  @ApiProperty({ required: false, example: 'Electric' })
  @IsString()
  @IsOptional()
  fuel_type?: string;
  
  @ApiProperty({ required: false, example: '14 SEER' })
  @IsString()
  @IsOptional()
  cooling_efficiency?: string;
  
  @ApiProperty({ required: false, example: '8.5 HSPF' })
  @IsString()
  @IsOptional()
  heating_efficiency?: string;
  
  @ApiProperty({ required: false, example: 5 })
  @IsNumber()
  @IsOptional()
  equipment_age?: number;
  
  @ApiProperty({ required: false })
  @IsDate()
  @IsOptional()
  installation_date?: Date;
  
  @ApiProperty({ required: false, example: 'Annual inspection' })
  @IsString()
  @IsOptional()
  maintenance_schedule?: string;
  
  @ApiProperty({ required: false, example: 5000 })
  @IsNumber()
  @IsOptional()
  replacement_cost?: number;
  
  @ApiProperty({ required: false, example: 15 })
  @IsNumber()
  @IsOptional()
  expected_lifetime?: number;
  
  @ApiProperty({ required: false, example: 'R-410A' })
  @IsString()
  @IsOptional()
  refrigerant_type?: string;
  
  @ApiProperty({ required: false, example: 1200 })
  @IsNumber()
  @IsOptional()
  airflow_rate?: number;
  
  @ApiProperty({ required: false, example: 1800 })
  @IsNumber()
  @IsOptional()
  lumens?: number;
  
  @ApiProperty({ required: false, example: 4000 })
  @IsNumber()
  @IsOptional()
  color_temperature?: number;
  
  @ApiProperty({ required: false, example: 'LED' })
  @IsString()
  @IsOptional()
  lighting_type?: string;
  
  @ApiProperty({ required: false, example: 1.5 })
  @IsNumber()
  @IsOptional()
  flow_rate_gpm?: number;
  
  @ApiProperty({ required: false, example: 18000 })
  @IsNumber()
  @IsOptional()
  water_usage_annual?: number;
  
  @ApiProperty({ required: false, example: 40 })
  @IsNumber()
  @IsOptional()
  recovery_rate?: number;
  
  @ApiProperty({ required: false, example: 2.5 })
  @IsNumber()
  @IsOptional()
  standby_loss?: number;
  
  @ApiProperty({ required: false, example: 14 })
  @IsNumber()
  @IsOptional()
  cycles_per_week?: number;
  
  @ApiProperty({ required: false, example: 35 })
  @IsNumber()
  @IsOptional()
  water_usage_per_cycle?: number;
  
  @ApiProperty({ required: false, example: 5000 })
  @IsNumber()
  @IsOptional()
  irrigation_area?: number;
  
  @ApiProperty({ required: false, example: 'Mon/Wed/Fri 6am-7am' })
  @IsString()
  @IsOptional()
  irrigation_schedule?: string;
  
  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  energy_star_rated?: boolean;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photo_url?: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnail_url?: string;
  
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  photo_filename?: string;
  
  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  photos?: any;
}

/**
 * DTO for creating equipment analysis records
 */
export class CreateEquipmentAnalysisDto extends EquipmentAnalysisDto {}

/**
 * DTO for updating equipment analysis records
 */
export class UpdateEquipmentAnalysisDto extends EquipmentAnalysisDto {
  @ApiProperty({ required: true })
  @IsUUID()
  id: string;
}

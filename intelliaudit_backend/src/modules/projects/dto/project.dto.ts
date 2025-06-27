import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// Import the existing enums
import { ProjectStatus } from '../project.entity';

export class ProjectDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Building address' })
  @IsString()
  @IsNotEmpty()
  building_address: string;

  @ApiProperty({ description: 'Project status' })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiProperty({ description: 'Created at timestamp' })
  @Type(() => Date)
  created_at: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  @Type(() => Date)
  updated_at: Date;

  // Essential building information
  @ApiProperty({ description: 'Building square footage', required: false })
  @IsOptional()
  @IsNumber()
  building_sqft?: number;

  @ApiProperty({ description: 'Building use type', required: false })
  @IsOptional()
  @IsString()
  building_use_type?: string;

  @ApiProperty({ description: 'Year built', required: false })
  @IsOptional()
  @IsNumber()
  year_built?: number;

  @ApiProperty({ description: 'ZIP code', required: false })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Portfolio Manager ID', required: false })
  @IsOptional()
  @IsString()
  pm_id?: string;

  @ApiProperty({ description: 'Satellite image URL', required: false })
  @IsOptional()
  @IsString()
  satellite_image_url?: string;

  // Portfolio Manager fields
  @ApiProperty({ description: 'Portfolio Manager building name', required: false })
  @IsOptional()
  @IsString()
  property_name?: string;

  @ApiProperty({ description: 'Portfolio Manager address', required: false })
  @IsOptional()
  @IsString()
  property_address?: string;

  @ApiProperty({ description: 'Portfolio Manager city', required: false })
  @IsOptional()
  @IsString()
  property_city?: string;

  @ApiProperty({ description: 'Portfolio Manager state', required: false })
  @IsOptional()
  @IsString()
  property_state?: string;

  @ApiProperty({ description: 'Portfolio Manager postal code', required: false })
  @IsOptional()
  @IsString()
  property_postal_code?: string;

  @ApiProperty({ description: 'Portfolio Manager property type', required: false })
  @IsOptional()
  @IsString()
  property_primary_function?: string;

  @ApiProperty({ description: 'Portfolio Manager gross floor area', required: false })
  @IsOptional()
  @IsNumber()
  property_gross_floor_area?: number;

  @ApiProperty({ description: 'Portfolio Manager year built', required: false })
  @IsOptional()
  @IsNumber()
  property_year_built?: number;

  @ApiProperty({ description: 'Raw field notes for the project', required: false })
  @IsOptional()
  @IsString()
  raw_notes?: string;

  @ApiProperty({ description: "Energy Conservation & Opportunities analysis data", required: false })
  @IsOptional()
  @IsString()
  ec_o?: string;
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Building address for the project' })
  @IsString()
  @IsNotEmpty()
  building_address: string;

  @ApiProperty({ description: 'Current status of the project' })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiProperty({ description: 'Current stage of the project', required: false })
  @IsOptional()
  stage?: string;

  // Essential building information
  @ApiProperty({ description: 'Building square footage', required: false })
  @IsOptional()
  @IsNumber()
  building_sqft?: number;

  @ApiProperty({ description: 'Building use type', required: false })
  @IsOptional()
  @IsString()
  building_use_type?: string;

  @ApiProperty({ description: 'Year built', required: false })
  @IsOptional()
  @IsNumber()
  year_built?: number;

  @ApiProperty({ description: 'ZIP code', required: false })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Portfolio Manager ID', required: false })
  @IsOptional()
  @IsString()
  pm_id?: string;

  @ApiProperty({ description: 'Satellite image URL', required: false })
  @IsOptional()
  @IsString()
  satellite_image_url?: string;

  // Portfolio Manager fields
  @ApiProperty({ description: 'Portfolio Manager building name', required: false })
  @IsOptional()
  @IsString()
  property_name?: string;

  @ApiProperty({ description: 'Portfolio Manager address', required: false })
  @IsOptional()
  @IsString()
  property_address?: string;

  @ApiProperty({ description: 'Portfolio Manager city', required: false })
  @IsOptional()
  @IsString()
  property_city?: string;

  @ApiProperty({ description: 'Portfolio Manager state', required: false })
  @IsOptional()
  @IsString()
  property_state?: string;

  @ApiProperty({ description: 'Portfolio Manager postal code', required: false })
  @IsOptional()
  @IsString()
  property_postal_code?: string;

  @ApiProperty({ description: 'Portfolio Manager property type', required: false })
  @IsOptional()
  @IsString()
  property_primary_function?: string;

  @ApiProperty({ description: 'Portfolio Manager gross floor area', required: false })
  @IsOptional()
  @IsNumber()
  property_gross_floor_area?: number;

  @ApiProperty({ description: 'Portfolio Manager year built', required: false })
  @IsOptional()
  @IsNumber()
  property_year_built?: number;

  @ApiProperty({ description: 'Raw field notes for the project', required: false })
  @IsOptional()
  @IsString()
  raw_notes?: string;
}

export class UpdateProjectDto {
  @ApiProperty({ description: 'Name of the project', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Building address for the project', required: false })
  @IsOptional()
  @IsString()
  building_address?: string;

  @ApiProperty({ description: 'Current status of the project', required: false })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({ description: 'Current stage of the project', required: false })
  @IsOptional()
  stage?: string;

  // Essential building information
  @ApiProperty({ description: 'Building square footage', required: false })
  @IsOptional()
  @IsNumber()
  building_sqft?: number;

  @ApiProperty({ description: 'Building use type', required: false })
  @IsOptional()
  @IsString()
  building_use_type?: string;

  @ApiProperty({ description: 'Year built', required: false })
  @IsOptional()
  @IsNumber()
  year_built?: number;

  @ApiProperty({ description: 'ZIP code', required: false })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Portfolio Manager ID', required: false })
  @IsOptional()
  @IsString()
  pm_id?: string;

  @ApiProperty({ description: 'Satellite image URL', required: false })
  @IsOptional()
  @IsString()
  satellite_image_url?: string;

  // Portfolio Manager fields
  @ApiProperty({ description: 'Portfolio Manager building name', required: false })
  @IsOptional()
  @IsString()
  property_name?: string;

  @ApiProperty({ description: 'Portfolio Manager address', required: false })
  @IsOptional()
  @IsString()
  property_address?: string;

  @ApiProperty({ description: 'Portfolio Manager city', required: false })
  @IsOptional()
  @IsString()
  property_city?: string;

  @ApiProperty({ description: 'Portfolio Manager state', required: false })
  @IsOptional()
  @IsString()
  property_state?: string;

  @ApiProperty({ description: 'Portfolio Manager postal code', required: false })
  @IsOptional()
  @IsString()
  property_postal_code?: string;

  @ApiProperty({ description: 'Portfolio Manager property type', required: false })
  @IsOptional()
  @IsString()
  property_primary_function?: string;

  @ApiProperty({ description: 'Portfolio Manager gross floor area', required: false })
  @IsOptional()
  @IsNumber()
  property_gross_floor_area?: number;

  @ApiProperty({ description: 'Portfolio Manager year built', required: false })
  @IsOptional()
  @IsNumber()
  property_year_built?: number;

  @ApiProperty({ description: 'Raw field notes for the project', required: false })
  @IsOptional()
  @IsString()
  raw_notes?: string;
}

// We'll keep a simplified DTO for section status updates
export class UpdateSectionStatusDto {
  @ApiProperty({ description: 'Is section complete' })
  @IsBoolean()
  isComplete: boolean;
}

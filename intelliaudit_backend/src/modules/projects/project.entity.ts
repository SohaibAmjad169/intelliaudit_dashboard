import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum ProjectStage {
  DATA_COLLECTION = 'data_collection',
  ANALYSIS = 'analysis',
  REPORT = 'report',
  REVIEW = 'review',
  COMPLETE = 'complete'
}

export class Project {
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

  @ApiProperty({ description: 'Project stage' })
  @IsOptional()
  stage?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at: string;

  // Essential building information
  @ApiProperty({ description: 'Building square footage' })
  @IsOptional()
  @IsNumber()
  building_sqft?: number;

  @ApiProperty({ description: 'Building use type' })
  @IsOptional()
  @IsString()
  building_use_type?: string;

  @ApiProperty({ description: 'Year built' })
  @IsOptional()
  @IsNumber()
  year_built?: number;

  @ApiProperty({ description: 'ZIP code' })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Portfolio Manager ID' })
  @IsOptional()
  @IsString()
  pm_id?: string;

  @ApiProperty({ description: 'Satellite image URL' })
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
  property_gross_floor_area?: number;

  @ApiProperty({ description: 'Portfolio Manager year built', required: false })
  @IsOptional()
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

export class ProjectInput {
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
  property_gross_floor_area?: number;

  @ApiProperty({ description: 'Portfolio Manager year built', required: false })
  @IsOptional()
  property_year_built?: number;

  @ApiProperty({ description: 'Raw field notes for the project', required: false })
  @IsOptional()
  @IsString()
  raw_notes?: string;
}

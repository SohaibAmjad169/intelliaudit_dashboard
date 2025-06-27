/**
 * Project DTO types for API requests and responses
 */
import { Project } from '../models/project.model';

/**
 * DTO for creating a new project
 */
export interface CreateProjectDto {
  name: string;
  building_address: string;
  description?: string;
  status?: string; // Adding status field for project creation
  building_type?: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  property_name?: string;
  property_gross_floor_area?: number;
  property_year_built?: number;
  building_info?: any;
  stage?: string; // Support stage field for workflow stages
}

/**
 * DTO for updating an existing project
 */
export interface UpdateProjectDto {
  name?: string;
  building_address?: string;
  description?: string;
  status?: string;
  stage?: string; // Support stage field for workflow stages
  building_type?: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  property_name?: string;
  property_gross_floor_area?: number;
  property_year_built?: number;
  raw_notes?: string;
  building_info?: any;
  total_units?: number;
  unit_types?: any;
  building_floors?: number;
  is_public?: boolean;
}

/**
 * DTO for project list responses
 * Extends the base Project model with frontend-specific properties
 */
export interface ProjectListItemDto extends Pick<Project, 
  'id' | 'name' | 'building_address' | 'status' | 'created_at' | 'building_type'
> {
  totalEquipment?: number;
  completedEquipment?: number;
  energySavings?: number;
  costSavings?: number;
  ai_context?: any; // JSON data from the projects table ai_context field
}

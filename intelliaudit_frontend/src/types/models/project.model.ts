/**
 * Project model type definition matching the Prisma schema
 * Based on the 'projects' model in the backend
 */
export interface Project {
  id: string;
  name: string;
  building_address: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
  pm_id?: string;
  property_name?: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_postal_code?: string;
  property_primary_function?: string;
  property_gross_floor_area?: number;
  property_year_built?: number;
  raw_notes?: string;
  ec_o?: string;
  is_public?: boolean;
  building_info?: any; // JSON type in Prisma
  total_units?: number;
  unit_types?: any; // JSON type in Prisma
  building_floors?: number;
  building_type?: string;
  building_notes?: string;
  energy_star_score?: number;
  site_total_energy?: number;
  source_total_energy?: number;
  site_intensity?: number;
  source_intensity?: number;
  direct_ghg_emissions?: number;
  energy_metrics_last_updated?: Date;
  energy_metrics_year?: number;
  energy_metrics_month?: number;
  energy_metrics_source?: string;
  satellite_image_url?: string;
  ai_context?: any; // JSON context data for AI
}

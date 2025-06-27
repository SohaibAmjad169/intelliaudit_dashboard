/**
 * Equipment model type definitions matching the Prisma schema
 * Based on the 'equipment_analysis' and 'enriched_equipment' models in the backend
 */

/**
 * Base equipment fields shared across different equipment types
 */
export interface BaseEquipment {
  id: string;
  project_id: string;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  category: string | null;
  quantity?: number | null;
  location?: string | null;
  serial_number?: string | null;
  notes?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  photo_url?: string | null;
  thumbnail_url?: string | null;
}

/**
 * EquipmentAnalysis model matching the equipment_analysis table in Prisma
 */
export interface EquipmentAnalysis extends BaseEquipment {
  wattage?: number | null;
  capacity?: string | null;
  operating_hours?: number | null;
  days_per_week?: number | null;
  annual_kwh?: number | null;
  confidence?: number | null;
  ai_model?: string | null;
  flow_rate?: string | null;
  efficiency?: string | null;
  input_rating?: number | null;
  temperature_rise?: number | null;
  efficiency_unit?: string | null;
  energy_source?: string | null;
  daily_usage?: number | null;
  calculation_details?: any | null; // JSON type in Prisma
  is_per_unit?: boolean | null;
  total_quantity?: number | null;
  source_type?: string | null;
  specifications?: any | null; // JSON type in Prisma
  load_factor?: number | null;
  area_type?: string | null;
  annual_cost_estimate?: number | null;
  is_calculation_verified?: boolean | null;
  weekly_hours?: number | null;
  annual_hours?: number | null;
  formula_used?: string | null;
  work_shown?: string | null;
  recommendations?: string | null;
  photo_filename?: string | null;
  photos?: any[] | null; // JSON array in Prisma
  condition?: any | null; // JSON type in Prisma
  original_photo_analysis_id?: string | null;
  control_strategy?: string | null;
}

/**
 * EnrichedEquipment model matching the enriched_equipment table in Prisma
 */
export interface EnrichedEquipment extends BaseEquipment {
  source_type: string;
  original_field_notes_id?: string | null;
  original_photo_analysis_id?: string | null;
  specifications?: {
    capacity?: string | null;
    efficiency?: {
      cooling?: string | null;
      heating?: string | null;
    } | string | null;
    refrigerantType?: string | null;
    voltage?: string | null;
    phase?: string | null;
    wattage?: number | null;
    fuelType?: string | null;
    [key: string]: any;
  } | null;
  condition?: {
    overall: 'Good' | 'Fair' | 'Poor' | null;
    visibleIssues: string[];
    estimatedAge?: string | null;
    remainingLife?: string | null;
  } | null;
  control_strategy?: string | null;
  load_factor?: number | null;
  operating_hours?: number | null;
  days_per_week?: number | null;
  annual_kwh?: number | null;
  annual_cost_estimate?: number | null;
  energy_source?: string | null;
}

/**
 * AIPhotoAnalysis model matching the ai_photo_analysis table in Prisma
 */
export interface AIPhotoAnalysis extends BaseEquipment {
  photo_filename?: string | null;
  confidence?: number | null;
  ai_model?: string | null;
  location?: any | null; // JSON type in Prisma
  installation_details?: any | null; // JSON type in Prisma
  certification_info?: any | null; // JSON type in Prisma
  maintenance_history?: any | null; // JSON type in Prisma
  system_connections?: any | null; // JSON type in Prisma
  load_factor?: string | null;
  control_strategy?: string | null;
  operating_hours?: number | null;
  annual_kwh?: number | null;
}

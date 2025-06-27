/**
 * Equipment DTO types for API requests and responses
 */
import { BaseEquipment, EquipmentAnalysis, EnrichedEquipment } from '../models/equipment.model';

/**
 * DTO for creating new equipment
 */
export interface CreateEquipmentDto {
  project_id: string;
  equipment_type: string;
  manufacturer?: string | null;
  model?: string | null;
  category?: string | null;
  quantity?: number | null;
  wattage?: number | null;
  capacity?: string | null;
  operating_hours?: number | null;
  days_per_week?: number | null;
  location?: string | null;
  serial_number?: string | null;
  control_strategy?: string | null;
  energy_source?: string | null;
  specifications?: any | null;
  condition?: any | null;
  load_factor?: number | null;
  notes?: string | null;
}

/**
 * DTO for updating existing equipment
 */
export interface UpdateEquipmentDto {
  equipment_type?: string;
  manufacturer?: string | null;
  model?: string | null;
  category?: string | null;
  quantity?: number | null;
  wattage?: number | null;
  capacity?: string | null;
  operating_hours?: number | null;
  days_per_week?: number | null;
  annual_kwh?: number | null;
  location?: string | null;
  serial_number?: string | null;
  control_strategy?: string | null;
  energy_source?: string | null;
  specifications?: any | null;
  condition?: any | null;
  load_factor?: number | null;
  annual_cost_estimate?: number | null;
  is_calculation_verified?: boolean | null;
  notes?: string | null;
}

/**
 * DTO for equipment list responses with calculated/derived properties
 */
export interface EquipmentListItemDto extends Pick<EquipmentAnalysis, 
  'id' | 'project_id' | 'equipment_type' | 'manufacturer' | 'model' | 
  'category' | 'quantity' | 'annual_kwh' | 'annual_cost_estimate'
> {
  total_annual_kwh?: number;
  total_annual_cost?: number;
  efficiency_rating?: string;
  age_estimate?: string;
  replacement_recommendation?: boolean;
}

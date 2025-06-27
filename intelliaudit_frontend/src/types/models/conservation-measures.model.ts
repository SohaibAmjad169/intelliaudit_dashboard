/**
 * Energy conservation measures model type definitions matching the Prisma schema
 * Based on the 'energy_conservation_measures' model in the backend
 */

/**
 * EnergyConservationMeasure model matching the energy_conservation_measures table in Prisma
 */
export interface EnergyConservationMeasure {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  energy_savings?: number;
  cost_savings?: number;
  implementation_cost?: number;
  payback_period?: number;
  roi?: number;
  carbon_savings?: number;
  notes?: string;
  status?: string; 
  created_at?: Date;
  updated_at?: Date;
  category?: string;
  priority?: string;
  carbon_savings_units?: string;
  energy_savings_kwh?: number;
  energy_savings_therms?: number;
  details?: any; // JSON in Prisma
  equipment_affected?: string[];
  source_equipment_id?: string;
}

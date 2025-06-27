/**
 * Utility data model type definitions matching the Prisma schema
 * Based on the 'utility_data' and 'utility_calcs' models in the backend
 */

/**
 * UtilityData model matching the utility_data table in Prisma
 */
export interface UtilityData {
  id: string;
  project_id: string;
  pm_id: string;
  meter_id?: string;
  meter_name?: string;
  meter_type?: string;
  start_date?: Date;
  end_date?: Date;
  month?: number;
  year?: number;
  usage?: number;
  cost?: number;
  usage_units?: string;
  property_name?: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_postal_code?: string;
  property_primary_function?: string;
  property_gross_floor_area?: number;
  property_year_built?: number;
  import_date?: Date;
  hdd?: string;
  cdd?: string;
}

/**
 * UtilityCalcs model matching the utility_calcs table in Prisma
 */
export interface UtilityCalcs {
  id: string;
  project_id: string;
  pm_id: string;
  month: number;
  year: number;
  meter_id: string;
  meter_type: string;
  usage?: number;
  cost?: number;
  usage_units?: string;
  property_name?: string;
  equipment_id?: string;
  created_at: Date;
  updated_at: Date;
  heating_degree_days?: number;
  cooling_degree_days?: number;
}

/**
 * WeatherComparison model matching the weather_comparison table in Prisma
 */
export interface WeatherComparison {
  id: number;
  project_id: string;
  zip_code: string;
  station_id: number;
  month: number;
  base_year: number;
  comparison_year?: number;
  base_year_hdd: number;
  base_year_cdd: number;
  base_year_tdd: number;
  comparison_year_hdd: number;
  comparison_year_cdd: number;
  comparison_year_tdd: number;
  hdd_delta?: number;
  cdd_delta?: number;
  tdd_delta?: number;
  created_at?: Date;
  updated_at?: Date;
}

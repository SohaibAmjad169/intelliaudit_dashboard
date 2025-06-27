/**
 * Report model type definitions based on the Prisma schema
 */

/**
 * Base report model interface
 */
export interface Report {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  generated_by?: string;
  status?: string;
  version?: number;
  report_type?: string;
  document_url?: string;
  shared_url?: string;
  is_public?: boolean;
  metadata?: any; // JSON in Prisma
  sections?: ReportSection[];
}

/**
 * Report section
 */
export interface ReportSection {
  id: string;
  report_id: string;
  title: string;
  content?: string;
  order?: number;
  section_type?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Utility data for reports
 */
export interface UtilityUsage {
  id?: string;
  type: string;
  month: number;
  year: number;
  usage: number;
  cost: number;
  units?: string;
}

/**
 * Equipment item for reports
 */
export interface ReportEquipmentItem {
  id: string;
  name?: string;
  category: string;
  subCategory?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  installedYear?: number;
  capacity?: number;
  capacityUnit?: string;
  efficiency?: number;
  efficiencyUnit?: string;
  condition?: string;
  remainingLife?: number;
  replacementCost?: number;
  notes?: string;
  annual_kwh?: number;
  annual_cost_estimate?: number;
}

/**
 * Conservation measure for reports
 */
export interface ReportConservationMeasure {
  id: string;
  name: string;
  description: string;
  category?: string;
  implementation_cost?: number;
  annual_savings?: number;
  payback_period?: number;
  energy_savings_kwh?: number;
  energy_savings_therms?: number;
  cost_savings?: number;
  carbon_savings?: number;
  roi?: number;
  notes?: string;
  priority?: string;
  status?: string;
  affected_equipment?: string[];
}

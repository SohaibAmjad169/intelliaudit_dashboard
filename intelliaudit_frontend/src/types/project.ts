// import { CustomerReference } from './customer';

// Define a simplified version of EquipmentItem from the energy types
export interface EquipmentItem {
  id: string | number;
  project_id?: string;
  equipment_type?: string;
  make?: string;
  model?: string;
  location?: string | { room?: string; floor?: string };
  quantity?: number;
  wattage?: number;
  capacity?: number | string;
  category?: string;
  notes?: string;
  confidence?: number;
  annual_kwh?: number;
}

// Define a simplified ProcessedEquipment type for backward compatibility
export interface ProcessedEquipment extends EquipmentItem {
  // Any additional fields needed for compatibility
}

// Project status as a const object for runtime use
export const PROJECT_STATUS_VALUES = {
  UNASSIGNED: 'UNASSIGNED',
  SCHEDULE_NEEDED: 'SCHEDULE_NEEDED',
  SITE_VISIT_SCHEDULED: 'SITE_VISIT_SCHEDULED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  OUTSOURCED: 'OUTSOURCED',
  REVISIT_NEEDED: 'REVISIT_NEEDED',
  CANCELED: 'CANCELED',
  PENDING_PE_SIGNATURE: 'PENDING_PE_SIGNATURE',
  PENDING_CITY_APPROVAL: 'PENDING_CITY_APPROVAL',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  DONE: 'DONE'
} as const;

// Type derived from the const object
export type ProjectStatus = typeof PROJECT_STATUS_VALUES[keyof typeof PROJECT_STATUS_VALUES];

// No longer using ProjectStage enum
export type SectionType = 'general' | 'requirements' | 'findings' | 'recommendations';

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  general: 'General Information',
  requirements: 'Requirements',
  findings: 'Findings',
  recommendations: 'Recommendations'
} as const;

// Base interface containing only database fields
export interface EnergyCategory {
  name: string;
  percentage: number;
  consumption: number;
}

export interface BenchmarkData {
  category: string;
  actual: number;
  benchmark: number;
}

export interface EnergyAuditData {
  totalEnergyConsumption: number;
  energyCategories: EnergyCategory[];
  confidenceScore: number;
  benchmarkData: BenchmarkData[];
}

/**
 * Base project information
 */
export interface ProjectBase {
  id: string;
  name: string;
  company_name: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  building_address: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  property_name?: string;
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_postal_code?: string;
  building_type?: string;
  building_size?: number;
  year_built?: number;
  property_gross_floor_area?: number;
  property_primary_function?: string;
  property_year_built?: number;
  total_units?: number;
  total_electric_usage?: number;
  total_gas_usage?: number;
  total_utility_cost?: number;
  energy_star_score?: number;
  pm_id?: string;
  water_score?: number;
  site_total_energy?: number;
  source_total_energy?: number;
  site_intensity?: number;
  direct_ghg_emissions?: number;
  raw_notes?: string;
  
  

  operating_hours?: string;
  occupancy?: number;
  square_footage?: number;
  building_sqft?: number;
  building_use_type?: string;
  building_info?: {
    type: string;
    total_units: number;
    unit_types: Array<{
      type: string;
      count: number;
      description: string;
    }>;
    floors: number;
    address?: string;
    notes?: string;
  };
  ec_o?: string | any;
  existing_conditions?: Array<{
    id: string;
    category: string;
    description: string;
    notes?: string;
  }>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  status?: ProjectStatus;
  project_type?: 'energy_audit' | 'water_audit' | 'retro_commissioning' | 'other';
}

// Define a union type for all possible status values
export type ProjectStatusType = ProjectStatus | 'active' | 'completed' | 'archived';

/**
 * Full project data including related entities
 */
export interface Project extends ProjectBase {
  client_id?: string;
  status: ProjectStatus;
  project_type: 'energy_audit' | 'water_audit' | 'retro_commissioning' | 'other';
  notes?: string;
  tags?: string[];
  stage?: string;
  ai_context?: any;
}

// UI-specific state and computed properties
export interface ProjectUIState {
  allowSkipStages: boolean;
  milestones?: any[];
}

// Database schema types - match exactly with database columns
export type ProjectSchema = ProjectBase;

// Extended Project interface with UI-specific data
export type ProjectWithDetails = Project & ProjectUIState;

// Database insert/update types - omit auto-generated fields
export type CreateProjectData = Pick<ProjectBase, 'name' | 'building_address'> & {
  status?: ProjectStatus;
  description?: string;
  company_name?: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  project_type?: 'energy_audit' | 'water_audit' | 'retro_commissioning' | 'other';
  stage?: string;
};
export type UpdateProjectData = Partial<CreateProjectData>;

// Form data interface for user input
export interface ProjectFormData {
  name: string;
  building_address: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  status: ProjectStatus;
  description?: string;
  company_name?: string;
  project_type?: 'energy_audit' | 'water_audit' | 'retro_commissioning' | 'other';
}

export interface ProjectSection {
  id: string;
  project_id: string;
  name: string;
  content: string;
  order: number;
  section_type: SectionType;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

// Status display labels - shorter versions for badges
export const STATUS_DISPLAY_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS_VALUES.UNASSIGNED]: 'Unassigned',
  [PROJECT_STATUS_VALUES.SCHEDULE_NEEDED]: 'Needs Schedule',
  [PROJECT_STATUS_VALUES.SITE_VISIT_SCHEDULED]: 'Visit Scheduled',
  [PROJECT_STATUS_VALUES.ACTIVE]: 'Active',
  [PROJECT_STATUS_VALUES.ON_HOLD]: 'On Hold',
  [PROJECT_STATUS_VALUES.OUTSOURCED]: 'Outsourced',
  [PROJECT_STATUS_VALUES.REVISIT_NEEDED]: 'Needs Revisit',
  [PROJECT_STATUS_VALUES.CANCELED]: 'Canceled',
  [PROJECT_STATUS_VALUES.PENDING_PE_SIGNATURE]: 'PE Review',
  [PROJECT_STATUS_VALUES.PENDING_CITY_APPROVAL]: 'City Review',
  [PROJECT_STATUS_VALUES.AWAITING_PAYMENT]: 'Payment Due',
  [PROJECT_STATUS_VALUES.DONE]: 'Done'
} as const;

// Helper function to get display label
export const getStatusLabel = (status: ProjectStatus): string => {
  return STATUS_DISPLAY_LABELS[status];
};

// Type guard to check if a project has UI details
export const isProjectWithDetails = (project: Project | ProjectWithDetails): project is ProjectWithDetails => {
  return 'allowSkipStages' in project;
};

// Constants
export const PROJECT_STATUS_COLORS = {
  [PROJECT_STATUS_VALUES.UNASSIGNED]: 'gray',
  [PROJECT_STATUS_VALUES.SCHEDULE_NEEDED]: 'yellow',
  [PROJECT_STATUS_VALUES.SITE_VISIT_SCHEDULED]: 'blue',
  [PROJECT_STATUS_VALUES.ACTIVE]: 'green',
  [PROJECT_STATUS_VALUES.ON_HOLD]: 'orange',
  [PROJECT_STATUS_VALUES.OUTSOURCED]: 'purple',
  [PROJECT_STATUS_VALUES.REVISIT_NEEDED]: 'red',
  [PROJECT_STATUS_VALUES.CANCELED]: 'gray',
  [PROJECT_STATUS_VALUES.PENDING_PE_SIGNATURE]: 'blue',
  [PROJECT_STATUS_VALUES.PENDING_CITY_APPROVAL]: 'purple',
  [PROJECT_STATUS_VALUES.AWAITING_PAYMENT]: 'yellow',
  [PROJECT_STATUS_VALUES.DONE]: 'green'
} as const;

export interface ProjectData {
  id: string;
  name: string;
  building_address: string;
  building_city?: string;
  building_state?: string;
  building_zip?: string;
  building_type?: string;
  status: string;
  stage?: string;
  project_type?: string;
  company_name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
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
  is_public: boolean;
}

export interface EquipmentData {
  id: string;
  project_id: string;
  type: string;
  category?: string;
  make?: string;
  model?: string;
  location?: string;
  wattage?: number;
  quantity?: number;
  condition?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
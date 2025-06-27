import { Project } from './project';

// Base interface containing only database fields
export interface ProjectAuditBase {
  id: string;
  project_id: string;
  
  // Building Information
  bin?: string;
  ain_apn?: string;
  building_type?: string;
  building_sqft?: number;
  portfolio_manager_id?: string;
  
  // Key Dates
  deal_closed_at?: string;
  site_visit_scheduled_at?: string;
  site_visit_completed_at?: string;
  report_completed_at?: string;
  city_approval_at?: string;
  
  // Financial
  total_revenue?: number;
  total_paid?: number;
  registration_fee_paid_at?: string;
  estimated_costs?: number;
  estimated_savings?: number;
  
  // Status Tracking
  pe_name?: string;
  pe_declaration_signed?: boolean;
  city_approval_status?: string;
  payment_status?: string;
  vertpro_id?: string;

  // Audit Specifics
  audit_types?: string[];
  findings?: string;
  planned_upgrades?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Database schema type - matches exactly with database columns
export type ProjectAuditSchema = ProjectAuditBase;

// Base type for API responses
export type ProjectAudit = ProjectAuditBase;

// Extended type with related data
export interface ProjectAuditWithDetails extends ProjectAuditBase {
  project?: Project;
}

// Database insert type - omit auto-generated fields
export type CreateProjectAuditData = Omit<
  ProjectAuditBase,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
>;

// Database update type - make all fields optional
export type UpdateProjectAuditData = Partial<CreateProjectAuditData>;

// Form data interface for user input
export interface ProjectAuditFormData {
  project_id: string;
  bin?: string;
  ain_apn?: string;
  building_type?: string;
  building_sqft?: number;
  portfolio_manager_id?: string;
  pe_name?: string;
  pe_declaration_signed?: boolean;
  city_approval_status?: string;
  payment_status?: string;
  vertpro_id?: string;
  audit_types?: string[];
  findings?: string;
  planned_upgrades?: string;
}

// Constants for status values
export const CITY_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue'
} as const;

export const AUDIT_TYPES = {
  ENERGY_AUDIT: 'EA',
  WATER_AUDIT: 'WA',
  RETRO_COMMISSIONING: 'RCx'
} as const;

// Type guards
export const isProjectAuditWithDetails = 
  (audit: ProjectAudit | ProjectAuditWithDetails): audit is ProjectAuditWithDetails => {
    return (audit as ProjectAuditWithDetails).project !== undefined;
};

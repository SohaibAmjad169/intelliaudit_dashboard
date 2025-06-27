// Common API action types
export type CommonAction =
  // Customer actions
  | 'get_customer'
  | 'get_customers'
  | 'create_customer'
  | 'update_customer'
  | 'delete_customer'
  
  // Project actions
  | 'get_project'
  | 'get_projects'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'get_project_status'
  | 'update_project_stage'
  
  // Building profile actions
  | 'get_building_profile'
  | 'update_building_profile'
  
  // Equipment actions
  | 'get_equipment_list'
  | 'add_equipment'
  | 'get_equipment_analysis'
  | 'process_field_notes'
  | 'analyze_equipment'
  | 'validate_equipment'
  | 'enhance_equipment'
  
  // Utility actions
  | 'get_utility_data'
  | 'calculate_baseline'
  
  // Report actions
  | 'get_report_sections'
  | 'update_report_section'
  | 'update_section_status'
  | 'generate_report'
  | 'submit_for_review'
  | 'approve_report'
  | 'request_revisions'
  
  // Analysis actions
  | 'analysis_get_metadata'
  | 'analysis_get_weather'
  | 'analysis_get_utility'
  | 'analysis_get_equipment'
  | 'analysis_get_baseline'
  | 'analysis_calculate_savings'
  | 'identify_opportunities'
  | 'calculate_financials'
  
  // Data Collection Phase actions
  | 'building.get'
  | 'building.create'
  | 'building.update'
  | 'building.delete'
  | 'systems.get'
  | 'systems.create'
  | 'systems.update'
  | 'systems.delete'
  | 'operations.get'
  | 'operations.create'
  | 'operations.update'
  | 'operations.delete'
  | 'tenants.get'
  | 'tenants.create'
  | 'tenants.update'
  | 'tenants.delete';

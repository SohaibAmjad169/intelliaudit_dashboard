/**
 * Report DTO types for API requests and responses
 */
import { Report, ReportSection, ReportEquipmentItem, ReportConservationMeasure } from '../models/report.model';

/**
 * DTO for creating a new report
 */
export interface CreateReportDto {
  project_id: string;
  title: string;
  description?: string;
  report_type?: string;
  metadata?: any;
}

/**
 * DTO for updating an existing report
 */
export interface UpdateReportDto {
  title?: string;
  description?: string;
  status?: string;
  is_public?: boolean;
  metadata?: any;
}

/**
 * DTO for adding a section to a report
 */
export interface AddReportSectionDto {
  report_id: string;
  title: string;
  content?: string;
  order?: number;
  section_type?: string;
}

/**
 * DTO for report generation request
 */
export interface GenerateReportDto {
  project_id: string;
  report_type: string;
  include_equipment?: boolean;
  include_energy_data?: boolean;
  include_recommendations?: boolean;
  template_id?: string;
}

/**
 * DTO for report list responses
 */
export interface ReportListItemDto extends Pick<Report, 
  'id' | 'project_id' | 'title' | 'status' | 'created_at' | 'updated_at' | 'document_url'
> {
  project_name?: string;
  author_name?: string;
  section_count?: number;
}

/**
 * DTO for a complete report response
 */
export interface CompleteReportDto extends Report {
  project_name?: string;
  author_name?: string;
  sections: ReportSection[];
  equipment?: ReportEquipmentItem[];
  conservation_measures?: ReportConservationMeasure[];
  utility_data?: {
    electric: { data: any[], totalUsage: number, totalCost: number };
    gas: { data: any[], totalUsage: number, totalCost: number };
  };
}

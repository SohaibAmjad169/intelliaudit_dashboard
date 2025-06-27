import { apiClient } from '../common/api-client';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReportImage {
  id: string;
  caption: string;
  url: string;
  category: string;
}

export interface ReportData {
  id: string;
  projectId: string;
  title: string;
  coverImage?: string;
  clientName: string;
  auditDate: string;
  auditorName: string;
  status: 'draft' | 'published';
  sections: ReportSection[];
  images: ReportImage[];
  facilityInfo?: {
    buildingType: string;
    buildingSize: number;
    yearBuilt: number;
    occupancy: number;
    operatingHours: string;
  };
  utilityData?: {
    electricity: Array<{
      month: string;
      usage: number;
      demand: number;
      cost: number;
    }>;
    naturalGas: Array<{
      month: string;
      usage: number;
      cost: number;
    }>;
    water: Array<{
      month: string;
      usage: number;
      cost: number;
    }>;
  };
  endUseBreakdown?: Array<{
    category: string;
    percentage: number;
    annualUsage: number;
    annualCost: number;
  }>;
  created_at: string;
  updated_at: string;
}

export const reportV2Service = {
  /**
   * Get the report for a project
   * @param projectId Project ID
   * @returns Report data
   */
  async getProjectReport(projectId: string): Promise<ReportData | null> {
    try {
      const response = await apiClient.get<ReportData>(`/api/reports/project/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error fetching project report:', error);
      return null;
    }
  },

  /**
   * Get a report by ID
   * @param reportId Report ID
   * @returns Report data
   */
  async getReportById(reportId: string): Promise<ReportData | null> {
    try {
      const response = await apiClient.get<ReportData>(`/api/reports/${reportId}`);
      return response;
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      return null;
    }
  },

  /**
   * Create a new report
   * @param reportData Report data
   * @returns Created report
   */
  async createReport(reportData: Partial<ReportData>): Promise<ReportData | null> {
    try {
      const response = await apiClient.post<ReportData>('/api/reports', reportData);
      return response;
    } catch (error) {
      console.error('Error creating report:', error);
      return null;
    }
  },

  /**
   * Update an existing report
   * @param reportId Report ID
   * @param reportData Updated report data
   * @returns Updated report
   */
  async updateReport(reportId: string, reportData: Partial<ReportData>): Promise<ReportData | null> {
    try {
      const response = await apiClient.put<ReportData>(`/api/reports/${reportId}`, reportData);
      return response;
    } catch (error) {
      console.error('Error updating report:', error);
      return null;
    }
  },

  /**
   * Generate a PDF of the report
   * @param reportId Report ID
   * @returns PDF download URL
   */
  async generatePDF(reportId: string): Promise<{ url: string } | null> {
    try {
      const response = await apiClient.post<{ url: string }>(`/api/reports/${reportId}/pdf`);
      return response;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  },

  /**
   * Share a report (creates a shareable link)
   * @param reportId Report ID
   * @param expiresInDays Number of days until link expires (0 for no expiration)
   * @returns Sharing details
   */
  async shareReport(reportId: string, expiresInDays: number = 0): Promise<{ shareUrl: string; expiresAt: string | null } | null> {
    try {
      const response = await apiClient.post<{ shareUrl: string; expiresAt: string | null }>(
        `/api/reports/${reportId}/share`,
        { expiresInDays }
      );
      return response;
    } catch (error) {
      console.error('Error sharing report:', error);
      return null;
    }
  }
}; 
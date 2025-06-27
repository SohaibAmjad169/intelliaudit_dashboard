import { apiClient } from '../common/api-client';
export * from './report-v2';

export interface ProjectReport {
  // Add specific types as needed based on your API response
  id: string;
  // other report fields
}

/**
 * Service for handling report-related API requests
 */
export const reportsService = {
  /**
   * Get a project report
   * @param projectId - The ID of the project
   */
  async getProjectReport(projectId: string) {
    return apiClient.get<ProjectReport>(`reports/project/${projectId}`);
  },

  /**
   * Generate a PDF report for a project
   * @param projectId - The ID of the project
   */
  async generateProjectReportPdf(projectId: string): Promise<Blob> {
    return apiClient.postBlob(`reports/project/${projectId}/pdf`);
  },

  /**
   * Generate an HTML-based PDF report for a project
   * @param projectId - The ID of the project
   */
  async generateProjectReportHtmlPdf(projectId: string): Promise<Blob> {
    return apiClient.postBlob(`reports/project/${projectId}/html-pdf`);
  },

  /**
   * Generate a PDF report for a project (legacy support)
   * @param projectId - The project ID
   * @returns A Blob containing the PDF report
   */
  async generateReport(projectId: string): Promise<Blob> {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_API_URL || 'http://localhost:3000'}/api/reports/generate/${projectId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  /**
   * Download a PDF report for a project (legacy support)
   * @param projectId - The project ID
   * @param filename - The filename to save the report as
   */
  async downloadReport(projectId: string, filename: string = `audit-report-${projectId}.pdf`): Promise<void> {
    try {
      const pdfBlob = await this.generateReport(projectId);

      // Create a URL for the blob
      const url = URL.createObjectURL(pdfBlob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Append to the document, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }
};

// Re-export the V2 service as the main report service
export { reportV2Service as reportService } from './report-v2';

// Legacy named exports for backward compatibility
export const generateAuditReport = reportsService.generateReport;
export const downloadAuditReport = reportsService.downloadReport;
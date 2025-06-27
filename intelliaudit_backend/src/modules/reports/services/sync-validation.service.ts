import { Injectable } from '@nestjs/common';
import { SyncValidator } from '../validation/sync-validator';
import { ReportService } from './report.service';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  issues: string[];
}

@Injectable()
export class SyncValidationService {
  constructor(
    private readonly syncValidator: SyncValidator,
    private readonly reportService: ReportService
  ) {}

  /**
   * Checks synchronization between share page and PDF components
   * @param projectId Project ID to validate
   * @returns Validation results and recommendations
   */
  async checkSynchronization(projectId: string): Promise<any> {
    try {
      // Get share page data
      const sharePageData = await this.reportService.getSharePageData(projectId);
      
      // Validate synchronization
      const validationResults = await this.syncValidator.validateSynchronization(sharePageData);
      
      // Generate report
      return this.generateValidationReport(validationResults);
    } catch (error) {
      throw new Error(`Failed to check synchronization: ${error.message}`);
    }
  }

  /**
   * Generates a detailed validation report
   * @param results Validation results
   * @returns Formatted report
   */
  private generateValidationReport(results: ValidationResult[]): any {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalComponents: results.length,
        passed: results.filter(r => r.status === 'pass').length,
        failed: results.filter(r => r.status === 'fail').length,
        warnings: results.filter(r => r.status === 'warning').length
      },
      details: results.map(result => ({
        component: result.component,
        status: result.status,
        issues: result.issues,
        recommendations: this.generateRecommendations(result)
      }))
    };

    return report;
  }

  /**
   * Generates recommendations based on validation results
   * @param result Validation result
   * @returns Array of recommendations
   */
  private generateRecommendations(result: ValidationResult): string[] {
    const recommendations: string[] = [];

    if (result.status === 'fail') {
      if (result.issues.some((issue: string) => issue.includes('Missing section'))) {
        recommendations.push('Add missing sections to the component');
      }
      if (result.issues.some((issue: string) => issue.includes('Invalid data structure'))) {
        recommendations.push('Review and fix data structure in the component');
      }
      if (result.issues.some((issue: string) => issue.includes('Missing data'))) {
        recommendations.push('Ensure all required data is provided');
      }
    }

    if (result.issues.length > 0) {
      recommendations.push('Review the audit plan for component-specific requirements');
    }

    return recommendations;
  }

  /**
   * Schedules regular synchronization checks
   * @param projectId Project ID
   * @param interval Check interval in milliseconds
   */
  async scheduleRegularChecks(projectId: string, interval: number): Promise<void> {
    setInterval(async () => {
      try {
        const results = await this.checkSynchronization(projectId);
        if (results.summary.failed > 0) {
          // Log failed checks
          console.warn('Synchronization check failed:', results);
        }
      } catch (error) {
        console.error('Failed to perform scheduled check:', error);
      }
    }, interval);
  }
} 
import { Injectable } from '@nestjs/common';
import { EnergyAuditComponent } from '../components/energy-audit.component';
import { WaterAuditComponent } from '../components/water-audit.component';
import { RetroCommissioningComponent } from '../components/retro-commissioning.component';

interface ValidationResult {
  component: string;
  issues: string[];
  status: 'pass' | 'fail' | 'warning';
}

@Injectable()
export class SyncValidator {
  private energyAuditComponent: EnergyAuditComponent;
  private waterAuditComponent: WaterAuditComponent;
  private retroCommissioningComponent: RetroCommissioningComponent;

  constructor() {
    this.energyAuditComponent = new EnergyAuditComponent();
    this.waterAuditComponent = new WaterAuditComponent();
    this.retroCommissioningComponent = new RetroCommissioningComponent();
  }

  /**
   * Validates synchronization between share page and PDF components
   * @param sharePageData Data from the share page
   * @returns Array of validation results
   */
  async validateSynchronization(sharePageData: any): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Validate each component
    results.push(await this.validateEnergyAudit(sharePageData));
    results.push(await this.validateWaterAudit(sharePageData));
    results.push(await this.validateRetroCommissioning(sharePageData));

    return results;
  }

  private async validateEnergyAudit(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      component: 'Energy Audit',
      issues: [],
      status: 'pass'
    };

    try {
      // Check required sections
      const requiredSections = [
        'Introduction',
        'Energy Audit Procedures',
        'Cost Savings Summary Table',
        'Existing Conditions',
        'Recommended Measures',
        'Implemented Measures',
        'Measures to Consider',
        'Measures Requiring Investigation',
        'ENERGY STAR Benchmarking',
        'Energy Use Analysis'
      ];

      // Validate data structure
      if (!data.energyAudit) {
        result.issues.push('Missing energy audit data');
        result.status = 'fail';
        return result;
      }

      // Check section presence
      requiredSections.forEach(section => {
        if (!this.energyAuditComponent.hasSection(section)) {
          result.issues.push(`Missing section: ${section}`);
          result.status = 'fail';
        }
      });

      // Validate measures data
      if (data.energyAudit.measures) {
        const measures = data.energyAudit.measures;
        measures.forEach((measure: any) => {
          if (!measure.name || !measure.status) {
            result.issues.push('Invalid measure data structure');
            result.status = 'fail';
          }
        });
      }

      // Validate existing conditions
      if (data.energyAudit.existingConditions) {
        const conditions = data.energyAudit.existingConditions;
        conditions.forEach((condition: any) => {
          if (!condition.title || !condition.description) {
            result.issues.push('Invalid existing condition data structure');
            result.status = 'fail';
          }
        });
      }

      // Validate energy usage data
      if (data.energyAudit.totalUsage) {
        const requiredFields = ['total', 'electric', 'naturalGas'];
        requiredFields.forEach(field => {
          if (typeof data.energyAudit.totalUsage[field] !== 'number') {
            result.issues.push(`Invalid total usage data for ${field}`);
            result.status = 'fail';
          }
        });
      }

    } catch (error) {
      result.issues.push(`Validation error: ${error.message}`);
      result.status = 'fail';
    }

    return result;
  }

  private async validateWaterAudit(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      component: 'Water Audit',
      issues: [],
      status: 'pass'
    };

    try {
      // Check required sections
      const requiredSections = [
        'Introduction',
        'Water Audit Procedures',
        'WEMs Cost Savings Summary',
        'Existing Conditions',
        'Recommended WEMs',
        'Implemented WEMs',
        'WEMs to Consider',
        'WEMs Requiring Investigation',
        'Water Use Analysis'
      ];

      // Validate data structure
      if (!data.waterAudit) {
        result.issues.push('Missing water audit data');
        result.status = 'fail';
        return result;
      }

      // Check section presence
      requiredSections.forEach(section => {
        if (!this.waterAuditComponent.hasSection(section)) {
          result.issues.push(`Missing section: ${section}`);
          result.status = 'fail';
        }
      });

      // Validate measures data
      if (data.waterAudit.measures) {
        const measures = data.waterAudit.measures;
        measures.forEach((measure: any) => {
          if (!measure.name || !measure.status) {
            result.issues.push('Invalid WEM data structure');
            result.status = 'fail';
          }
        });
      }

      // Validate water usage data
      if (data.waterAudit.totalUsage) {
        if (typeof data.waterAudit.totalUsage.water !== 'number') {
          result.issues.push('Invalid total water usage data');
          result.status = 'fail';
        }
      }

      // Validate monthly data
      if (data.waterAudit.monthlyData) {
        if (!Array.isArray(data.waterAudit.monthlyData.water)) {
          result.issues.push('Invalid monthly water data structure');
          result.status = 'fail';
        }
      }

    } catch (error) {
      result.issues.push(`Validation error: ${error.message}`);
      result.status = 'fail';
    }

    return result;
  }

  private async validateRetroCommissioning(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      component: 'Retro-Commissioning',
      issues: [],
      status: 'pass'
    };

    try {
      // Check required sections
      const requiredSections = [
        'Introduction',
        'Retro-Commissioning Procedures',
        'RCMs Cost Savings Summary',
        'Existing Conditions',
        'Recommended RCMs',
        'Implemented RCMs',
        'Assessment Team',
        'Project Team',
        'Site Visit Information',
        'Implementation Plan'
      ];

      // Validate data structure
      if (!data.retroCommissioning) {
        result.issues.push('Missing retro-commissioning data');
        result.status = 'fail';
        return result;
      }

      // Check section presence
      requiredSections.forEach(section => {
        if (!this.retroCommissioningComponent.hasSection(section)) {
          result.issues.push(`Missing section: ${section}`);
          result.status = 'fail';
        }
      });

      // Validate findings data
      if (data.retroCommissioning.findings) {
        const findings = data.retroCommissioning.findings;
        findings.forEach((finding: any) => {
          if (!finding.title || !finding.description || !finding.impact) {
            result.issues.push('Invalid finding data structure');
            result.status = 'fail';
          }
        });
      }

      // Validate recommendations data
      if (data.retroCommissioning.recommendations) {
        const recommendations = data.retroCommissioning.recommendations;
        recommendations.forEach((rec: any) => {
          if (!rec.name || !rec.status) {
            result.issues.push('Invalid recommendation data structure');
            result.status = 'fail';
          }
        });
      }

      // Validate team members data
      if (data.retroCommissioning.teamMembers) {
        const teamMembers = data.retroCommissioning.teamMembers;
        teamMembers.forEach((member: any) => {
          if (!member.name || !member.role || !member.organization) {
            result.issues.push('Invalid team member data structure');
            result.status = 'fail';
          }
        });
      }

    } catch (error) {
      result.issues.push(`Validation error: ${error.message}`);
      result.status = 'fail';
    }

    return result;
  }
} 
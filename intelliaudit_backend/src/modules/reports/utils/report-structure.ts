import { TableOfContentsSection } from '../components/table-of-contents.component';

/**
 * Provides the full structure of the energy audit report
 * with all sections and subsections
 */
export const FULL_REPORT_STRUCTURE: TableOfContentsSection[] = [
  {
    id: 'executiveSummary',
    title: 'Executive Summary',
    subsections: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'summaryTables', title: 'Summary Tables' },
      { id: 'performanceAnalysis', title: 'EEMs, WEMs & RCMs Performance Analysis Summary' },
      { id: 'financialAnalysis', title: 'EEM, WEM & RCM Financial Analysis Summary' },
      { id: 'nextSteps', title: 'Next Steps' }
    ]
  },
  {
    id: 'energyAudit',
    title: 'ASHRAE Level II Energy Audit Report',
    subsections: [
      { id: 'energyIntroduction', title: 'Introduction' },
      { id: 'energyProcedures', title: 'Energy Audit Procedures' },
      { id: 'energyCostSavings', title: 'EEMs Cost Savings Summary Table' },
      { id: 'energyExistingConditions', title: 'Existing Conditions and Observations' },
      { id: 'energyMeasuresRecommended', title: 'Energy Efficiency Measures Recommended' },
      { id: 'energyMeasuresImplemented', title: 'EEMs Already Implemented' },
      { id: 'energyMeasuresToConsider', title: 'EEMs to Consider' },
      { id: 'energyMeasuresRequiringInvestigation', title: 'EEMs Requiring Further Investigation' },
      { id: 'energyStarBenchmarking', title: 'Current ENERGY STAR® Benchmarking Test' },
      { id: 'energyUseAnalysis', title: 'Energy Use Analysis' }
    ]
  },
  {
    id: 'waterAudit',
    title: 'Water Audit Report',
    subsections: [
      { id: 'waterIntroduction', title: 'Introduction' },
      { id: 'waterProcedures', title: 'Water Audit Procedures' },
      { id: 'waterCostSavings', title: 'WEMs Cost Savings Summary Table' },
      { id: 'waterExistingConditions', title: 'Existing Conditions and Observations' },
      { id: 'waterMeasuresRecommended', title: 'Water Efficiency Measures Recommended' },
      { id: 'waterMeasuresImplemented', title: 'WEMs Already Implemented' },
      { id: 'waterUseAnalysis', title: 'Water Use Analysis' }
    ]
  },
  {
    id: 'retroCommissioning',
    title: 'Retro-commissioning Report',
    subsections: [
      { id: 'rcxIntroduction', title: 'Introduction' },
      { id: 'rcxObjectives', title: 'Objectives' },
      { id: 'rcxOverviewResults', title: 'Overview of Results' },
      { id: 'rcxCostSavings', title: 'RCMs Cost Savings Summary Table' },
      { id: 'rcxProjectSteps', title: 'Overview of Project Steps' },
      { id: 'rcxPlan', title: 'Retro-commissioning Plan' },
      { id: 'rcxFunctionalPerformance', title: 'Functional Performance Test Methodology' },
      { id: 'rcxAssessmentTeam', title: 'Assessment Team' },
      { id: 'rcxFunctionalTest', title: 'Functional Performance Test Results & Recommendations' },
      { id: 'rcxOperationalTraining', title: 'Operational Training' }
    ]
  },
  {
    id: 'appendices',
    title: 'Appendices',
    subsections: [
      { id: 'appendixAssumptions', title: 'Assumptions' },
      { id: 'appendixEquations', title: 'Equations' },
      { id: 'appendixSupportingDocs', title: 'Supporting Documents' },
      { id: 'appendixEFLH', title: 'Equivalent Full Load Hours (EFLH)' },
      { id: 'appendixOM', title: 'Additional O&M' },
      { id: 'appendixLADWP', title: 'LADWP Rebates' }
    ]
  }
]; 
// DTOs for Report Generation

// Base interface (optional, for structure)
export interface ReportComponentDataDto {}

// DTO for Energy Audit specific data
export class EnergyAuditDataDto {
  summary: any; // TODO: Replace 'any' with a specific EnergySummaryDto if available
  utilityData: any; // TODO: Replace 'any' with specific UtilityTableDto if available
  totalCost: number | null;
  totalUsage: any; // TODO: Replace 'any' with specific TotalUsageDto if available
  monthlyData: any; // TODO: Replace 'any' with specific MonthlyDataDto if available
}

// DTO for Water Audit specific data
export class WaterAuditDataDto {
  // Define properties based on what WaterAuditComponent expects
  totalUsage: any; // TODO: Define specific type
  monthlyData: any; // TODO: Define specific type
  measures: any[]; // TODO: Define specific type for measures
  existingConditions: any[]; // TODO: Define specific type
}

// DTO for Retro-Commissioning specific data
export class RetroCommissioningDataDto {
  // Define properties based on what RetroCommissioningComponent expects
  findings: any[]; // TODO: Define specific type
  recommendations: any[]; // TODO: Define specific type
  teamMembers: any[]; // TODO: Define specific type
}

// Measure interface
export interface Measure {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  benefits?: string[];
  estimatedSavings?: {
    energy?: number;
    water?: number;
    cost?: number;
    paybackPeriod?: number;
  };
  annualSavings?: number;
  costSavings?: number;
  implementationCost?: number | any; // Accept both number and Prisma Decimal
  incentives?: number | any; // Accept both number and Prisma Decimal
  paybackPeriod?: number;
  detailedCost?: {
    total: number;
    [key: string]: any;
  };
}

// Main DTO for data collected by getReportData
export class ReportDataDto {
  // Project data
  project?: any;

  // Report sections
  energyAudit: EnergyAuditDataDto;
  waterAudit: WaterAuditDataDto | null; // Allow null if data might be missing
  retroCommissioning: RetroCommissioningDataDto | null; // Allow null if data might be missing

  // Measures data
  measures?: Measure[];
  waterMeasures?: Measure[];
  recommendations?: Measure[];

  // Summary data
  potentialSavings?: number;
  energySummary?: any;
  totalCost?: any;
  totalUsage?: any;
  monthlyData?: any;

  // Financial analysis
  energySavings?: number;
  energyImplementationCost?: number;
  energyPayback?: number;
  waterSavings?: number;
  waterImplementationCost?: number;
  waterPayback?: number;
  rcxSavings?: number;
  rcxImplementationCost?: number;
  rcxPayback?: number;
  totalSavings?: number;
  totalImplementationCost?: number;
  totalPayback?: number;

  // Report metadata
  logoUrl?: string;
  reportDate?: string;
}
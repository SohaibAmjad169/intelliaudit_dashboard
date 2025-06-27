// Report data types for Energy Audit Reports

/**
 * Core data needed for the report header
 */
export interface ReportHeaderData {
  projectName: string;
  clientName: string;
  reportDate: string;
}

/**
 * Basic information about a facility being audited
 */
export interface FacilityInformationData {
  buildingName: string;
  buildingType: string;
  buildingAddress: string;
  buildingSize: number;
  yearBuilt: number;
  operatingHours: string;
  occupancy: number;
}

/**
 * Data for the cover page of a report
 */
export interface CoverPageData {
  projectName: string;
  projectAddress: string;
  projectCity?: string;
  projectState?: string;
  projectZip?: string;
  projectId: string;
  clientName: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  auditorCompany?: string;
  auditorAddress?: string;
  auditorEmail?: string;
  auditorPhone?: string;
  auditDate: string;
}

/**
 * Utility data for electricity
 */
export interface ElectricityData {
  month: string;
  usage: number; // kWh
  demand: number; // kW
  cost: number; // $
}

/**
 * Utility data for natural gas
 */
export interface NaturalGasData {
  month: string;
  usage: number; // therms
  cost: number; // $
}

/**
 * Utility data for water
 */
export interface WaterData {
  month: string;
  usage: number; // gallons
  cost: number; // $
}

/**
 * Utility summary data
 */
export interface UtilitySummaryData {
  electricityData: ElectricityData[];
  naturalGasData: NaturalGasData[];
  waterData: WaterData[];
}

/**
 * Energy use breakdown by category
 */
export interface EnergyUseBreakdown {
  category: string;
  percentage: number;
  annualUsage: number;
  annualCost: number;
}

/**
 * Equipment item data
 */
export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  installedYear?: number;
  capacity?: number;
  capacityUnit?: string;
  efficiency?: number;
  efficiencyUnit?: string;
  condition?: string;
  remainingLife?: number;
  replacementCost?: number;
  notes?: string;
}

/**
 * Conservation measure data
 */
export interface ConservationMeasure {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'energy' | 'water' | 'retro';
  implementationCost: number;
  annualSavings: number;
  paybackPeriod: number;
  roi: number;
  co2Reduction?: number;
  status: 'recommended' | 'in-progress' | 'completed' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  details?: string;
}

/**
 * Supporting image data
 */
export interface SupportingImage {
  id: string;
  url: string;
  caption: string;
  category: string;
  date?: string;
}

/**
 * Complete report data structure
 */
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
    electricity: ElectricityData[];
    naturalGas: NaturalGasData[];
    water: WaterData[];
  };
  endUseBreakdown?: EnergyUseBreakdown[];
  created_at: string;
  updated_at: string;
}

/**
 * Report section data
 */
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

/**
 * Report image data
 */
export interface ReportImage {
  id: string;
  caption: string;
  url: string;
  category: string;
}

/**
 * Format functions used throughout reports
 */
export interface FormatFunctions {
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
  formatPercent: (value?: number) => string;
} 
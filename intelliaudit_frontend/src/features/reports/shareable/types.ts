import { Project } from '@/types/project';

export interface EndUseBreakdownItem {
  category: string;
  percentage: number;
  color?: string;
  annualKwh?: number;
  annualCost?: number;
}

export interface EndUseBreakdownData {
  breakdown: EndUseBreakdownItem[];
  standardBreakdown: EndUseBreakdownItem[];
  comparisonData: {
    name: string;
    standard: number;
    actual: number;
  }[];
}

export interface ReportData {
  project: Project | null;
  endUseBreakdown: EndUseBreakdownData | null;
  totalCost: {
    total: number;
    electric: number;
    naturalGas: number;
    water: number;
  };
  totalUsage: {
    total: number;
    electric: number;
    naturalGas: number;
    water: number;
  };
  monthlyData: {
    electric: { month: number; usage: number; cost: number }[];
    naturalGas: { month: number; usage: number; cost: number }[];
    water: { month: number; usage: number; cost: number }[];
  };
  energyMeasures: any[];
  isLoading: boolean;
  error: string | null;
}

export interface EcoData {
  summary: string;
  observations: string[];
  recommendations: any[];
  hvacSystemDescription: string;
  lightingSystemDescription: string;
  buildingEnvelopeDescription: string;
  hvacEquipment: string[];
  lightingEquipment: string[];
  equipmentInventory: string[];
  buildingEnvelopeComponents: string[];
  weatherConditions: string;
  utilityDataDescription: string;
  utilitySummary: string[];
  occupancyScheduleDetails: string[];
  isLoading: boolean;
}

export interface FacilityInfo {
  type: string;
  size: string;
  purpose: string;
  notes: string;
  floors: number;
  total_units: number;
  unit_types: any[];
  location: string;
  inspectionDate: string;
} 
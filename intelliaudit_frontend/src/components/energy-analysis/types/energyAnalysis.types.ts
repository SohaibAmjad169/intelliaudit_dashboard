/**
 * Equipment item from field notes
 */
export interface EquipmentItem {
  id: string;
  equipment_type: string;
  category?: string;
  subcategory?: string;
  quantity: number;
  wattage?: number;
  capacity?: number | string;
  location?: string | { room?: string; floor?: string };
  manufacturer?: string;
  model?: string;
  is_per_unit?: boolean;
  annual_kwh?: number;
  annual_therms?: number; // Added annual_therms
  confidence?: number;
  source?: string;
  details?: Record<string, any>;
  end_use_category?: string;
  energy_source?: string;
  load_factor?: number;
  days_per_week?: number;
  annual_hours?: number;
  weekly_hours?: number; // Added weekly_hours for more granular input
  lamps_per_fixture?: number;
  multiplier?: number;
}

/**
 * Building information from field notes
 */
export interface BuildingInfo {
  totalUnits: number;
  unitTypes: {
    twoBedroom: number;
    oneBedroom: number;
    studio: number;
  };
  occupancyRate: number;
  buildingType: string;
  floors: number;
  squareFootage?: number;
  constructionYear?: number;
  location?: string;
}

/**
 * Energy use component (like lighting, cooling, etc.)
 */
export interface EndUseComponent {
  name: string;
  kWh: number;
  percentage: number;
  equipment?: string[];
}

/**
 * Category information for energy breakdown
 */
export interface EnergyCategory {
  kWh: number;
  percentage: number;
  adjustmentFactor: number;
}

/**
 * Energy breakdown totals
 */
export interface EnergyTotal {
  estimated: number;
  actual: number;
  difference: number;
  differencePercentage: number;
}

/**
 * Energy breakdown data
 */
export interface EnergyBreakdown {
  categories: Record<string, EnergyCategory>;
  total: EnergyTotal;
}

/**
 * Assumption source types
 */
export type AssumptionSource = 'measured' | 'estimated' | 'calculated';

/**
 * Assumption data
 */
export interface Assumption {
  value: string | number;
  source: AssumptionSource;
  description?: string;
}

/**
 * Complete energy analysis data
 */
export interface EnergyAnalysisData {
  projectId: string;
  projectName: string;
  buildingInfo: BuildingInfo;
  equipment: EquipmentItem[];
  energyBreakdown: EnergyBreakdown;
  assumptions: Record<string, Assumption>;
  lastUpdated: string;
}

/**
 * Combined energy use data interface
 */
export interface CombinedEndUseData {
  name: string;
  kWh: number | null;
  therms: number | null;
  kBtu: number | null;
}

/**
 * Conversion factors interface
 */
export interface ConversionFactors {
  kWhTokBtu: number;
  thermsTokBtu: number;
}

/**
 * Building data interface
 */
export interface BuildingData {
  grossFloorArea: number;
  floorAreaUnits: string;
}

/**
 * Historical billing data interface
 */
export interface HistoricalBillingData {
  kWh: number;
  therms: number;
}

/**
 * Enhanced energy breakdown data structure
 */
export interface EndUseComponentData {
  name: string;
  electricPercent: number;
  gasPercent: number;
  electricKwh: number | null;
  gasTherm: number | null;
}

export interface EnhancedTableData {
  name: string;
  electricKwh: number;
  gasTherm: number;
  electricPercent: number;
  gasPercent: number;
  standardElectricPercent?: number; // For baseline comparison
  standardGasPercent?: number;    // For baseline comparison
  electricCost: number;
  gasCost: number;
  kBtu: number;
} 
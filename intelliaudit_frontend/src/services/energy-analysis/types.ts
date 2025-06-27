export interface WeatherData {
  id: string;
  project_id: string;
  month: string;
  year: number;
  hdd: number;
  cdd: number;
}

export interface ConsumptionData {
  id: string;
  meter_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  usage: number;
  cost: number;
}

export interface EquipmentData {
  id: string;
  project_id: string;
  equipment_type: string;
  specifications: {
    capacity?: string;
    efficiency?: string;
    [key: string]: string | undefined;
  };
  condition: {
    overall: 'Good' | 'Fair' | 'Poor';
    estimatedAge?: string;
  };
}

export interface BuildingMetadata {
  id: string;
  project_id: string;
  building_sqft: number;
  year_built: number;
  building_type: string;
  num_floors: number;
  operating_hours: number;
}

export interface UtilityUsage {
  usageByType: {
    [key: string]: { total: number; units: string };
  };
  totalElectric: number;
  naturalGasInKWh: number;
  steamInKWh: number;
  waterUsage: number;
  totalEnergyUsage: number;
}

// Interface for end-use breakdown
export interface EndUseBreakdown {
  heating: number;
  cooling: number;
  ventilation: number;
  lighting: number;
  equipment: number;
  other: number;
  breakdown: Array<{
    category: string;
    annualKwh: number;
    annualCost: number;
    percentage: number;
  }>;
  modeledBreakdown: Array<{
    category: string;
    annualKwh: number;
    annualCost: number;
    percentage: number;
    isModeled: boolean;
  }>;
  // Standard benchmark breakdown data for comparison
  standardBreakdown?: Array<{
    category: string;
    percentage: number;
  }>;
  // Comparison data pairs for the table display
  comparisonData?: Array<{
    name: string;
    standard: number;
    actual: number;
  }>;
  totalAnnualKwh: number;
  totalModeledAnnualKwh: number;
  buildingType: string;
  recommendations: Array<{
    description: string;
    equipment: string;
    savingsKwh: number;
    savingsPercentage: number;
  }>;
} 
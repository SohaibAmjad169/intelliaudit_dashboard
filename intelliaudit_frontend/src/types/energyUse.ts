export enum EnergyCategory {
  LIGHTING = 'lighting',
  HVAC = 'hvac',
  PLUG_LOADS = 'plug_loads',
  WATER_HEATING = 'water_heating',
  PROCESS = 'process',
  OTHER = 'other'
}

export interface EnergyCalculation {
  formula: string;
  variables: {
    name: string;
    value: number;
    unit: string;
    isDefault?: boolean;
    defaultSource?: string;
  }[];
  result: number;
  assumptions?: string[];
}

export interface EnergyUseBreakdown {
  category: EnergyCategory;
  consumption: {
    value: number;
    unit: string;
  };
  percentage: number;
  calculations: EnergyCalculation[];
  equipment: {
    id: string;
    name: string;
    contribution: number;
  }[];
  flags?: {
    type: 'warning' | 'info';
    message: string;
    details?: string;
  }[];
}

export interface EnergyUseData {
  totalConsumption: {
    value: number;
    unit: string;
  };
  breakdown: EnergyUseBreakdown[];
  periodStart: string;
  periodEnd: string;
  utilityData?: {
    provider: string;
    rate: number;
    rateUnit: string;
  };
}

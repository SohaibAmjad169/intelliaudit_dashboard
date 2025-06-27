export interface EnergySummary {
  totalUsage: number;
  totalCost: number;
  averageCost: number;
  byMonth: Record<string, {
    usage: number;
    cost: number;
    hdd?: number;
    cdd?: number;
  }>;
  byYear: Record<number, {
    usage: number;
    cost: number;
    hdd?: number;
    cdd?: number;
  }>;
  byEnergyType: Record<string, {
    usage: number;
    cost: number;
  }>;
  weatherCorrelation: {
    hddCorrelation: number;
    cddCorrelation: number;
  };
}

export interface EnergyConsumption {
  year: number;
  month: number;
  energyType: string;
  usage: number;
  cost: number;
  hdd?: number;
  cdd?: number;
}

export interface WeatherData {
  year: number;
  month: number;
  hdd: number;
  cdd: number;
}

export interface EnergyData {
  consumption: EnergyConsumption[];
  weather: WeatherData[];
  summary: EnergySummary;
} 
// Energy unit conversion factors to MMBtu
export const ENERGY_CONVERSION_FACTORS = {
  electricity_kwh: 0.003412,
  natural_gas_therm: 0.1,
  propane_gallon: 0.091,
  fuel_oil_1_gallon: 0.139,
  fuel_oil_4_gallon: 0.15,
  coal_ton: 24.93,
  district_heat_mmbtu: 1,
  district_chilled_ton_hour: 0.012,
  wood_mmbtu: 1,
  district_steam_mmbtu: 1,
  kerosene_gallon: 0.135,
  other_mmbtu: 1
};

export interface EnergyConsumption {
  electricity_kwh?: number;
  natural_gas_therm?: number;
  propane_gallon?: number;
  fuel_oil_1_gallon?: number;
  fuel_oil_4_gallon?: number;
  coal_ton?: number;
  district_heat_mmbtu?: number;
  district_chilled_ton_hour?: number;
  wood_mmbtu?: number;
  district_steam_mmbtu?: number;
  kerosene_gallon?: number;
  other_mmbtu?: number;
}

export interface EnergyCosts {
  id: number;
  state: string;
  electricity_kwh: number;
  electricity_kbtu: number;
  natural_gas_therm: number;
  propane_gallon: number;
  fuel_oil_1_gallon: number;
  fuel_oil_4_gallon: number;
  coal_ton: number;
  district_heat_mmbtu: number;
  district_chilled_ton_hour: number;
  wood_mmbtu: number;
  district_steam_mmbtu: number;
  kerosene_gallon: number;
  other_mmbtu: number;
  created_at?: string;
  updated_at?: string;
}

export interface EnergyCostResult {
  energyType: string;
  displayName: string;
  consumption: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  mmbtuEquivalent: number;
}

// Convert energy consumption to MMBtu for comparison
export const convertToMMBtu = (consumption: EnergyConsumption): number => {
  let totalMMBtu = 0;
  
  for (const [key, value] of Object.entries(consumption)) {
    if (value && key in ENERGY_CONVERSION_FACTORS) {
      const conversionFactor = ENERGY_CONVERSION_FACTORS[key as keyof typeof ENERGY_CONVERSION_FACTORS];
      totalMMBtu += value * conversionFactor;
    }
  }
  
  return totalMMBtu;
};

// Calculate energy costs based on consumption and state-specific energy costs
export const calculateEnergyCosts = (
  consumption: EnergyConsumption,
  energyCosts: EnergyCosts
): EnergyCostResult[] => {
  const results: EnergyCostResult[] = [];
  
  // Map of energy types to display names
  const displayNames: Record<string, string> = {
    electricity_kwh: 'Electricity',
    natural_gas_therm: 'Natural Gas',
    propane_gallon: 'Propane',
    fuel_oil_1_gallon: 'Fuel Oil #1',
    fuel_oil_4_gallon: 'Fuel Oil #4',
    coal_ton: 'Coal',
    district_heat_mmbtu: 'District Heat',
    district_chilled_ton_hour: 'District Chilled Water',
    wood_mmbtu: 'Wood',
    district_steam_mmbtu: 'District Steam',
    kerosene_gallon: 'Kerosene',
    other_mmbtu: 'Other'
  };
  
  // Map of energy types to units
  const units: Record<string, string> = {
    electricity_kwh: 'kWh',
    natural_gas_therm: 'therm',
    propane_gallon: 'gallon',
    fuel_oil_1_gallon: 'gallon',
    fuel_oil_4_gallon: 'gallon',
    coal_ton: 'ton',
    district_heat_mmbtu: 'MMBtu',
    district_chilled_ton_hour: 'ton-hour',
    wood_mmbtu: 'MMBtu',
    district_steam_mmbtu: 'MMBtu',
    kerosene_gallon: 'gallon',
    other_mmbtu: 'MMBtu'
  };
  
  for (const [key, value] of Object.entries(consumption)) {
    if (value && key in energyCosts) {
      const costPerUnit = energyCosts[key as keyof EnergyCosts] as number;
      const totalCost = value * costPerUnit;
      const conversionFactor = ENERGY_CONVERSION_FACTORS[key as keyof typeof ENERGY_CONVERSION_FACTORS];
      const mmbtuEquivalent = value * conversionFactor;
      
      results.push({
        energyType: key,
        displayName: displayNames[key] || key,
        consumption: value,
        unit: units[key] || '',
        costPerUnit,
        totalCost,
        mmbtuEquivalent
      });
    }
  }
  
  return results;
};

// Calculate the total energy cost from all fuel types
export const calculateTotalEnergyCost = (costResults: EnergyCostResult[]): number => {
  return costResults.reduce((total, result) => total + result.totalCost, 0);
};

// Calculate the average cost per MMBtu
export const calculateAverageCostPerMMBtu = (costResults: EnergyCostResult[]): number => {
  const totalCost = calculateTotalEnergyCost(costResults);
  const totalMMBtu = costResults.reduce((total, result) => total + result.mmbtuEquivalent, 0);
  
  if (totalMMBtu === 0) return 0;
  
  return totalCost / totalMMBtu;
};

// Format currency values
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Format number values with specified decimal places
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

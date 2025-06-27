export { generateMeasureRecommendations, getPredefinedMeasures } from './measures-service';
export type { 
  WeatherData, 
  ConsumptionData, 
  EquipmentData,
  BuildingMetadata,
  UtilityUsage,
  EndUseBreakdown
} from './types';
export { 
  calculateWeatherNormalization,
  calculateEquipmentEfficiency,
  estimateEquipmentEnergyUse,
  fetchEnergyCostsByState,
  fetchNationalAverageEnergyCosts,
  analyzeEnergyPatterns,
  fetchMonthlyUtilityData,
  fetchTotalUtilityCost,
  fetchEndUseBreakdown
} from './utilities';

import { apiClient } from '@/services/common/api-client';

/**
 * Fetch total utility usage for a project
 */
export async function fetchTotalUtilityUsage(
  projectId: string
) {
  try {
    // Use the correct utility-calcs endpoint
    const data = await apiClient.get<any>(`utility-calcs/projects/${projectId}/total-usage`);
    
    // Transform the data to match the expected format
    const electricData = data.Electric || { total: 0, units: 'kWh' };
    const naturalGasData = data['Natural Gas'] || { total: 0, units: 'therms' };
    
    // Convert natural gas from therms to kWh (1 therm = 29.3 kWh)
    const naturalGasInKWh = naturalGasData.total * 29.3;
    
    return {
      usageByType: data,
      totalElectric: electricData.total,
      naturalGasInKWh,
      naturalGasUsage: naturalGasData.total, // Original value in therms
      waterUsage: data.Water?.total || 0,
      totalEnergyUsage: electricData.total + naturalGasInKWh
    };
  } catch (error) {
    console.error('Error fetching utility usage:', error);
    // Return fallback data if API call fails
    return {
      usageByType: {
        'Electric': { total: 0, units: 'kWh' },
        'Natural Gas': { total: 0, units: 'therms' }
      },
      totalElectric: 0,
      naturalGasInKWh: 0,
      naturalGasUsage: 0,
      waterUsage: 0,
      totalEnergyUsage: 0
    };
  }
}

/**
 * Fetch building metadata for a project
 */
export async function fetchBuildingMetadata(projectId: string) {
  if (!projectId) throw new Error('Project ID is required');

  try {
    const data = await apiClient.get<any>(`projects/${projectId}/metadata`);
    
    return {
      id: data.id,
      project_id: data.project_id,
      building_sqft: Number(data.building_sqft) || 0,
      year_built: Number(data.year_built) || 0,
      building_type: data.building_type || '',
      num_floors: Number(data.num_floors) || 1,
      operating_hours: Number(data.operating_hours) || 40
    };
  } catch (error) {
    console.error('Error fetching building metadata:', error);
    throw error;
  }
}

/**
 * Fetch weather data for a project
 */
export async function fetchWeatherData(projectId: string) {
  if (!projectId) throw new Error('Project ID is required');

  try {
    const data = await apiClient.get<any[]>(`projects/${projectId}/weather`);
    
    return data?.map((record: any) => ({
      ...record,
      hdd: Number(record.hdd) || 0,
      cdd: Number(record.cdd) || 0
    })) || [];
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

/**
 * Fetch consumption data for a project
 */
export async function fetchConsumptionData(projectId: string) {
  if (!projectId) throw new Error('Project ID is required');

  const AVG_ELECTRICITY_RATE = 0.18; // $0.18/kWh
  const AVG_GAS_RATE = 1.05; // $1.05/therm
  const KWH_TO_MMBTU = 0.003412; // 1 kWh = 0.003412 MMBtu
  const THERM_TO_MMBTU = 0.1; // 1 therm = 0.1 MMBtu

  try {
    // Fetch both electric and natural gas data from the correct endpoints
    const [electricData, gasData] = await Promise.all([
      apiClient.get<any[]>(`utility-calcs/projects/${projectId}/monthly/electric`),
      apiClient.get<any[]>(`utility-calcs/projects/${projectId}/monthly/natural-gas`)
    ]);

    // Process electric data
    const processedElectricData = (electricData || []).map(record => {
      const usage = Number(record.usage) || 0;
      const cost = record.cost ? Number(record.cost) : usage * AVG_ELECTRICITY_RATE;
      const startDateStr = record.start_date;
      const [year, month] = startDateStr.split('-').map(Number);
      
      return {
        month: month, // Already 1-based from the date string
        year: year,
        usage,
        totalCost: cost,
        avgCostPerUnit: usage > 0 ? cost / usage : AVG_ELECTRICITY_RATE,
        mmbtu: usage * KWH_TO_MMBTU,
        type: 'electric',
        hdd: record.hdd ? Number(record.hdd) : null,
        cdd: record.cdd ? Number(record.cdd) : null
      };
    });

    // Process gas data
    const processedGasData = (gasData || []).map(record => {
      const usage = Number(record.usage) || 0;
      const cost = record.cost ? Number(record.cost) : usage * AVG_GAS_RATE;
      const startDateStr = record.start_date;
      const [year, month] = startDateStr.split('-').map(Number);
      
      return {
        month: month, // Already 1-based from the date string
        year: year,
        usage,
        totalCost: cost,
        avgCostPerUnit: usage > 0 ? cost / usage : AVG_GAS_RATE,
        mmbtu: usage * THERM_TO_MMBTU,
        type: 'natural-gas',
        hdd: record.hdd ? Number(record.hdd) : null,
        cdd: record.cdd ? Number(record.cdd) : null
      };
    });

    // Combine and sort data by date
    const combinedData = [...processedElectricData, ...processedGasData]
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    return combinedData;
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    throw error;
  }
}

/**
 * Fetch equipment data for a project
 */
export async function fetchEquipmentData(projectId: string) {
  if (!projectId) throw new Error('Project ID is required');

  try {
    const data = await apiClient.get<any[]>(`projects/${projectId}/equipment`);
    
    return data?.map((record: any) => ({
      ...record,
      specifications: record.specifications || {},
      condition: record.condition || { overall: 'Fair' }
    })) || [];
  } catch (error) {
    console.error('Error fetching equipment data:', error);
    throw error;
  }
} 
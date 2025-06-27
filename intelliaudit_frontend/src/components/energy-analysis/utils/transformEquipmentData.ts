import { 
  CombinedEndUseData, 
  EnhancedTableData 
} from '../types/energyAnalysis.types';
import { STANDARD_END_USE_CATEGORIES } from '../services/energyAnalysis.service';

// Define the equipment item interface based on the API response
export interface EquipmentItem {
  id: string;
  equipment_type: string;
  category: string;
  subcategory?: string;
  end_use_category: string;
  annual_kwh: number | null;
  annual_therms: number | null;
  energy_source: string;
  quantity: number;
  unit_power?: number;
  hours_per_day?: number;
  days_per_week?: number;
  weeks_per_year?: number;
  efficiency?: number;
  custom_name?: string;
  // Add other fields as needed
}

// Constants for calculations
const ELECTRIC_RATE = 0.15; // $/kWh
const GAS_RATE = 1.20; // $/therm

/**
 * Transforms equipment data into end-use category data for charts
 */
export function transformEquipmentDataToEndUse(
  equipmentData: EquipmentItem[]
): CombinedEndUseData[] {
  if (!equipmentData || equipmentData.length === 0) {
    return [];
  }

  // Initialize categories with standard values
  const categoryMap = new Map<string, CombinedEndUseData>();
  
  // Initialize all standard categories with zero values
  STANDARD_END_USE_CATEGORIES.forEach(category => {
    categoryMap.set(category, {
      name: category,
      kWh: 0,
      therms: 0,
      kBtu: 0,
    });
  });

  // Process equipment data
  for (const item of equipmentData) {
    // Map the equipment's end-use category to a standard category
    let category = item.end_use_category;
    
    // If the category is not in our standard list, map to "Other"
    if (!STANDARD_END_USE_CATEGORIES.includes(category)) {
      category = 'Other';
    }

    const existing = categoryMap.get(category);
    if (existing) {
      // Add kWh if available
      if (item.annual_kwh) {
        existing.kWh = (existing.kWh || 0) + item.annual_kwh;
      }
      
      // Add therms if available
      if (item.annual_therms) {
        existing.therms = (existing.therms || 0) + item.annual_therms;
      }
      
      // Update kBtu value (3.412 kBtu per kWh, 100 kBtu per therm)
      existing.kBtu = (existing.kWh || 0) * 3.412 + (existing.therms || 0) * 100;
      
      categoryMap.set(category, existing);
    }
  }

  // Convert map back to array and filter out zero-usage categories unless all are zero
  const result = Array.from(categoryMap.values());
  
  // Check if all categories have zero usage
  const allZero = result.every(item => 
    (item.kWh === 0 || item.kWh === null) && 
    (item.therms === 0 || item.therms === null)
  );
  
  // If all are zero, return all categories; otherwise, filter out zero-usage ones
  return allZero 
    ? result 
    : result.filter(item => item.kWh !== 0 || item.therms !== 0);
}

/**
 * Transforms equipment data into enhanced table format with percentages and costs
 */
export function transformEquipmentDataToEnhancedTable(
  equipmentData: EquipmentItem[]
): EnhancedTableData[] {
  if (!equipmentData || equipmentData.length === 0) {
    return [];
  }

  const endUseData = transformEquipmentDataToEndUse(equipmentData);
  const { totalElectric, totalGas } = getEquipmentTotals(equipmentData);

  return endUseData.map(item => ({
    name: item.name,
    electricKwh: item.kWh || 0,
    gasTherm: item.therms || 0,
    electricPercent: totalElectric > 0 ? ((item.kWh || 0) / totalElectric) * 100 : 0,
    gasPercent: totalGas > 0 ? ((item.therms || 0) / totalGas) * 100 : 0,
    electricCost: (item.kWh || 0) * ELECTRIC_RATE,
    gasCost: (item.therms || 0) * GAS_RATE,
    kBtu: item.kBtu || 0
  }));
}

/**
 * Get total electric and gas usage from equipment data
 */
export function getEquipmentTotals(equipmentData: EquipmentItem[]) {
  let totalElectric = 0;
  let totalGas = 0;

  for (const item of equipmentData) {
    if (item.annual_kwh) {
      totalElectric += item.annual_kwh;
    }
    if (item.annual_therms) {
      totalGas += item.annual_therms;
    }
  }

  return { totalElectric, totalGas };
} 
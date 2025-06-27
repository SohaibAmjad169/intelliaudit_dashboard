import { EndUseComponentData } from '../types/energyAnalysis.types';
import { EnergyBreakdownResponse, STANDARD_END_USE_CATEGORIES } from '../services/energyAnalysis.service';

/**
 * Transforms API response data to the format expected by EnhancedEnergyBreakdownTable
 * @param data - The API response data
 * @returns Data formatted for the enhanced table view
 */
export function transformApiDataToEnhancedTable(data: EnergyBreakdownResponse): EndUseComponentData[] {
  if (!data || !data.endUseComponents) {
    return [];
  }

  // Create a map with all standard categories initialized to zero values
  const resultMap: Record<string, EndUseComponentData> = {};
  
  // Initialize all standard categories
  STANDARD_END_USE_CATEGORIES.forEach(category => {
    resultMap[category] = {
      name: category,
      electricPercent: 0,
      gasPercent: 0,
      electricKwh: 0,
      gasTherm: 0
    };
  });
  
  // Process the input data
  data.endUseComponents.forEach(component => {
    if (STANDARD_END_USE_CATEGORIES.includes(component.name)) {
      resultMap[component.name] = {
        name: component.name,
        electricPercent: component.electricPercent,
        gasPercent: component.gasPercent,
        electricKwh: component.electricKwh > 0 ? component.electricKwh : null,
        gasTherm: component.gasTherms > 0 ? component.gasTherms : null
      };
    } else {
      // For non-standard categories, add to "Other"
      const other = resultMap['Other'];
      
      resultMap['Other'] = {
        name: 'Other',
        electricPercent: other.electricPercent + component.electricPercent,
        gasPercent: other.gasPercent + component.gasPercent,
        electricKwh: ((other.electricKwh || 0) + component.electricKwh) || null,
        gasTherm: ((other.gasTherm || 0) + component.gasTherms) || null
      };
    }
  });
  
  // Convert map back to array
  return STANDARD_END_USE_CATEGORIES
    .map(category => resultMap[category])
    .filter(item => item !== undefined);
} 
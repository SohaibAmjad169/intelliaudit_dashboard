import axios from 'axios';
import { CombinedEndUseData } from '../types/energyAnalysis.types';

/**
 * Interface matching the backend energy breakdown response
 */
export interface EndUseComponentData {
  name: string;
  electricPercent: number;
  gasPercent: number;
  steamPercent: number;
  otherPercent: number;
  electricKwh: number;
  gasTherms: number;
  steamMMBtu: number;
  otherMMBtu: number;
  kBtu?: number; // Calculated field
  standardPercent?: number; // Standard percentage for multifamily buildings
  deviationExplanation?: string; // Explanation for deviation from standard
}

/**
 * Complete energy breakdown response structure
 */
export interface EnergyBreakdownResponse {
  endUseComponents: EndUseComponentData[];
  totalActualElectric: number;
  totalActualGas: number;
  totalActualSteam: number;
  totalActualOther: number;
  totalKbtu?: number; // Calculated field
}

// Conversion factors
export const CONVERSION_FACTORS = {
  kWhTokBtu: 3.412,
  thermsTokBtu: 100,
  mmBtuTokBtu: 1000
};

// Standard end-use categories in display order
export const STANDARD_END_USE_CATEGORIES = [
  'Lighting',
  'Refrigeration',
  'Heating',
  'Cooling',
  'Ventilation',
  'Water Heating',
  'Cooking',
  'Laundry',
  'Office Equipment',
  'Elevator',
  'Motors/Pumps',
  'Air Compressors',
  'Pool/Spa',
  'Process',
  'Other'
];

/**
 * Service for fetching and processing energy analysis data
 */
export const energyAnalysisService = {
  /**
   * Fetch energy breakdown from field-notes API
   * @param projectId - Project identifier
   * @returns Processed energy data ready for visualization
   */
  async getEnergyBreakdown(projectId: string): Promise<EnergyBreakdownResponse> {
    try {
      // Fetch energy breakdown from API
      const response = await axios.get(`/api/field-notes/${projectId}/energy-breakdown`);
      const breakdownData = response.data;

      console.log('Received energy breakdown:', breakdownData);

      // Calculate kBtu for each component
      const enhancedComponents = breakdownData.endUseComponents.map((component: EndUseComponentData) => ({
        ...component,
        kBtu: (component.electricKwh * CONVERSION_FACTORS.kWhTokBtu) +
              (component.gasTherms * CONVERSION_FACTORS.thermsTokBtu) +
              (component.steamMMBtu * CONVERSION_FACTORS.mmBtuTokBtu) +
              (component.otherMMBtu * CONVERSION_FACTORS.mmBtuTokBtu)
      }));

      // Calculate total kBtu
      const totalKbtu = (breakdownData.totalActualElectric * CONVERSION_FACTORS.kWhTokBtu) +
                        (breakdownData.totalActualGas * CONVERSION_FACTORS.thermsTokBtu) +
                        (breakdownData.totalActualSteam * CONVERSION_FACTORS.mmBtuTokBtu) +
                        (breakdownData.totalActualOther * CONVERSION_FACTORS.mmBtuTokBtu);

      return {
        ...breakdownData,
        endUseComponents: enhancedComponents,
        totalKbtu
      };
    } catch (error) {
      console.error('Error fetching energy breakdown:', error);
      throw error;
    }
  },

  /**
   * Format components data for chart visualization
   * @param data - Complete energy breakdown response
   * @returns Simplified data for charts
   */
  formatForCharts(data: EnergyBreakdownResponse): CombinedEndUseData[] {
    if (!data || !data.endUseComponents || !Array.isArray(data.endUseComponents)) {
      console.warn('Invalid or missing data structure in formatForCharts');
      return [];
    }

    // Create a map to store values for each category
    const categoryMap: Record<string, CombinedEndUseData> = {};

    // Initialize all standard categories with zero values
    STANDARD_END_USE_CATEGORIES.forEach(category => {
      categoryMap[category] = {
        name: category,
        kWh: 0,
        therms: 0,
        kBtu: 0
      };
    });

    // Process the actual data
    data.endUseComponents.forEach(component => {
      // Map component name to standard category if it exists
      const categoryName = component.name;

      if (STANDARD_END_USE_CATEGORIES.includes(categoryName)) {
        // For standard categories, update values
        categoryMap[categoryName].kWh = component.electricKwh > 0 ? component.electricKwh : 0;
        categoryMap[categoryName].therms = component.gasTherms > 0 ? component.gasTherms : 0;
        categoryMap[categoryName].kBtu = (component.electricKwh * CONVERSION_FACTORS.kWhTokBtu) +
                                        (component.gasTherms * CONVERSION_FACTORS.thermsTokBtu);
      } else {
        // For non-standard categories, add to "Other"
        categoryMap['Other'].kWh = (categoryMap['Other'].kWh || 0) + (component.electricKwh > 0 ? component.electricKwh : 0);
        categoryMap['Other'].therms = (categoryMap['Other'].therms || 0) + (component.gasTherms > 0 ? component.gasTherms : 0);
        categoryMap['Other'].kBtu = (categoryMap['Other'].kBtu || 0) +
                                   (component.electricKwh * CONVERSION_FACTORS.kWhTokBtu) +
                                   (component.gasTherms * CONVERSION_FACTORS.thermsTokBtu);
      }
    });

    // Convert map back to array and ensure null values where appropriate
    return STANDARD_END_USE_CATEGORIES.map(category => {
      const item = categoryMap[category];
      return {
        name: category,
        kWh: item.kWh > 0 ? item.kWh : null,
        therms: item.therms > 0 ? item.therms : null,
        kBtu: item.kBtu
      };
    });
  },

  /**
   * Filter components for specific energy types and remove zero values
   * @param data - Energy breakdown components
   * @param energyType - Type of energy to filter for ('electric', 'gas', or 'kBtu')
   * @returns Filtered components with non-zero values
   */
  filterComponentsForChart(data: EndUseComponentData[], energyType: 'electric' | 'gas' | 'kBtu'): EndUseComponentData[] {
    return data.filter(component => {
      switch (energyType) {
        case 'electric':
          return component.electricKwh > 0;
        case 'gas':
          return component.gasTherms > 0;
        case 'kBtu':
          return (component.kBtu || 0) > 0;
      }
    });
  },

  /**
   * Calculate percentages of total for combined view
   * @param data - Energy breakdown components with kBtu values
   * @param totalKbtu - Total kBtu for all components
   * @returns Components with percentage of total energy added
   */
  calculateCombinedPercentages(data: EndUseComponentData[], totalKbtu: number): Array<EndUseComponentData & { percentOfTotal: number }> {
    return data.map(component => ({
      ...component,
      percentOfTotal: totalKbtu > 0 ? Math.round(((component.kBtu || 0) / totalKbtu) * 100) : 0
    }));
  }
};
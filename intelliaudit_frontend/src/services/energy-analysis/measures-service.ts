// Import for API client
import { apiClient } from '../common/api-client';

// The following imports are kept for future implementation
// when the measures service will need to generate UUIDs and work with equipment items
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// This import is commented out but kept for future implementation
// import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// This import is commented out but kept for future implementation
// import { EquipmentItem } from '@/components/features/energy/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// These imports are commented out but kept for future implementation
// import { MEASURE_CATEGORIES, MeasureCategory } from './common-eems';

// Define measure interface
export interface Measure {
  id: string;
  title: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[];
  estimatedSavings?: {
    energy?: number;
    water?: number;
    cost?: number;
    paybackPeriod?: number;
    demand?: number;
    therms?: number;
    steam?: number;
  };
  supportingImages?: {
    existing?: string;
    replacement?: string;
  };
  photoReferences?: string[];
  implementationNotes?: string;
  calculationNotes?: string;
  implementationCost?: number;
  incentives?: number;
}

// Interface for the measures result
export interface MeasuresResult {
  eems: Measure[];
  wems: Measure[];
  rcms: Measure[];
  customMeasures: Measure[];
}

/**
 * Fetch existing measures for a project
 */
export async function fetchExistingMeasures(projectId: string): Promise<MeasuresResult> {
  try {
    // Call backend API to fetch existing measures
    const response = await apiClient.get<MeasuresResult>(`measures/${projectId}`);

    // Log the raw response payload from the API
    console.log('[MEASURES DEBUG] Raw payload from GET /measures/:projectId:', response);

    // Ensure we have a properly structured result
    const result: MeasuresResult = {
      eems: Array.isArray(response.eems) ? response.eems : [],
      wems: Array.isArray(response.wems) ? response.wems : [],
      rcms: Array.isArray(response.rcms) ? response.rcms : [],
      customMeasures: Array.isArray(response.customMeasures) ? response.customMeasures : []
    };

    console.log('Fetched existing measures from API:', result);
    return result;
  } catch (error) {
    console.error('Error fetching existing measures:', error);
    // Return empty arrays if there's an error
    return {
      eems: [],
      wems: [],
      rcms: [],
      customMeasures: []
    };
  }
}

/**
 * Generate measure recommendations based on equipment data
 */
export async function generateMeasureRecommendations(projectId: string): Promise<MeasuresResult> {
  try {
    console.log(`Calling measures/generate API for project ${projectId}`);

    // Call backend API to generate recommendations with projectId in the body
    const response = await apiClient.post<MeasuresResult>(`measures/generate`, {
      projectId
    });

    console.log('Raw API response:', response);

    // Ensure we have a properly structured result
    const result: MeasuresResult = {
      eems: Array.isArray(response.eems) ? response.eems : [],
      wems: Array.isArray(response.wems) ? response.wems : [],
      rcms: Array.isArray(response.rcms) ? response.rcms : [],
      customMeasures: Array.isArray(response.customMeasures) ? response.customMeasures : []
    };

    console.log('Processed measures from API:', result);

    // Check if we have any measures
    const totalMeasures = result.eems.length + result.wems.length + result.rcms.length + result.customMeasures.length;

    if (totalMeasures === 0) {
      console.warn('No measures were generated from the API response');
    } else {
      console.log(`Successfully received ${totalMeasures} measures from API`);
    }

    // Return the generated measures
    return result;
  } catch (error) {
    console.error('Error generating measures:', error);

    // Log more detailed error information
    if (error.response) {
      console.error('Response error data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('Request made but no response received');
    } else {
      console.error('Error message:', error.message);
    }

    // Throw the error to be handled by the component
    throw error;
  }
}

/**
 * Force regeneration of measure recommendations
 */
export async function regenerateMeasureRecommendations(projectId: string): Promise<MeasuresResult> {
  try {
    console.log(`Regenerating measures for project ${projectId}`);

    // Call backend API to regenerate recommendations
    const response = await apiClient.post<MeasuresResult>(`measures/${projectId}/regenerate`, {
      model: 'o1'
    });

    // Ensure we have a properly structured result
    const result: MeasuresResult = {
      eems: Array.isArray(response.eems) ? response.eems : [],
      wems: Array.isArray(response.wems) ? response.wems : [],
      rcms: Array.isArray(response.rcms) ? response.rcms : [],
      customMeasures: Array.isArray(response.customMeasures) ? response.customMeasures : []
    };

    console.log('Received regenerated measures from API:', result);

    // Return the regenerated measures
    return result;
  } catch (error) {
    console.error('Error regenerating measures:', error);
    throw error;
  }
}

// Function to get all available predefined measures
export function getPredefinedMeasures(): { eems: Measure[]; wems: Measure[]; rcms: Measure[] } {
  return {
    eems: [
      {
        id: 'eem-1',
        title: 'LED Lighting Upgrade',
        existingCondition: 'Facility uses inefficient fluorescent or incandescent lighting fixtures.',
        recommendation: 'Replace existing lighting with energy-efficient LED fixtures throughout the facility.',
        benefits: [
          'Reduces energy consumption by 30-50% compared to fluorescent lighting',
          'Longer lifetime (50,000+ hours vs 10,000 hours for fluorescent)',
          'Improved light quality and reduced maintenance costs',
          'No mercury or hazardous materials',
        ],
        estimatedSavings: {
          energy: 25000,
          cost: 3500,
          paybackPeriod: 2.5
        }
      },
      {
        id: 'eem-2',
        title: 'HVAC Optimization',
        existingCondition: 'HVAC system is operating inefficiently with minimal controls and scheduling.',
        recommendation: 'Implement advanced HVAC controls, optimize schedules, and add variable frequency drives (VFDs) to air handling units.',
        benefits: [
          'Reduces unnecessary runtime during unoccupied periods',
          'Optimizes fan and pump speeds based on actual load',
          'Improves occupant comfort with better temperature control',
          'Extends equipment life by reducing wear and tear'
        ],
        estimatedSavings: {
          energy: 35000,
          cost: 4200,
          paybackPeriod: 1.8
        }
      }
    ],
    wems: [
      {
        id: 'wem-1',
        title: 'Low-Flow Fixtures',
        existingCondition: 'Standard flow rate fixtures in restrooms and kitchen areas.',
        recommendation: 'Install low-flow faucets, toilets, and showerheads throughout the facility.',
        benefits: [
          'Reduces water consumption by up to 30%',
          'Lower water utility bills',
          'Minimal impact on user experience',
          'Helps achieve water conservation goals'
        ],
        estimatedSavings: {
          water: 150000,
          cost: 2800,
          paybackPeriod: 1.2
        }
      }
    ],
    rcms: [
      {
        id: 'rcm-1',
        title: 'Rooftop Solar PV System',
        existingCondition: 'Facility relies entirely on grid electricity with high roof exposure to sunlight.',
        recommendation: 'Install a rooftop solar photovoltaic system sized appropriately for the facility\'s available roof space and electrical load.',
        benefits: [
          'Generates clean, renewable electricity onsite',
          'Reduces reliance on grid electricity and exposure to rate increases',
          'Lowers carbon footprint and demonstrates environmental leadership',
          'May qualify for tax incentives, rebates, and accelerated depreciation'
        ],
        estimatedSavings: {
          energy: 75000,
          cost: 12000,
          paybackPeriod: 6.5
        }
      }
    ]
  };
}

// Function to get a specific measure by ID
export function getMeasureById(id: string): Measure | undefined {
  const predefinedMeasures = getPredefinedMeasures();
  const allMeasures = [
    ...predefinedMeasures.eems,
    ...predefinedMeasures.wems,
    ...predefinedMeasures.rcms
  ];

  return allMeasures.find(m => m.id === id);
}

// Function to get all measure categories
export function getAllMeasureCategories(): { id: string; name: string; description: string; measures: Measure[] }[] {
  const predefinedMeasures = getPredefinedMeasures();

  return [
    {
      id: 'eem',
      name: 'Energy Efficiency Measures',
      description: 'Improvements that reduce energy consumption',
      measures: predefinedMeasures.eems
    },
    {
      id: 'wem',
      name: 'Water Efficiency Measures',
      description: 'Improvements that reduce water consumption',
      measures: predefinedMeasures.wems
    },
    {
      id: 'rcm',
      name: 'Renewable/Clean Measures',
      description: 'Improvements that enhance sustainability',
      measures: predefinedMeasures.rcms
    }
  ];
}

/**
 * Debug function to get raw ECM data from Supabase
 * This is a helper function for debugging purposes only
 */
export async function debugEcmStorage(projectId: string): Promise<any> {
  try {
    console.log(`Debugging ECM storage for project ${projectId}`);

    // Call the debug endpoint
    const response = await apiClient.get(`measures/${projectId}/debug`);

    console.log('Debug response:', response);
    return response;
  } catch (error) {
    console.error('Error debugging ECM storage:', error);
    throw error;
  }
}
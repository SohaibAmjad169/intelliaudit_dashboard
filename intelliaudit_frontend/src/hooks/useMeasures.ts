import { useState, useEffect } from 'react';
import { fetchExistingMeasures, Measure } from '@/services/energy-analysis/measures-service';

// Define measure types based on ASHRAE Level 2 audit requirements
export interface MeasureSavings {
  cost?: number;
  energy?: number;
  demand?: number;
  therms?: number;
  water?: number;
  steam?: number;
  paybackPeriod?: number;
  roi?: number;
  npv?: number;
  irr?: number;
  mirr?: number;
  co2Reduction?: number;
}

export interface MeasureCost {
  materials?: number;
  labor?: number;
  engineering?: number;
  commissioning?: number;
  total: number;
  incentives?: number;
  netCost?: number;
}

export interface SupportingImages {
  existing?: string;
  replacement?: string;
  diagram?: string;
}

export interface MeasureImplementation {
  steps?: string[];
  timeline?: string;
  requirements?: string[];
  permits?: string[];
  disruption?: string;
  maintenanceImpact?: string;
}

export interface DetailedMeasure extends Measure {
  measureType: 'eem' | 'wem' | 'rcm' | 'custom';
  category?: string;
  subcategory?: string;
  priority?: 'high' | 'medium' | 'low';
  
  // Additional existing condition details
  existingEfficiency?: string;
  existingCapacity?: string;
  existingAge?: number;
  existingRemainingLife?: number;
  
  // Additional recommendation details
  recommendedEfficiency?: string;
  recommendedCapacity?: string;
  
  // Detailed financial analysis
  detailedCost?: MeasureCost;
  
  // Technical details
  equipmentDetails?: Record<string, any>;
  technicalSpecifications?: string[];
  calculationMethodology?: string;
  assumptionsUsed?: string[];
  
  // Implementation details
  implementation?: MeasureImplementation;
  
  // Alternative options
  alternatives?: {
    title: string;
    description: string;
    cost?: number;
    savings?: MeasureSavings;
  }[];
  
  // Codes and standards
  applicableCodes?: string[];
  rebatePrograms?: string[];
  
  // Misc
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface MeasuresData {
  eems: DetailedMeasure[];
  wems: DetailedMeasure[];
  rcms: DetailedMeasure[];
  customMeasures: DetailedMeasure[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch energy conservation measures for a project
 * Optimized for ASHRAE Level 2 audit detail requirements
 */
export function useMeasures(projectId: string): MeasuresData {
  const [measuresData, setMeasuresData] = useState<MeasuresData>({
    eems: [],
    wems: [],
    rcms: [],
    customMeasures: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchMeasures = async () => {
      try {
        console.log(`Fetching measures for project: ${projectId}`);
        
        // Reset loading state
        setMeasuresData(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }));
        
        // Fetch measures from the database
        const result = await fetchExistingMeasures(projectId);
        
        // Transform measures to ensure they match our detailed interface
        const transformedData = {
          eems: (result.eems || []).map(m => ({
            ...m,
            measureType: 'eem' as const,
            // Fill in any missing properties with defaults
            estimatedSavings: m.estimatedSavings || {}
          })),
          wems: (result.wems || []).map(m => ({
            ...m,
            measureType: 'wem' as const,
            estimatedSavings: m.estimatedSavings || {}
          })),
          rcms: (result.rcms || []).map(m => ({
            ...m, 
            measureType: 'rcm' as const,
            estimatedSavings: m.estimatedSavings || {}
          })),
          customMeasures: (result.customMeasures || []).map(m => ({
            ...m,
            measureType: 'custom' as const,
            estimatedSavings: m.estimatedSavings || {}
          })),
          isLoading: false,
          error: null
        };
        
        console.log('Transformed measure data:', transformedData);
        setMeasuresData(transformedData);
      } catch (error) {
        console.error('Error fetching measures in hook:', error);
        setMeasuresData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch measures'
        }));
      }
    };

    if (projectId) {
      fetchMeasures();
    } else {
      setMeasuresData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Project ID is required'
      }));
    }
  }, [projectId]);

  return measuresData;
} 
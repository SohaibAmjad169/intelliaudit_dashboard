/**
 * Report Mappers
 * Utility functions for mapping data for reports
 */

import { 
  ConservationMeasure, 
  MeasureCost 
} from '@/types/conservation-measures';

/**
 * Map raw measure data to conservation measure objects
 */
export function mapToConservationMeasures(measures: any[]): ConservationMeasure[] {
  if (!measures || !Array.isArray(measures)) return [];
  
  return measures.map(measure => ({
    id: measure.id,
    name: measure.name || 'Unnamed Measure',
    description: measure.description || '',
    category: measure.category || 'Other',
    savings: {
      energy: measure.energy_savings || 0,
      cost: measure.cost_savings || 0,
      carbon: measure.carbon_savings || 0,
      water: measure.water_savings || 0,
    },
    implementation: {
      cost: measure.implementation_cost || 0,
      difficulty: measure.difficulty || 'medium',
      timeframe: measure.timeframe || 'medium',
    },
    payback: measure.payback || 0,
    roi: measure.roi || 0,
    status: measure.status || 'proposed',
    priority: measure.priority || 'medium',
    applicableEquipment: measure.applicable_equipment || [],
    notes: measure.notes || '',
  }));
}

/**
 * Calculate total implementation costs
 */
export function calculateTotalImplementationCost(measures: ConservationMeasure[]): MeasureCost {
  return measures.reduce((total, measure) => {
    return total + (measure.implementation?.cost || 0);
  }, 0);
}

/**
 * Calculate total annual savings
 */
export function calculateTotalAnnualSavings(measures: ConservationMeasure[]): MeasureCost {
  return measures.reduce((total, measure) => {
    return total + (measure.savings?.cost || 0);
  }, 0);
}

/**
 * Calculate simple payback period
 */
export function calculateSimplePayback(implementationCost: number, annualSavings: number): number {
  if (!annualSavings || annualSavings === 0) return 0;
  return implementationCost / annualSavings;
}

/**
 * Calculate return on investment (ROI)
 */
export function calculateROI(implementationCost: number, annualSavings: number, years: number = 5): number {
  if (!implementationCost || implementationCost === 0) return 0;
  return (annualSavings * years - implementationCost) / implementationCost * 100;
}

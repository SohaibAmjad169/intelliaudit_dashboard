/**
 * Type definitions for Conservation Measures (ECMs)
 */

// Cost type for monetary values
export type MeasureCost = number;

// Measure difficulty levels
export type MeasureDifficulty = 'low' | 'medium' | 'high';

// Measure timeframe categories
export type MeasureTimeframe = 'immediate' | 'short' | 'medium' | 'long';

// Measure status options
export type MeasureStatus = 'proposed' | 'approved' | 'in-progress' | 'completed' | 'rejected';

// Measure priority levels
export type MeasurePriority = 'low' | 'medium' | 'high';

// Measure category types
export type MeasureCategory = 'lighting' | 'hvac' | 'water' | 'envelope' | 'controls' | 'other';

// Interface for measure savings
export interface MeasureSavings {
  energy: number;      // kWh per year
  cost: MeasureCost;   // $ per year
  carbon: number;      // kg CO2e per year
  water?: number;      // gallons per year
}

// Interface for measure implementation details
export interface MeasureImplementation {
  cost: MeasureCost;
  difficulty: MeasureDifficulty;
  timeframe: MeasureTimeframe;
  estimatedHours?: number;
}

// Main interface for conservation measures
export interface ConservationMeasure {
  id: string;
  name: string;
  description: string;
  category: MeasureCategory | string;
  savings: MeasureSavings;
  implementation: MeasureImplementation;
  payback: number;               // Simple payback in years
  roi: number;                   // Return on investment percentage
  status: MeasureStatus;
  priority: MeasurePriority;
  applicableEquipment?: string[];
  notes?: string;
}

// Interface for measure financial analysis
export interface MeasureFinancialAnalysis {
  totalImplementationCost: MeasureCost;
  totalAnnualSavings: MeasureCost;
  simplePayback: number;
  averageROI: number;
  npv?: number;      // Net Present Value
  irr?: number;      // Internal Rate of Return
}

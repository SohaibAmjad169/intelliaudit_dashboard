/**
 * Equipment Processing Types
 * Centralized type definitions for equipment processing functionality
 *
 * This file replaces the original types from:
 * @/features/projects/phases/site-assessment/processing/types
 */

// Equipment categories
export type EquipmentCategory = 
  | 'lighting' 
  | 'hvac' 
  | 'appliance' 
  | 'water_heating' 
  | 'electronics' 
  | 'other';

// Field types for assumptions
export type AssumptionField = 
  | 'wattage' 
  | 'quantity' 
  | 'hours' 
  | 'operating_hours' 
  | 'efficiency';

// Location type for equipment
export interface EquipmentLocation {
  id?: string;
  name: string;
  type?: string;
  floor?: number | string;
  unit_number?: string;
  notes?: string;
  room?: string;
  building?: string;
  address?: string;
  businessType?: string;
  businessName?: string;
}

// Base equipment item interface
export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  quantity: number;
  location: string | EquipmentLocation;
  wattage: number;
  operating_hours?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Processed equipment with analysis data
export interface ProcessedEquipment extends EquipmentItem {
  annual_kwh: number;
  annual_cost: number;
  photo_url?: string;
  thumbnail_url?: string;
  photo_filename?: string;
  photos?: string[];
  specifications?: Record<string, any>;
  source?: string;
  details?: EquipmentDetails;
  is_merged?: boolean;
  weeklyHours?: number;
  operatingHours?: number;
  type?: string;
  flags?: ProcessingFlag[];
  confidence?: number;
}

// Original interfaces from site-assessment/processing/types.ts

// Processing flag interface used in various parts of the application
export interface ProcessingFlag {
  type: string;
  message: string;
  severity: string;
  field: string;
  suggestion?: string;
}

// Equipment details interface
export interface EquipmentDetails {
  id?: string;
  wattage?: number;
  operatingHours?: number;
  make?: string;
  model?: string;
  efficiency?: string;
  serialNumber?: string;
  condition?: string | { overall: 'Good' | 'Fair' | 'Poor', visibleIssues?: any[] };
  notes?: string;
  flowRate?: string;
  flowRateUnit?: string;
  lampCount?: number;
  lampWattage?: number;
  lampLength?: string;
  lampType?: string;
  capacity?: string;
  age?: string;
  status?: 'success' | 'partial' | 'error';
  assumptions?: Record<string, any>;
}

// Processing result interface for site assessment
export interface ProcessingResult {
  id?: string;
  equipment?: any[];
  flags?: ProcessingFlag[];
  assumptions?: Record<string, any>;
  energyUse?: Record<string, any>;
  status: 'success' | 'partial' | 'error';
  message?: string;
  wattage?: number;
  operatingHours?: number;
  make?: string;
  model?: string;
  efficiency?: string;
  serialNumber?: string;
  condition?: string | { overall: 'Good' | 'Fair' | 'Poor' | string, visibleIssues?: any[] };
  notes?: string;
  flowRate?: string;
  flowRateUnit?: string;
  lampCount?: number;
  lampWattage?: number;
  lampLength?: string;
  lampType?: string;
  capacity?: string;
  age?: string;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
}

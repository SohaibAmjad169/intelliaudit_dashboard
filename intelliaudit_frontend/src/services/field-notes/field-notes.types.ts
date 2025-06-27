/**
 * Types for the field-notes service
 */

/**
 * Field notes processing request parameters
 */
export interface FieldNotesProcessRequest {
  notes: string;
  projectId: string;
}

/**
 * Equipment item from field notes
 */
export interface FieldNotesEquipmentItem {
  id: string;
  equipment_type: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  location_type?: string;
  quantity?: number;
  wattage?: number;
  capacity?: string | number;
  annual_kwh?: number;
  annual_hours?: number;
  energy_source?: string;
  source_type: string;
  end_use_category?: string;
  confidence?: number;
  assumptions?: string[];
  recommendations?: string;
}

/**
 * Processing flag with severity and message
 */
export interface ProcessingFlag {
  type: 'info' | 'warning' | 'error';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'error';
  details?: string;
}

/**
 * Metadata about processing operation
 */
export interface ProcessingMetadata {
  processedAt: string;
  processingTimeMs: number;
  confidence: number;
  model?: string;
}

/**
 * Building information extracted from field notes
 */
export interface BuildingInfo {
  buildingType?: string;
  squareFootage?: number;
  numberOfUnits?: number;
  yearBuilt?: number;
  occupancy?: string;
  operatingHours?: number;
}

/**
 * End use component for energy breakdown
 */
export interface EndUseComponent {
  name: string;
  electricPercent: number;
  gasPercent: number;
  steamPercent: number;
  otherPercent: number;
  electricKwh: number;
  gasTherms: number;
  steamMMBtu: number;
  otherMMBtu: number;
  standardPercent?: number;
  deviationExplanation?: string;
}

/**
 * Energy breakdown by end use
 */
export interface EnergyBreakdown {
  endUseComponents: EndUseComponent[];
  totalActualElectric: number;
  totalActualGas: number;
  totalActualSteam: number;
  totalActualOther: number;
  noUtilityDataAvailable?: boolean;
}

/**
 * Complete field notes processing result
 */
export interface FieldNotesProcessResult {
  equipment: FieldNotesEquipmentItem[];
  flags: ProcessingFlag[];
  metadata: ProcessingMetadata;
  building_info?: BuildingInfo;
  energy_breakdown?: EnergyBreakdown;
}

/**
 * Response for getting field notes data
 */
export interface GetFieldNotesResponse {
  raw_notes?: string;
  equipment: FieldNotesEquipmentItem[];
  building_info?: BuildingInfo;
  energy_breakdown?: EnergyBreakdown;
}
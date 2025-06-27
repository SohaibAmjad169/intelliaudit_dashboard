/**
 * Types for equipment processing
 * Moved from the original phases architecture
 */

export interface ProcessedEquipment {
  id: string;
  equipment_type?: string;
  make?: string;
  model?: string;
  location?: string | { room?: string; floor?: string };
  wattage?: number;
  quantity?: number;
  condition?: string;
  notes?: string;
  category?: string;
  confidence?: number;
  annual_kwh?: number;
  source?: string;
}

export interface EquipmentDetails {
  id: string;
  type: string;
  make?: string;
  model?: string;
  location?: string | { room?: string; floor?: string };
  quantity?: number;
  condition?: string;
  notes?: string;
  verified?: boolean;
  createdAt?: string;
  photo_url?: string;
  confidence?: number;
}

export interface ProcessingFlag {
  type: 'info' | 'warning' | 'error' | string;
  message: string;
  severity: string;
  field?: string;
}

export interface ProcessingResult {
  equipment: ProcessedEquipment[];
  flags: ProcessingFlag[];
  metadata?: {
    processedAt?: string;
    processingTimeMs?: number;
    confidence?: number;
    [key: string]: any;
  };
}

export interface EquipmentCategory {
  id: string;
  name: string;
  description?: string;
}

export interface AssumptionField {
  id: string;
  name: string;
  value: string | number;
  description?: string;
} 
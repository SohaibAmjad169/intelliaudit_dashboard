export interface EnrichedEquipment {
  id?: string;
  project_id: string;
  source_type: 'field_notes' | 'photo_analysis' | 'enriched' | 'equipment_analysis';
  original_field_notes_id: string | null;
  original_photo_analysis_id: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  equipment_type: string | null;
  category: string | null;
  specifications: {
    capacity?: string | null;
    efficiency?: {
      cooling?: string | null;
      heating?: string | null;
    } | string | null;
    refrigerantType?: string | null;
    voltage?: string | null;
    phase?: string | null;
    wattage?: number | null;
    fuelType?: string | null;
    [key: string]: any;
  } | null;
  condition: {
    overall: 'Good' | 'Fair' | 'Poor' | null;
    visibleIssues: string[];
    estimatedAge?: string | null;
    remainingLife?: string | null;
  } | null;
  location: string | null;
  quantity: number | null;
  control_strategy: string | null;
  operating_hours: number | null;
  annual_kwh: number | null;
  energy_cost: number | null;
  photo_url: string | null;
  thumbnail_url: string | null;
  photos: Array<{
    url: string;
    thumbnail_url?: string | null;
    is_ai_analyzed?: boolean;
    confidence?: number | null;
    filename?: string | null;
    description?: string | null;
    [key: string]: any;
  }>;
  confidence: number | null;
  notes: string | null;
  maintenance_notes: string | null;
  ecm: {
    measure?: string | null;
    replacementEfficiency?: string | null;
    cost?: string | null;
    annualEnergySavings?: string | null;
    annualCostSavings?: string | null;
    paybackPeriod?: string | null;
  } | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  ai_model: string | null;
  is_merged: boolean;
} 
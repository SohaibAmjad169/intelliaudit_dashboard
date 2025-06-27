export interface EquipmentAnalysis {
  id: string;
  project_id: string;
  photo_filename: string;
  photo_url: string;
  thumbnail_url: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  equipment_type?: string;
  make?: string;
  specifications: {
    capacity?: string;
    efficiency?: string;
    refrigerantType?: string;
    voltage?: string;
    phase?: string;
    [key: string]: string | undefined;
  };
  condition: {
    overall: 'Good' | 'Fair' | 'Poor';
    visibleIssues: string[];
    estimatedAge?: string;
  };
  confidence: number;
  notes: string;
  created_at: string;
  updated_at: string;
  ai_model?: 'o1' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
}

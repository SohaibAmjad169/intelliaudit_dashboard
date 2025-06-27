export interface SitePhoto {
  [x: string]: string | Record<string, any> | object | boolean | number | Array<any>;
  location: any;
  notes: string;
  id: string;
  project_id: string;
  photo_url: string;
  thumbnail_url?: string;
  equipment_type?: string;
  category?: string;
  source: 'upload' | 'field_notes';
  created_at: string;
  metadata?: Record<string, any>;
  analysis_results?: {
    equipment_detected: boolean;
    confidence: number;
    detected_objects?: Array<{
      label: string;
      confidence: number;
      bbox?: [number, number, number, number];
    }>;
  };
}

export interface PhotosState {
  photos: SitePhoto[];
  loading: boolean;
  error: Error | null;
  selectedPhoto: SitePhoto | null;
  selectedCategory: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  photo: SitePhoto;
  message?: string;
}

export interface PhotoAnalysisResponse {
  success: boolean;
  analysis_results: SitePhoto['analysis_results'];
  message?: string;
}

export interface PhotoCategory {
  id: string;
  name: string;
  count: number;
} 
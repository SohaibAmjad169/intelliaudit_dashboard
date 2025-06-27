import { apiClient } from '../common/api-client';

/**
 * Types for photo metadata API requests/responses
 */
export interface CreateBatchJobRequest {
  projectId: string;
  totalPhotos: number;
  equipmentType?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface PhotoBatchJob {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  total_photos: number;
  processed_photos: number;
  equipment_type?: string;
  priority: string;
}

export interface PhotoMetadataResult {
  id: string;
  batch_id: string;
  photo_id?: string;
  photo_url?: string;
  equipment_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
  efficiency?: string;
  efficiency_unit?: string;
  year?: string;
  condition?: string;
  confidence?: number;
  processing_time?: number;
  extracted_at: string;
  is_applied: boolean;
  applied_to_equipment_id?: string;
  suggested_matches?: SuggestedMatch[];
}

export interface SuggestedMatch {
  equipmentId: string;
  matchScore: number;
  reasoning: string;
}

export interface SaveMetadataResultRequest {
  batchId: string;
  photoId?: string;
  photoUrl?: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  efficiency?: string;
  efficiencyUnit?: string;
  year?: string;
  condition?: string;
  confidence?: number;
  processingTime?: number;
}

export interface ApplyMetadataRequest {
  metadataResultId: string;
  equipmentId: string;
}

export interface PhotoToProcess {
  id: string;
  url?: string;
  name?: string;
  file?: File;
}

export interface ProcessPhotosRequest {
  batchId: string;
  photos: PhotoToProcess[];
}

export interface ProcessPhotosResponse {
  success: boolean;
  processed: number;
  total: number;
}

export interface ApplyMetadataBatchRequest {
  projectId: string;
  matches: Array<{
    metadataResultId: string;
    equipmentId: string;
  }>;
}

/**
 * Service for interacting with the photo metadata extraction API
 */
export const photoMetadataService = {
  /**
   * Create a new batch job for processing photos
   */
  async createBatchJob(data: CreateBatchJobRequest): Promise<PhotoBatchJob> {
    return apiClient.post<PhotoBatchJob>('photo-metadata/batch-jobs', data);
  },

  /**
   * Get a batch job by ID
   */
  async getBatchJob(batchId: string): Promise<PhotoBatchJob> {
    return apiClient.get<PhotoBatchJob>(`photo-metadata/batch-jobs/${batchId}`);
  },

  /**
   * List all batch jobs for a project
   */
  async listBatchJobs(projectId: string): Promise<PhotoBatchJob[]> {
    return apiClient.get<PhotoBatchJob[]>('photo-metadata/batch-jobs', { projectId });
  },

  /**
   * Save metadata extraction result
   */
  async saveMetadataResult(data: SaveMetadataResultRequest): Promise<PhotoMetadataResult> {
    return apiClient.post<PhotoMetadataResult>('photo-metadata/results', data);
  },

  /**
   * Get all metadata results for a batch
   */
  async getBatchResults(batchId: string): Promise<PhotoMetadataResult[]> {
    return apiClient.get<PhotoMetadataResult[]>('photo-metadata/results', { batchId });
  },

  /**
   * Apply metadata to equipment
   */
  async applyMetadataToEquipment(data: ApplyMetadataRequest): Promise<any> {
    return apiClient.post<any>('photo-metadata/apply', data);
  },

  /**
   * Process photos for metadata extraction
   */
  async processPhotos(data: ProcessPhotosRequest): Promise<ProcessPhotosResponse> {
    const formData = new FormData();
    
    // Add batch ID
    formData.append('batchId', data.batchId);
    
    // Create photos array without the file property for JSON
    const photosForJson = data.photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      name: photo.name
    }));
    
    // Add photos as JSON string
    formData.append('photos', JSON.stringify(photosForJson));
    
    // Add each file separately
    data.photos.forEach((photo, index) => {
      if (photo.file) {
        formData.append('files', photo.file);
      }
    });
    
    // Use postFormData method instead of post
    return apiClient.postFormData<ProcessPhotosResponse>(
      'photo-metadata/process',
      formData
    );
  },

  /**
   * Apply metadata to multiple equipment items in batch
   */
  async applyMetadataBatch(data: ApplyMetadataBatchRequest): Promise<any> {
    return apiClient.post<any>('photo-metadata/apply-batch', data);
  }
}; 
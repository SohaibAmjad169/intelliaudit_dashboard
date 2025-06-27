import { apiClient } from '@/services/common/api-client';
import { SitePhoto, PhotoUploadResponse, PhotoAnalysisResponse } from './types';

/**
 * Service for managing project photos
 */
export const photosService = {
  /**
   * Get all photos for a project
   */
  async getProjectPhotos(projectId: string): Promise<SitePhoto[]> {
    try {
      const response = await apiClient.get<SitePhoto[]>(`/site-photos/project/${projectId}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching project photos:', error);
      return [];
    }
  },

  /**
   * Upload photos for a project
   */
  async uploadPhotos(projectId: string, files: File[]): Promise<PhotoUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('projectId', projectId);

      files.forEach(file => {
        formData.append('photos', file);
      });

      const response = await apiClient.postFormData<PhotoUploadResponse>(
        '/site-photos/upload',
        formData
      );

      return response;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    }
  },

  /**
   * Analyze a photo for equipment detection
   */
  async analyzePhoto(photoId: string): Promise<PhotoAnalysisResponse> {
    try {
      const response = await apiClient.post<PhotoAnalysisResponse>(
        `/site-photos/${photoId}/analyze`
      );
      return response;
    } catch (error) {
      console.error('Error analyzing photo:', error);
      throw error;
    }
  },

  /**
   * Update photo metadata
   */
  async updatePhotoMetadata(
    photoId: string,
    metadata: Partial<SitePhoto>
  ): Promise<SitePhoto> {
    try {
      const response = await apiClient.patch<SitePhoto>(
        `/site-photos/${photoId}`,
        metadata
      );
      return response;
    } catch (error) {
      console.error('Error updating photo metadata:', error);
      throw error;
    }
  },

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      await apiClient.delete(`/site-photos/${photoId}`);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  },

  /**
   * Get photo categories for a project
   */
  async getPhotoCategories(projectId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(`/site-photos/project/${projectId}/categories`);
      return response || [];
    } catch (error) {
      console.error('Error fetching photo categories:', error);
      return [];
    }
  },

  /**
   * Get photo categories for a project
   */
  async checkAnalysisCompletionProject(projectId: string): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(`/equipment/photo-analysis/project/${projectId}/jobs`);
      return response || [];
    } catch (error) {
      console.error('Error fetching photo categories:', error);
      return [];
    }
  }
}; 
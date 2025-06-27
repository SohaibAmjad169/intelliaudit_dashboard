import { apiClient } from '../common/api-client';
import { EquipmentAnalysis } from '../../types/equipment-analysis';

export const equipmentAnalysisService = {
  /**
   * Get equipment analysis data for a project
   * @param projectId - The project ID
   * @returns Array of equipment analysis data
   */
  async getEquipmentAnalysis(projectId: string): Promise<EquipmentAnalysis[]> {
    try {
      // Using the equipment endpoint
      const result = await apiClient.get<EquipmentAnalysis[]>(`equipment-prisma/project/${projectId}`);
      
      return result || [];
    } catch (error) {
      console.error('Error getting equipment analysis:', error);
      throw error;
    }
  },

  /**
   * Upload and analyze equipment photos
   * @param projectId - The project ID
   * @param photos - Array of photo files to analyze
   * @returns Analysis results
   */
  async analyzePhotos(projectId: string, photos: File[]): Promise<any> {
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('projectId', projectId);
      
      // Add each photo to the form data
      photos.forEach(photo => {
        formData.append('photos', photo);
      });
      
      // Use the postFormData method from apiClient
      return await apiClient.postFormData('equipment/photos/analyze', formData);
    } catch (error) {
      console.error('Error analyzing photos:', error);
      throw error;
    }
  },
}; 
import axios from 'axios';
import { apiClient } from '../common/api-client';
import { safelyAccessArray, safelyAccessProperty } from '@/utils/response-helpers';

/**
 * Service for handling project photos
 */
export const photoService = {
  /**
   * Get a photo URL by its ID
   * @param photoId The ID of the photo to retrieve
   * @returns The URL to the photo
   */
  getPhotoUrl(photoId: string): string {
    // Try to use the most likely endpoint
    return `/api/v1/photos/${photoId}`;
  },

  /**
   * Fetch the actual photo data
   * @param photoId The ID of the photo to fetch
   * @returns A promise resolving to the photo data
   */
  async fetchPhoto(photoId: string): Promise<any> {
    try {
      // Try multiple potential endpoints
      const endpoints = [
        `/api/photos/${photoId}`,
        `/api/equipment/photos/${photoId}`,
        `/api/storage/equipment-photos/${photoId}`,
        `/photos/${photoId}`
      ];

      // Try each endpoint in sequence
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint);
          if (response.status === 200) {
            return response.data;
          }
        } catch (err) {
          console.log(`Failed to fetch photo from endpoint ${endpoint}`);
        }
      }
      
      throw new Error(`Failed to fetch photo with ID ${photoId} from all endpoints`);
    } catch (error) {
      console.error('Error fetching photo:', error);
      throw error;
    }
  },

  /**
   * Get a list of alternative URLs to try for a photo
   * @param photoId The ID of the photo
   * @returns An array of URLs to try
   */
  getAlternativeUrls(photoId: string): string[] {
    return [
      `/api/photos/${photoId}`,
      `/api/equipment/photos/${photoId}`,
      `/api/storage/equipment-photos/${photoId}`,
      `/photos/${photoId}`
    ];
  },

  /**
   * Fetch project photos from the API
   * @param projectId The ID of the project
   * @returns A promise resolving to the project photos data
   */
  async fetchProjectPhotos(projectId: string): Promise<any[]> {
    if (!projectId) {
      return [];
    }
    
    try {
      // Use the standard API client instead of direct axios calls
      const response = await apiClient.get<any>(`site-photos/project/${projectId}`);
      // Use our helper functions to safely access response data
      if (response) {
        // First try to access the items property if it exists
        const items = safelyAccessProperty<unknown[]>(response, 'items', null);
        if (items && Array.isArray(items)) {
          return items;
        }
        
        // If items doesn't exist, try to use the response data directly if it's an array
        if (Array.isArray(response)) {
          // Transform the raw response data to the Photo interface format
          return response.map(item => ({
            id: item.id,
            url: item.photo_url || '',
            caption: item.notes || item.equipment_type || '',
            category: item.category || 'other',
            createdAt: item.created_at || new Date().toISOString(),
            equipment_type: item.equipment_type || '',
            manufacturer: item.manufacturer || '',
            model: item.model || '',
            serial_number: item.serial_number || '',
            location: item.location || '',
            condition: item.condition || {
              overall: 'Unknown',
              visibleIssues: []
            },
            specifications: item.specifications || {},
            notes: item.notes || '',
            confidence: item.confidence || 0
          }));
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching project photos:', error);
      return [];
    }
  }
};

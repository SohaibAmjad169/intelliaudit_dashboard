import { apiClient } from '../common/api-client';

// Type definition for ASHRAE equipment item
export interface AshraeEquipmentItem {
  id: number;
  category: string;
  description: string;
  quantity: number;
  wattage_w: number;
  hours_per_week: number;
  annual_hours: number;
  annual_kwh: number;
  formula_used: string;
  work_shown: string;
  assumptions: string;
  recommendations: string;
  created_at: string;
  project_id: string;
}

export const ashraeEquipmentService = {
  /**
   * Process field notes to extract equipment information in ASHRAE format
   * @param notes - Raw field notes text to process
   * @param projectId - Project ID
   * @param model - OpenAI model to use
   * @returns Processing result containing saved ASHRAE equipment items
   */
  async processFieldNotes(
    notes: string,
    projectId: string,
    model: string = 'gpt-4o'
  ): Promise<{
    success: boolean;
    message: string;
    data: AshraeEquipmentItem[];
  }> {
    try {
      console.log('[DEBUG] Sending ASHRAE field notes analysis request:', {
        notesLength: notes.length,
        projectId,
        model,
        endpoint: 'equipment/notes/analyze' // Log the endpoint being called
      });

      // Call the backend API for ASHRAE analysis - double check URL
      const response = await apiClient.post<{
        equipment: AshraeEquipmentItem[];
        building_info?: any;
        flags?: any[];
        metadata?: any;
      }>('equipment/notes/analyze', {
        notes,
        projectId,
        model
      });

      console.log('[DEBUG] ASHRAE field notes processing response:', response);
      
      // Add proper success/failure handling
      if (!response) {
        return {
          success: false,
          message: 'Empty response from server',
          data: []
        };
      }
      
      // Check if we have equipment data
      if (!response.equipment) {
        return {
          success: false,
          message: 'No equipment data found in response',
          data: []
        };
      }
      
      return {
        success: true,
        message: 'Successfully processed field notes',
        data: response.equipment || []
      };
    } catch (error) {
      console.error('[DEBUG] Error processing ASHRAE field notes:', error);
      
      // Extract more detailed error message if available
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      // Return a structured error response
      return {
        success: false,
        message: `Failed to process field notes: ${errorMessage}`,
        data: []
      };
    }
  },

  /**
   * Fetch ASHRAE equipment from the database
   * @param projectId - Project ID
   * @returns Array of ASHRAE equipment items
   */
  async getAshraeEquipment(projectId: string): Promise<AshraeEquipmentItem[]> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      console.log('Making API GET request to equipment/ashrae-equipment with projectId:', projectId);
      
      // Fetch ASHRAE equipment from the backend
      const result = await apiClient.get<AshraeEquipmentItem[]>(`equipment/ashrae-equipment?projectId=${projectId}`);
      
      console.log('API response received for ASHRAE equipment:', {
        count: result?.length,
        timestamp: new Date().toISOString()
      });
      
      return result || [];
    } catch (error) {
      console.error('Error fetching ASHRAE equipment:', error);
      return [];
    }
  }
}; 
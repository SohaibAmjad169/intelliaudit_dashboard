import { apiClient } from '../common/api-client';
import {
  FieldNotesProcessRequest,
  FieldNotesProcessResult,
  GetFieldNotesResponse,
  FieldNotesEquipmentItem,
  EnergyBreakdown
} from './field-notes.types';

/**
 * Preprocess field notes to reduce token usage
 * @param notes - Raw field notes text
 * @returns Preprocessed field notes with reduced whitespace
 */
const preprocessNotes = (notes: string): string => {
  if (!notes) return '';

  return notes
    .replace(/\s+/g, ' ')               // Convert multiple spaces to single
    .replace(/\n+/g, '\n')              // Normalize newlines
    .replace(/(\n\s*\n\s*\n)+/g, '\n\n') // Remove excessive blank lines
    .replace(/^\s+|\s+$/gm, '')         // Trim each line
    .trim();                            // Trim the entire text
};

/**
 * Field notes service that communicates with the field-notes module in the backend
 */
export const fieldNotesService = {
  /**
   * Process field notes to extract equipment information and energy breakdown
   * @param notes - Raw field notes text to process
   * @param projectId - Project ID
   * @returns Processing result containing extracted equipment, energy breakdown, and metadata
   */
  async processFieldNotes(
    notes: string,
    projectId: string
  ): Promise<FieldNotesProcessResult> {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Preprocess notes to reduce token usage
      const preprocessedNotes = preprocessNotes(notes);

      // Define request payload
      const payload: FieldNotesProcessRequest = {
        notes: preprocessedNotes,
        projectId
      };

      // Call the new dedicated endpoint
      const response = await apiClient.post<FieldNotesProcessResult>('/field-notes', payload);

      return response;
    } catch (error) {
      // Extract more detailed error message if available
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }

      // Return a structured error response
      return {
        equipment: [],
        flags: [{
          type: 'error',
          message: `Failed to process field notes: ${errorMessage}`,
          severity: 'error'
        }],
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: 0,
          confidence: 0
        }
      };
    }
  },

  /**
   * Get field notes data for a project
   * @param projectId - Project ID
   * @returns Field notes data with equipment and energy breakdown
   */
  async getFieldNotes(projectId: string): Promise<GetFieldNotesResponse> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      // Call the endpoint to get field notes data
      const response = await apiClient.get<GetFieldNotesResponse>(`/field-notes/${projectId}`);

      return response;
    } catch (error) {
      // Return empty response on error
      return {
        equipment: []
      };
    }
  },

  /**
   * Get energy breakdown for a project's field notes equipment
   * @param projectId - Project ID
   * @returns Energy breakdown by end use
   */
  async getEnergyBreakdown(projectId: string): Promise<GetFieldNotesResponse['energy_breakdown']> {
    try {
      console.log('Getting baseline energy breakdown for project:', projectId);

      // First try to get the saved breakdown from the database
      // This will return the most recently saved breakdown, which should be the baseline one
      // generated when field notes were processed
      const response = await apiClient.get<EnergyBreakdown>(`/field-notes/${projectId}/energy-breakdown`);
      console.log('Energy breakdown response from database:', response);

      // If we got a valid response with components, return it
      if (response && response.endUseComponents && response.endUseComponents.length > 0) {
        return response;
      }

      // If no valid breakdown was found in the database, generate a new baseline breakdown
      console.log('No valid breakdown found in database, generating new baseline breakdown');
      const baselineResponse = await apiClient.post<EnergyBreakdown>(`/field-notes/${projectId}/baseline-energy-breakdown`);
      console.log('Baseline energy breakdown response:', baselineResponse);
      return baselineResponse;
    } catch (error) {
      console.error('Error getting energy breakdown:', error);
      return null;
    }
  }
};
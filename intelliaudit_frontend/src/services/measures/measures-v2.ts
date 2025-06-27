import { apiClient } from '../common/api-client';

export interface Measure {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  category?: string;
  type: 'energy' | 'water' | 'other';
  annualSavings?: {
    kwh?: number;
    therms?: number;
    water?: number;
    cost?: number;
  };
  implementationCost?: number;
  paybackPeriod?: number;
  co2Reduction?: number;
  priority?: 'high' | 'medium' | 'low';
  complexity?: 'simple' | 'moderate' | 'complex';
  details?: string;
  created_at: string;
  updated_at: string;
}

export const measuresV2Service = {
  /**
   * Get all measures for a project
   * @param projectId Project ID
   * @returns Array of measures
   */
  async getAllMeasures(projectId: string): Promise<Measure[]> {
    try {
      // Use the correct endpoint defined in the backend
      const data = await apiClient.get<Measure[]>(`measures-prisma/${projectId}`);
      return data || [];
    } catch (error) {
      console.error('Error fetching measures:', error);
      return [];
    }
  },

  /**
   * Get a single measure by ID
   * @param id Measure ID
   * @returns Measure item
   */
  async getMeasureById(id: string): Promise<Measure | null> {
    try {
      // Temporarily use v1 API until v2 endpoints are implemented
      const data = await apiClient.get<Measure>(`measures-prisma/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching measure by ID:', error);
      return null;
    }
  },

  /**
   * Create a new measure
   * @param measureData Measure data
   * @returns Created measure
   */
  async createMeasure(measureData: Partial<Measure>): Promise<Measure | null> {
    try {
      // Temporarily use v1 API until v2 endpoints are implemented
      const data = await apiClient.post<Measure>('measures-prisma', measureData);
      return data;
    } catch (error) {
      console.error('Error creating measure:', error);
      return null;
    }
  },

  /**
   * Update an existing measure
   * @param id Measure ID
   * @param measureData Updated measure data
   * @returns Updated measure
   */
  async updateMeasure(id: string, measureData: Partial<Measure>): Promise<Measure | null> {
    try {
      // Temporarily use v1 API until v2 endpoints are implemented
      const data = await apiClient.put<Measure>(`measures-prisma/${id}`, measureData);
      return data;
    } catch (error) {
      console.error('Error updating measure:', error);
      return null;
    }
  },

  /**
   * Delete a measure
   * @param id Measure ID
   * @returns Success message
   */
  async deleteMeasure(id: string): Promise<{ success: boolean; message: string } | null> {
    try {
      // Temporarily use v1 API until v2 endpoints are implemented
      await apiClient.delete(`measures-prisma/${id}`);
      return { success: true, message: 'Measure deleted successfully' };
    } catch (error) {
      console.error('Error deleting measure:', error);
      return null;
    }
  }
}; 
import { apiClient } from '@/services/common';

export interface BenchmarkData {
  energyStarScore?: number;
  siteEUI?: number;
  nationalMedianSiteEUI?: number;
  percentDifference?: number;
  sourceEUI?: number;
  buildingInfo?: {
    address?: string;
    propertyType?: string;
    grossFloorArea?: number;
    builtYear?: number;
    reportingPeriodEnd?: string;
    dateGenerated?: string;
  }
}

export const energyStarBenchmarkingService = {
  /**
   * Fetch Energy Star benchmarking data for a project
   * @param projectId The project ID
   * @returns The benchmarking data or null if not available
   */
  async getBenchmarkData(projectId: string): Promise<BenchmarkData | null> {
    try {
      const data = await apiClient.get<BenchmarkData>(`energy-benchmarking/${projectId}`);
      return data;
    } catch (error) {
      console.error('Error fetching Energy Star benchmarking data:', error);
      return null;
    }
  },
  
  /**
   * Fetch Energy Star benchmarking data for a project
   * @param projectId The project ID
   * @returns The benchmarking data or null if not available
   */
  async getEnergySummary(projectId: string): Promise<BenchmarkData | null> {
    try {
      // const data = await apiClient.get<BenchmarkData>(`energy-benchmarking/${projectId}`);
      const data = await apiClient.get<BenchmarkData>(`reports/energy-summary?projectId=${projectId}`);
      return data;
    } catch (error) {
      console.error('Error fetching Energy Star benchmarking data:', error);
      return null;
    }
  }
}; 
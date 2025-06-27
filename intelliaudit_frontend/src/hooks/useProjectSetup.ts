import { useState } from 'react';
import { apiClient, getEndpoint } from '@/services/common';

export type LoadingStatus = {
  portfolioManager: 'pending' | 'loading' | 'complete' | 'error';
  weatherData: 'pending' | 'loading' | 'complete' | 'error';
  energyAudit: 'pending' | 'loading' | 'complete' | 'error';
};

export interface ProjectSetupOptions {
  portfolioManagerId: string;
  projectId: string; 
  startDate?: string;
  endDate?: string;
  year?: number;
}

/**
 * Hook for setting up projects with Portfolio Manager data
 * Simplified to only import utility data
 */
export function useProjectSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    portfolioManager: 'pending',
    weatherData: 'pending',
    energyAudit: 'pending'
  });
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Initialize a new project setup process
   * @param options - Project setup options
   * @returns Promise with setup result
   */
  const setupProject = async (options: ProjectSetupOptions) => {
    const { portfolioManagerId, projectId, startDate, endDate, year } = options;
    
    // Reset state
    setIsLoading(true);
    setLoadingStatus({
      portfolioManager: 'loading',
      weatherData: 'pending',
      energyAudit: 'pending'
    });
    setError(null);
    
    try {
      console.log('Setting up project with Portfolio Manager data:', {
        portfolioManagerId,
        projectId,
        startDate,
        endDate,
        year
      });
      
      // Use the consolidated endpoint selection with Prisma
      const endpoint = getEndpoint(`portfolio-manager-prisma/properties/${portfolioManagerId}/setup-project`);
      
      console.log(`Using endpoint: ${endpoint}`);
      
      // Import utility data only
      const utilityDataResponse = await apiClient.post<any>(
        endpoint,
        { 
          projectId,
          startDate,
          endDate,
          year
        }
      );
      
      if (!utilityDataResponse.success) {
        throw new Error(utilityDataResponse.message || 'Failed to import utility data');
      }
      
      console.log('Utility data imported successfully:', utilityDataResponse);
      
      // Update loading status - mark all steps as complete
      setLoadingStatus({
        portfolioManager: 'complete',
        weatherData: 'complete',
        energyAudit: 'complete'
      });
      
      setIsLoading(false);
      
      return {
        success: true,
        data: {
          utilityData: utilityDataResponse.data
        }
      };
    } catch (error: any) {
      console.error('Error setting up project:', error);
      
      // Update loading status to error
      setLoadingStatus({
        portfolioManager: 'error',
        weatherData: 'pending',
        energyAudit: 'pending'
      });
      
      setError(error.message || 'An error occurred during project setup');
      setIsLoading(false);
      
      return {
        success: false,
        error: error.message || 'An error occurred during project setup'
      };
    }
  };
  
  return {
    setupProject,
    isLoading,
    loadingStatus,
    error
  };
} 
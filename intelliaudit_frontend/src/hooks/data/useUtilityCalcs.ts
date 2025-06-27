import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/common/api-client';
import { AxiosResponse } from 'axios';

interface UtilityCalcsData {
  month: number;
  year: number;
  usage: number;
  cost: number;
}

// Query keys for React Query
export const utilityCalcsKeys = {
  all: ['utilityCalcs'] as const,
  monthly: (projectId: string, type: string) => 
    [...utilityCalcsKeys.all, 'monthly', projectId, type] as const,
};

// Fetch monthly utility data
async function fetchMonthlyUtilityCalcs(projectId: string, type: string): Promise<UtilityCalcsData[]> {
  try {
    const response: AxiosResponse<UtilityCalcsData[]> = await apiClient.get(`/api/utility-calcs/projects/${projectId}/monthly/${type}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching monthly ${type} data:`, error);
    return [];
  }
}

// Hook to fetch monthly utility calculation data
export function useMonthlyUtilityCalcs(projectId: string, type: string) {
  return useQuery({
    queryKey: utilityCalcsKeys.monthly(projectId, type),
    queryFn: () => fetchMonthlyUtilityCalcs(projectId, type),
    enabled: !!projectId && !!type,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
} 
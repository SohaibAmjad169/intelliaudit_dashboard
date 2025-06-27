import { useQuery } from '@tanstack/react-query';
import { 
  fetchEndUseBreakdown, 
  fetchTotalUtilityCost, 
  fetchTotalUtilityUsage,
  fetchMonthlyUtilityData
  // EndUseBreakdown type is imported for future use
  // EndUseBreakdown
} from '@/services/energy-analysis';

// Query keys for React Query
export const energyKeys = {
  all: ['energy'] as const,
  endUseBreakdown: (projectId: string) => 
    [...energyKeys.all, 'endUseBreakdown', projectId] as const,
  utilityCost: (projectId: string) => 
    [...energyKeys.all, 'utilityCost', projectId] as const,
  utilityUsage: (projectId: string) => 
    [...energyKeys.all, 'utilityUsage', projectId] as const,
  monthlyData: (projectId: string, energyType: string) => 
    [...energyKeys.all, 'monthlyData', projectId, energyType] as const,
};

/**
 * Hook to fetch end use breakdown data with caching
 */
export function useEndUseBreakdown(projectId: string) {
  return useQuery({
    queryKey: energyKeys.endUseBreakdown(projectId),
    queryFn: () => fetchEndUseBreakdown(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
}

/**
 * Hook to fetch total utility cost data with caching
 */
export function useUtilityCost(projectId: string) {
  return useQuery({
    queryKey: energyKeys.utilityCost(projectId),
    queryFn: () => fetchTotalUtilityCost(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
}

/**
 * Hook to fetch total utility usage data with caching
 */
export function useUtilityUsage(projectId: string) {
  return useQuery({
    queryKey: energyKeys.utilityUsage(projectId),
    queryFn: () => fetchTotalUtilityUsage(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
}

/**
 * Hook to fetch monthly utility data with caching
 */
export function useMonthlyUtilityData(projectId: string, energyType: string) {
  return useQuery({
    queryKey: energyKeys.monthlyData(projectId, energyType),
    queryFn: () => fetchMonthlyUtilityData(projectId, energyType),
    enabled: !!projectId && !!energyType,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });
}

import { useProject } from '@/hooks/data/useProject';
import { useQuery } from '@tanstack/react-query';
import { fetchTotalUtilityCost, fetchTotalUtilityUsage } from '@/services/energy-analysis';

export function useProjectOverview(projectId: string | undefined) {
  const projectQuery = useProject(projectId);

  const costQuery = useQuery({
    queryKey: ['project', projectId, 'totalCost'],
    queryFn: () => (projectId ? fetchTotalUtilityCost(projectId) : null),
    enabled: !!projectId,
  });

  const usageQuery = useQuery({
    queryKey: ['project', projectId, 'totalUsage'],
    queryFn: () => (projectId ? fetchTotalUtilityUsage(projectId) : null),
    enabled: !!projectId,
  });

  const isLoading = projectQuery.isLoading || costQuery.isLoading || usageQuery.isLoading;
  const error = projectQuery.error || costQuery.error || usageQuery.error;

  return {
    project: projectQuery.data,
    totalCost: costQuery.data,
    totalUsage: usageQuery.data,
    isLoading,
    error,
  };
} 
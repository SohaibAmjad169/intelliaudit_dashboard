import { useQuery } from '@tanstack/react-query';
import { getProject } from '@/services/projects';

export function useProject(projectId: string | undefined) {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? getProject(projectId) : null,
    enabled: !!projectId,
  });

  return {
    data,
    isLoading,
    error
  };
}

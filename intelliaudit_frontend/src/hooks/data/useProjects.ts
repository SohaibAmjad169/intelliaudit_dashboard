import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project } from '@/types/models/project.model';
import { CreateProjectDto, UpdateProjectDto } from '@/types/dto/project.dto';
import { getProjects, getProject, createProject, updateProject, deleteProject } from '@/services/projects';
import { useToast } from '@/components/ui/use-toast';

const PROJECTS_QUERY_KEY = 'projects';

export function useProjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main query to fetch all projects
  const { 
    data: projects = [], 
    isLoading, 
    error,
    refetch: fetchProjects
  } = useQuery({
    queryKey: [PROJECTS_QUERY_KEY],
    queryFn: async () => {
      try {
        const data = await getProjects();
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch projects');
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    }
  });

  // Get project by slug
  const getProjectBySlug = async (slug: string) => {
    try {
      // Use the regular getProject function - the API will handle slug/id resolution
      return await getProject(slug);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch project');
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string, data: Partial<any> }) => {
      return await updateProject(projectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update project stage mutation
  const updateProjectStageMutation = useMutation({
    mutationFn: async ({ projectId, stage }: { projectId: string, stage: string }) => {
      // Update the project with stage information
      return await updateProject(projectId, { stage: stage } as UpdateProjectDto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Project stage updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update project stage. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Add project mutation
  const addProjectMutation = useMutation({
    mutationFn: async (data: any) => { // Use 'any' temporarily to avoid type errors
      // Ensure required fields are present
      if (!data.name || !data.building_address) {
        throw new Error('Project name and building address are required');
      }
      
      // Convert to the CreateProjectDto expected by the API
      const createData: CreateProjectDto = {
        name: data.name,
        building_address: data.building_address
      };
      
      // Map fields that exist in the DTO
      if (data.description !== undefined) createData.description = data.description;
      if (data.contact_name !== undefined) createData.contact_name = data.contact_name;
      if (data.contact_email !== undefined) createData.contact_email = data.contact_email;
      if (data.building_type !== undefined) createData.building_type = data.building_type;
      if (data.status !== undefined) createData.status = data.status;
      if (data.stage !== undefined) createData.stage = data.stage;
      
      return await createProject(createData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Project added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add project. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await deleteProject(projectId);
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_QUERY_KEY] });
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    // Data and loading state
    projects,
    isLoading,
    error,
    
    // Actions
    fetchProjects,
    getProjectBySlug,
    
    // Mutations with their states
    updateProject: updateProjectMutation.mutateAsync,
    updateProjectStage: updateProjectStageMutation.mutateAsync,
    addProject: addProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    
    // Mutation states
    isUpdating: updateProjectMutation.isPending,
    isUpdatingStage: updateProjectStageMutation.isPending,
    isAdding: addProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    
    // Legacy compatibility - these match the interface of the legacy hooks
    data: projects,
    refetch: fetchProjects,
    
    // For state management compatibility
    setProjects: (newProjects: Project[]) => {
      queryClient.setQueryData([PROJECTS_QUERY_KEY], newProjects);
    },
    clearProjects: () => {
      queryClient.setQueryData([PROJECTS_QUERY_KEY], []);
    }
  };
}

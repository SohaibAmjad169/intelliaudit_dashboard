import { apiClient } from '../../../services/common/api-client';
import { getEndpoint } from '../../../services/common/api-config';
import { toSnakeCase } from '@/services/common/data-transformers';
import { 
  Project,
  CreateProjectData,
  UpdateProjectData,
} from '@/types/project';

/**
 * Projects API Service
 * 
 * This service provides methods for interacting with the projects API.
 * It automatically handles endpoint selection based on the current configuration.
 */
export class ProjectsApi {
  /**
   * Get a list of all projects
   */
  async getProjects(): Promise<Project[]> {
    try {
      // Use the getEndpoint helper to get the correct endpoint
      const endpoint = getEndpoint('projects');
      return await apiClient.get<Project[]>(endpoint);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      const endpoint = getEndpoint(`projects/${id}`);
      return await apiClient.get<Project>(endpoint);
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      return null;
    }
  }

  /**
   * Get a project by slug or ID
   */
  async getProjectBySlug(projectSlug: string, projectId?: string): Promise<Project | null> {
    try {
      // If projectId is provided, use it directly
      if (projectId) {
        return await this.getProject(projectId);
      }
      
      // Otherwise, try to extract the ID from the slug
      const parts = projectSlug.split('-');
      const extractedId = parts[parts.length - 1];
      
      if (!extractedId) {
        throw new Error(`Could not extract ID from slug: ${projectSlug}`);
      }
      
      return await this.getProject(extractedId);
    } catch (error) {
      console.error('Error fetching project by slug:', error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  async createProject(project: CreateProjectData): Promise<Project | null> {
    try {
      // Transform data to snake_case format expected by the API
      const mappedData = toSnakeCase(project);
      
      const endpoint = getEndpoint('projects');
      return await apiClient.post<Project>(endpoint, mappedData);
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: UpdateProjectData): Promise<Project | null> {
    try {
      // Transform data to snake_case format expected by the API
      const mappedData = toSnakeCase(data);
      
      // Remove undefined fields
      const updateData = Object.fromEntries(
        Object.entries(mappedData).filter(([_, value]) => value !== undefined)
      );

      const endpoint = getEndpoint(`projects/${id}`);
      return await apiClient.put<Project>(endpoint, updateData);
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return null;
    }
  }

  /**
   * Update a project's stage
   */
  async updateProjectStage(projectId: string, stage: string): Promise<Project | null> {
    try {
      return await this.updateProject(projectId, { stage });
    } catch (error) {
      console.error(`Error updating project stage for ${projectId}:`, error);
      return null;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const endpoint = getEndpoint(`projects/${id}`);
      await apiClient.delete(endpoint);
      return true;
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return false;
    }
  }

  /**
   * Update section status for a project
   */
  async updateSectionStatus(
    projectId: string,
    sectionType: string,
    isComplete: boolean
  ): Promise<boolean> {
    try {
      const endpoint = getEndpoint(`projects/${projectId}/sections/${sectionType}/status`);
      await apiClient.put(endpoint, { isComplete });
      return true;
    } catch (error) {
      console.error('Error updating section status:', error);
      return false;
    }
  }

  /**
   * Set up a project with Portfolio Manager data
   */
  async setupProjectWithPortfolioManager(
    portfolioManagerId: string,
    projectId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      year?: number;
    }
  ): Promise<any> {
    try {
      const endpoint = getEndpoint(`portfolio-manager-prisma/properties/${portfolioManagerId}/setup-project`);
      return await apiClient.post<any>(endpoint, {
        projectId,
        ...options
      });
    } catch (error) {
      console.error('Error setting up project with Portfolio Manager:', error);
      throw error;
    }
  }
  
  /**
   * Get project metadata
   */
  async getProjectMetadata(projectId: string): Promise<any> {
    try {
      const endpoint = getEndpoint(`projects/${projectId}/metadata`);
      return await apiClient.get<any>(endpoint);
    } catch (error) {
      console.error(`Error fetching project metadata for ${projectId}:`, error);
      return null;
    }
  }
  
  /**
   * Update project metadata
   */
  async updateProjectMetadata(projectId: string, metadata: any): Promise<any> {
    try {
      const endpoint = getEndpoint(`projects/${projectId}/metadata`);
      return await apiClient.put<any>(endpoint, metadata);
    } catch (error) {
      console.error(`Error updating project metadata for ${projectId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const projectsApi = new ProjectsApi();

// For backward compatibility - re-export methods for direct use
export const getProjects = projectsApi.getProjects.bind(projectsApi);
export const getProject = projectsApi.getProject.bind(projectsApi);
export const createProject = projectsApi.createProject.bind(projectsApi);
export const updateProject = projectsApi.updateProject.bind(projectsApi);
export const deleteProject = projectsApi.deleteProject.bind(projectsApi);
export const getProjectsByCustomer = projectsApi.getProjects.bind(projectsApi);

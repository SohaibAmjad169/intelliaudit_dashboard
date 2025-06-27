/**
 * Projects API utilities
 * Centralized functions for project operations using the common API client
 */
import { apiClient } from '../common/api-client';
import { Project } from '@/types/models/project.model';
import { CreateProjectDto, UpdateProjectDto } from '@/types/dto/project.dto';
import { toSnakeCase, removeEmptyProperties } from '../common/data-transformers';

/**
 * Get a list of all projects 
 */
export async function getProjects(): Promise<Project[]> {
  try {
    return await apiClient.get<Project[]>('projects');
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  try {
    return await apiClient.get<Project>(`projects/${id}`);
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }
}

/**
 * Get a specific project with details by ID
 */
export async function getProjectWithDetails(id: string): Promise<Project | null> {
  try {
    return await apiClient.get<Project>(`projects/${id}/details`);
  } catch (error) {
    console.error(`Error fetching project details for ${id}:`, error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(projectData: CreateProjectDto): Promise<Project | null> {
  try {
    // Transform data to snake_case format expected by the API
    const transformedData = toSnakeCase(projectData);
    console.log('Creating project with data:', transformedData);
    
    return await apiClient.post<Project>('projects', transformedData);
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, data: UpdateProjectDto): Promise<Project | null> {
  try {
    // Remove empty fields and transform to snake_case
    const cleanData = removeEmptyProperties(data);
    const transformedData = toSnakeCase(cleanData);
    
    return await apiClient.put<Project>(`projects/${id}`, transformedData);
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return null;
  }
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    await apiClient.delete(`projects/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return false;
  }
}

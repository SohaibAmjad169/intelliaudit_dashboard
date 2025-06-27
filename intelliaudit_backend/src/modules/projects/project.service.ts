import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Project, ProjectInput } from './project.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { WeatherPrismaService } from '../weather/weather-prisma.service';
// Removed PortfolioManagerPrismaService import as it's no longer directly used

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly weatherService: WeatherPrismaService
  ) {
    // Log that we're using the Prisma service
  }

  async getProjects(): Promise<Project[]> {
    
    const projects = await this.prisma.projects.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Convert Prisma model to Project entity
    return projects.map(project => ({
      ...project,
      created_at: project.created_at?.toISOString() || '',
      updated_at: project.updated_at?.toISOString() || ''
    })) as Project[];
  }

  async getProjectById(id: string): Promise<Project> {
    
    try {
      const project = await this.prisma.projects.findUnique({
        where: { id }
      });
      
      if (!project) {
        this.logger.warn(`Project with ID ${id} not found`);
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      
      // Convert Prisma model to Project entity
      return {
        ...project,
        created_at: project.created_at?.toISOString() || '',
        updated_at: project.updated_at?.toISOString() || ''
      } as Project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error fetching project ${id}:`, error);
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  async createProject(projectData: ProjectInput): Promise<Project> {
    
    const now = new Date();
    
    // Remove stage from projectData
    const { stage, ...projectDataWithoutStage } = projectData;
    
    try {
      const createdProject = await this.prisma.projects.create({
        data: {
          ...projectDataWithoutStage,
          created_at: now,
          updated_at: now
        }
      });
      
      // Debug project data received after creation
      
      // Queue weather data fetch if project has a postal code
      if (createdProject.property_postal_code && 
          typeof createdProject.property_postal_code === 'string' && 
          createdProject.property_postal_code.trim() !== '') {
        const postalCode = createdProject.property_postal_code.trim();
        
        // We'll handle this asynchronously to not block the response
        this.fetchWeatherDataForProject(createdProject.id, postalCode)
          .catch(error => {
            this.logger.error(`Failed to fetch weather data for new project:`, error);
          });
      }
      
      // Convert Prisma model to Project entity
      return {
        ...createdProject,
        created_at: createdProject.created_at?.toISOString() || '',
        updated_at: createdProject.updated_at?.toISOString() || ''
      } as Project;
    } catch (error) {
      this.logger.error(`Error creating project:`, error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    
    try {
      // First check if the project exists
      const existingProject = await this.prisma.projects.findUnique({
        where: { id }
      });
      
      if (!existingProject) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      
      const updatedProject = await this.prisma.projects.update({
        where: { id },
        data: {
          ...projectData,
          updated_at: new Date()
        }
      });
      
      // Convert Prisma model to Project entity
      return {
        ...updatedProject,
        created_at: updatedProject.created_at?.toISOString() || '',
        updated_at: updatedProject.updated_at?.toISOString() || ''
      } as Project;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Error updating project ${id}:`, error);
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async fetchWeatherDataForProject(projectId: string, zipCode: string): Promise<void> {
    if (!projectId || !zipCode) {
      this.logger.warn(`Missing projectId or zipCode for weather data fetch: ${projectId}, ${zipCode}`);
      return;
    }

    
    try {
      // Validate inputs before proceeding
      if (!projectId || typeof projectId !== 'string') {
        throw new Error(`Invalid project ID: ${projectId}`);
      }
      
      if (!zipCode || typeof zipCode !== 'string' || !/^\d{5}$/.test(zipCode)) {
        throw new Error(`Invalid ZIP code format: ${zipCode}. Must be 5 digits.`);
      }
      
      await this.weatherService.getWeatherComparison(projectId, zipCode);
    } catch (error) {
      this.logger.error(`❌ Error in weather fetch for project ${projectId}:`, error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    
    try {
      // First check if the project exists
      const existingProject = await this.prisma.projects.findUnique({
        where: { id }
      });
      
      if (!existingProject) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      
      // Delete the project - Prisma will handle cascading deletes based on the schema
      await this.prisma.projects.delete({
        where: { id }
      });
      
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to delete project ${id}:`, error);
      throw error;
    }
  }

  async updateSectionStatus(
    projectId: string,
    sectionType: string,
    isComplete: boolean
  ): Promise<void> {
    this.logger.debug(`Updating section status for project: ${projectId}`, {
      sectionType,
      isComplete
    });

    // Since audit_sections is not in the Prisma schema, we'll log a message
    this.logger.warn(`Section status update for ${sectionType} in project ${projectId} not implemented in Prisma version`);
    throw new Error('Section status update functionality is not available in the Prisma implementation');
  }
  

}

import { Controller, Get, Post, Body, Put, Param, Delete, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { ProjectDto, CreateProjectDto, UpdateProjectDto, UpdateSectionStatusDto } from './dto/project.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects', description: 'Retrieves a list of all projects using Prisma' })
  @ApiResponse({ status: 200, description: 'List of projects retrieved successfully', type: [Project] })
  async getProjects(): Promise<Project[]> {
    return this.projectService.getProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID', description: 'Retrieves a specific project by its ID using Prisma' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id') id: string): Promise<Project> {
    return this.projectService.getProjectById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create project', description: 'Creates a new project using Prisma' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: ProjectDto })
  @ApiResponse({ status: 400, description: 'Invalid project data' })
  async createProject(@Body() input: CreateProjectDto): Promise<Project> {
    return this.projectService.createProject(input);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project', description: 'Updates an existing project using Prisma' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProject(
    @Param('id') id: string,
    @Body() input: UpdateProjectDto
  ): Promise<Project> {
    return this.projectService.updateProject(id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project', description: 'Deletes a project using Prisma' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async deleteProject(@Param('id') id: string): Promise<void> {
    return this.projectService.deleteProject(id);
  }

  @Put(':id/sections/:sectionType/status')
  @ApiOperation({ summary: 'Update section status', description: 'Updates the completion status of a project section using Prisma' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'sectionType', description: 'Section type' })
  @ApiResponse({ status: 200, description: 'Section status updated successfully' })
  @ApiResponse({ status: 404, description: 'Project or section not found' })
  async updateSectionStatus(
    @Param('id') id: string,
    @Param('sectionType') sectionType: string,
    @Body() updateDto: UpdateSectionStatusDto
  ): Promise<void> {
    return this.projectService.updateSectionStatus(id, sectionType, updateDto.isComplete);
  }

  @Post(':id/weather')
  @ApiOperation({ summary: 'Fetch weather data for a project', description: 'Fetches weather data for a project using Prisma' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiQuery({ name: 'zipCode', required: false, description: 'Optional: ZIP code to use instead of the project\'s ZIP code' })
  @ApiResponse({ status: 200, description: 'Weather data fetched successfully' })
  @ApiResponse({ status: 400, description: 'ZIP code not available' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async fetchWeatherData(
    @Param('id') id: string,
    @Query('zipCode') zipCode?: string
  ): Promise<void> {
    try {
      const project = await this.projectService.getProjectById(id);
      
      // Use provided ZIP code or fall back to project postal code
      const finalZipCode = zipCode || project.property_postal_code;
      
      if (!finalZipCode) {
        throw new BadRequestException('No postal code available for the project, and no ZIP code was provided');
      }
      
      return this.projectService.fetchWeatherDataForProject(id, finalZipCode);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException for proper 404 response
      }
      
      // For other errors, log and throw a generic error
      this.logger.error(`Error in fetchWeatherData for project ${id}:`, error);
      throw error;
    }
  }
}

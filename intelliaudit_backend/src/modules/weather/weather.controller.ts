// weather.controller.ts
import { Controller, Get, Query, BadRequestException, Logger } from '@nestjs/common';
import { WeatherPrismaService } from './weather-prisma.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);
  
  constructor(private readonly weatherService: WeatherPrismaService) {}

  @Get('comparison')
  @ApiOperation({ summary: 'Get weather comparison data for a specific location' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'zipCode', required: true, description: 'ZIP code for weather data' })
  @ApiResponse({ status: 200, description: 'Weather comparison data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getWeatherComparison(
    @Query('projectId') projectId: string,
    @Query('zipCode') zipCode: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }
    if (!zipCode) {
      throw new BadRequestException('ZIP code is required');
    }
    if (!/^\d{5}$/.test(zipCode)) {
      throw new BadRequestException('ZIP code must be 5 digits');
    }
    
    console.log(`[API REQUEST] GET /weather/comparison?projectId=${projectId}&zipCode=${zipCode}`);
    
    return this.weatherService.getWeatherComparison(projectId, zipCode);
  }

  @Get('project')
  @ApiOperation({ summary: 'Get all weather data for a specific project' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project weather data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project ID' })
  async getWeatherByProject(@Query('projectId') projectId: string) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }
    
    console.log(`[API REQUEST] GET /weather/project?projectId=${projectId}`);
    
    return this.weatherService.getWeatherByProject(projectId);
  }
  
  @Get('refresh-manual')
  @ApiOperation({ summary: 'Manually force refresh weather data for a project with a specific ZIP code' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'zipCode', required: true, description: 'ZIP code for weather data' })
  @ApiResponse({ status: 200, description: 'Weather data refreshed successfully' })
  async refreshWeatherManual(
    @Query('projectId') projectId: string,
    @Query('zipCode') zipCode: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }
    if (!zipCode) {
      throw new BadRequestException('ZIP code is required');
    }
    if (!/^\d{5}$/.test(zipCode)) {
      throw new BadRequestException('ZIP code must be 5 digits');
    }
    
    console.log(`[API REQUEST] GET /weather/refresh-manual?projectId=${projectId}&zipCode=${zipCode}`);
    console.log(`[WEATHER] ⬇️ Starting manual weather data fetch and save process`);
    
    try {
      // Fetch and save the weather data
      const result = await this.weatherService.getWeatherComparison(projectId, zipCode);
      
      // Log success
      console.log(`[WEATHER] ✅ Manual weather refresh completed successfully`);
      
      return { 
        success: true, 
        message: 'Weather data refreshed successfully',
        data: { 
          projectId, 
          zipCode,
          recordCount: Array.isArray(result) ? result.length : 0
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to refresh weather data: ${error.message}`);
      console.log(`[WEATHER] ❌ Manual weather refresh failed: ${error.message}`);
      throw error;
    }
  }
}
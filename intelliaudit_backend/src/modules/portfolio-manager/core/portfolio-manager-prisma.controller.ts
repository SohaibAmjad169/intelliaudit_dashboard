import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PortfolioManagerPrismaService } from './portfolio-manager-prisma.service';

@ApiTags('Portfolio Manager Prisma')
@Controller('portfolio-manager-prisma')
export class PortfolioManagerPrismaController {
  private readonly logger = new Logger(PortfolioManagerPrismaController.name);

  constructor(private readonly portfolioManagerPrismaService: PortfolioManagerPrismaService) { }

  @Get('properties/:id')
  @ApiOperation({
    summary: 'Get property details from Portfolio Manager',
    description: 'Retrieves property details from Portfolio Manager API by property ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio Manager property ID',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Property details retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found'
  })
  async getProperty(@Param('id') propertyId: string) {

    try {
      // Use the Prisma implementation of the Portfolio Manager service
      const result = await this.portfolioManagerPrismaService.getProperty(propertyId);

      // If the result already has a data property, add the property field for backward compatibility
      if (result && result.success === true && result.data) {
        return {
          success: true,
          data: result.data,
          property: result.data // Add property field for backward compatibility
        };
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting property details: ${error.message}`);
      return {
        success: false,
        error: `Failed to get property details: ${error.message}`
      };
    }
  }

  @Post('properties/:id/setup-project')
  @ApiOperation({
    summary: 'Set up a project with Portfolio Manager data',
    description: 'Imports utility data from Portfolio Manager and associates it with a project'
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio Manager property ID',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Project set up successfully'
  })
  async setupProject(
    @Param('id') propertyId: string,
    @Body() body: { projectId: string; startDate?: string; endDate?: string; year?: number }
  ) {

    try {
      // Use the Prisma implementation of the Portfolio Manager service
      const result = await this.portfolioManagerPrismaService.importAllData(
        body.projectId,
        propertyId,
        body.startDate || '',
        body.endDate || ''
      );

      return {
        success: true,
        message: 'Project set up successfully with Portfolio Manager data',
        data: result
      };
    } catch (error) {
      this.logger.error(`Error setting up project: ${error.message}`);
      return {
        success: false,
        error: `Failed to set up project: ${error.message}`
      };
    }
  }

  @Post('properties/:id/update-water-score')
  @ApiOperation({
    summary: 'Set up a project with Portfolio Manager data',
    description: 'Imports utility data from Portfolio Manager and associates it with a project'
  })
  @ApiParam({
    name: 'id',
    description: 'Portfolio Manager property ID',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Project set up successfully'
  })
  async updateWaterScore(
    @Param('id') propertyId: string,
    @Body() body: { projectId: string; }
  ) {
    try {
      // Use the Prisma implementation of the Portfolio Manager service
      const result = await this.portfolioManagerPrismaService.updateWaterScore(
        body.projectId,
        propertyId
      );

      return {
        success: true,
        message: 'Project set up successfully with Portfolio Manager data',
        data: result
      };
    } catch (error) {
      this.logger.error(`Error setting up project: ${error.message}`);
      return {
        success: false,
        error: `Failed to set up project: ${error.message}`
      };
    }
  }
}

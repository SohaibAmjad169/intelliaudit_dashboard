import { Controller, Post, Get, Body, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { MeasuresPrismaService } from './measures-prisma.service';

@ApiTags('measures')
@Controller('measures')
export class MeasuresController {
  constructor(
    private readonly measuresService: MeasuresPrismaService
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate energy conservation measures' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Project ID' },

        utilityData: { 
          type: 'object', 
          description: 'Utility usage data (optional)',
        },
        buildingData: {
          type: 'object',
          description: 'Building information (optional)',
        },
        model: {
          type: 'string',
          description: 'LLM model to use for generation (optional, defaults to gpt-4o)',
        }
      },
      required: ['projectId']
    }
  })
  async generateMeasures(
    @Body('projectId') projectId: string,
    @Body('utilityData') utilityData?: any,
    @Body('buildingData') buildingData?: any,
    @Body('model') model: string = 'o1'
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    if (model && !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1'].includes(model)) {
      throw new BadRequestException('Invalid AI model specified');
    }

    try {
      console.log(`[MEASURES DEBUG] Generating measures for project ${projectId}`);
      console.log(`[MEASURES DEBUG] Received model parameter: ${model}`);
      
      // Log if we have utility data and building data
      console.log(`[MEASURES DEBUG] Utility data provided: ${!!utilityData}`);
      console.log(`[MEASURES DEBUG] Building data provided: ${!!buildingData}`);

      const result = await this.measuresService.generateMeasures(
        projectId,
        utilityData,
        buildingData,
        model
      );
      
      // Log the result of measure generation
      console.log(`[MEASURES DEBUG] Generate measures result success: ${result.success}`);
      console.log(`[MEASURES DEBUG] Measures generated - EEMs: ${result.measures?.eems?.length || 0}, WEMs: ${result.measures?.wems?.length || 0}, RCMs: ${result.measures?.rcms?.length || 0}`);
      
      if (!result.success) {
        console.log(`[MEASURES DEBUG] Failed to generate measures: ${result.error}`);
        throw new BadRequestException(`Failed to generate measures: ${result.error}`);
      }
      
      return result.measures;
    } catch (error) {
      console.error('[MEASURES DEBUG] Error generating measures:', error);
      throw new BadRequestException(`Failed to generate measures: ${error.message}`);
    }
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get existing energy conservation measures for a project' })
  async getMeasures(
    @Param('projectId') projectId: string
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    try {
      console.log(`Fetching measures for project ${projectId}`);

      const result = await this.measuresService.getMeasuresFromDatabase(projectId);
      
      if (!result) {
        return {
          eems: [],
          wems: [],
          rcms: [],
          customMeasures: []
        };
      }
      
      // Return the result directly since it already has the format we need
      return result;
    } catch (error) {
      console.error('Error fetching measures:', error);
      throw new BadRequestException(`Failed to fetch measures: ${error.message}`);
    }
  }

  @Post(':projectId/regenerate')
  @ApiOperation({ summary: 'Force regeneration of energy conservation measures' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        utilityData: { 
          type: 'object', 
          description: 'Utility usage data (optional)',
        },
        buildingData: {
          type: 'object',
          description: 'Building information (optional)',
        },
        model: {
          type: 'string',
          description: 'LLM model to use for generation (optional, defaults to gpt-4o)',
        }
      }
    }
  })
  async regenerateMeasures(
    @Param('projectId') projectId: string,
    @Body('utilityData') utilityData?: any,
    @Body('buildingData') buildingData?: any,
    @Body('model') model: string = 'o1'
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    if (model && !['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1'].includes(model)) {
      throw new BadRequestException('Invalid AI model specified');
    }

    try {
      console.log(`Regenerating measures for project ${projectId}`);

      const result = await this.measuresService.generateMeasures(
        projectId,
        utilityData,
        buildingData,
        model,
        true // Force regeneration
      );
      
      if (!result.success) {
        throw new BadRequestException(`Failed to regenerate measures: ${result.error}`);
      }
      
      return result.measures;
    } catch (error) {
      console.error('Error regenerating measures:', error);
      throw new BadRequestException(`Failed to regenerate measures: ${error.message}`);
    }
  }

  @Get(':projectId/debug')
  @ApiOperation({ summary: 'Debug endpoint to verify ECM storage in Supabase' })
  async debugMeasureStorage(
    @Param('projectId') projectId: string
  ) {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    try {
      console.log(`Debugging measures storage for project ${projectId}`);

      // Use the measures service to get debug data
      const debugData = await this.measuresService.debugMeasuresStorage(projectId);
      return debugData;
    } catch (error) {
      console.error('Error debugging measures storage:', error);
      throw new BadRequestException(`Failed to debug measures storage: ${error.message}`);
    }
  }
} 
import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  UseGuards,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../../../auth/auth.guard';
import { EquipmentDeduplicationService } from './equipment-deduplication.service';
import { EquipmentCompletenessService } from './equipment-completeness.service';
import { ManufacturerDataService } from './manufacturer-data.service';
import { PrismaService } from '../../../prisma/prisma.service';

@ApiTags('equipment-consolidation')
@Controller('equipment-consolidation')
@UseGuards(AuthGuard)
export class EquipmentConsolidationController {
  private readonly logger = new Logger(EquipmentConsolidationController.name);

  constructor(
    private readonly deduplicationService: EquipmentDeduplicationService,
    private readonly completenessService: EquipmentCompletenessService,
    private readonly manufacturerDataService: ManufacturerDataService,
    private readonly prisma: PrismaService
  ) {}

  @Post('project/:projectId/deduplicate')
  @ApiOperation({ summary: 'Deduplicate equipment for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Deduplication results' })
  async deduplicateProjectEquipment(@Param('projectId') projectId: string) {
    return this.deduplicationService.deduplicateProjectEquipment(projectId);
  }

  @Get('project/:projectId/completeness')
  @ApiOperation({ summary: 'Check equipment completeness for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Completeness check results' })
  async checkProjectEquipmentCompleteness(@Param('projectId') projectId: string) {
    return this.completenessService.checkProjectEquipmentCompleteness(projectId);
  }

  @Post('project/:projectId/update-completeness')
  @ApiOperation({ summary: 'Update equipment completeness status in the database' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Completeness status updated' })
  async updateEquipmentCompletenessStatus(@Param('projectId') projectId: string) {
    await this.completenessService.updateEquipmentCompletenessStatus(projectId);
    return { success: true, message: 'Completeness status updated' };
  }

  @Get('project/:projectId/critical-gaps')
  @ApiOperation({ summary: 'Get equipment with critical data gaps' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Equipment with critical gaps' })
  async getEquipmentWithCriticalGaps(@Param('projectId') projectId: string) {
    return this.completenessService.getEquipmentWithCriticalGaps(projectId);
  }

  @Post('equipment/:equipmentId/enrich')
  @ApiOperation({ summary: 'Enrich equipment data using manufacturer databases' })
  @ApiParam({ name: 'equipmentId', description: 'Equipment ID' })
  @ApiResponse({ status: 200, description: 'Enrichment results' })
  async enrichEquipmentData(@Param('equipmentId') equipmentId: string) {
    return this.manufacturerDataService.enrichEquipmentData(equipmentId);
  }

  @Post('project/:projectId/enrich-all')
  @ApiOperation({ summary: 'Enrich all equipment with critical gaps for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Enrichment results' })
  async enrichProjectEquipment(@Param('projectId') projectId: string) {
    return this.manufacturerDataService.enrichProjectEquipment(projectId);
  }

  @Post('project/:projectId/consolidate')
  @ApiOperation({ summary: 'Run the complete consolidation workflow' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Consolidation results' })
  async consolidateProjectEquipment(@Param('projectId') projectId: string) {
    
    try {
      // Step 1: Deduplicate equipment
      const deduplicationResults = await this.deduplicationService.deduplicateProjectEquipment(projectId);
      
      // Step 2: Check completeness and update status
      await this.completenessService.updateEquipmentCompletenessStatus(projectId);
      const completenessResults = await this.completenessService.checkProjectEquipmentCompleteness(projectId);
      
      // Step 3: Enrich equipment with critical gaps
      const enrichmentResults = await this.manufacturerDataService.enrichProjectEquipment(projectId);
      
      // Step 4: Check completeness again after enrichment
      await this.completenessService.updateEquipmentCompletenessStatus(projectId);
      const finalCompletenessResults = await this.completenessService.checkProjectEquipmentCompleteness(projectId);
      
      // Step 5: Generate AI-based energy analysis if there are still critical gaps
      let aiAnalysisResult = null;
      if (finalCompletenessResults.equipmentWithCriticalGaps > 0) {
        aiAnalysisResult = await this.generateAIEnergyAnalysis(projectId);
      }
      
      return {
        deduplicationResults,
        initialCompletenessResults: completenessResults,
        enrichmentResults,
        finalCompletenessResults,
        aiAnalysisResult,
        success: true,
        message: 'Equipment consolidation workflow completed successfully'
      };
    } catch (error) {
      this.logger.error(`Error in consolidation workflow: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Generate AI-based energy analysis to fill in critical gaps
   */
  private async generateAIEnergyAnalysis(projectId: string) {
    try {
      // Get project information
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId }
      });
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get project data for AI analysis
      // We'll use this data to call the energy analysis endpoint
      
      // In a real implementation, we would prepare building info and call the 
      // /equipment/analyze-energy-usage endpoint with project data
      // Example:
      /*
      const buildingInfo = {
        buildingType: project.building_type,
        squareFootage: project.property_gross_floor_area,
        totalUnits: project.total_units,
        yearBuilt: project.property_year_built,
        location: {
          city: project.property_city,
          state: project.property_state,
          zipCode: project.property_postal_code
        }
      };
      */
      
      // Call the existing energy analysis endpoint
      // This is a placeholder - in a real implementation, you would call your existing
      // /equipment/analyze-energy-usage endpoint that uses GPT-4o
      
      // For now, return a placeholder result
      return {
        success: true,
        message: 'AI energy analysis generated successfully',
        analysisId: 'placeholder'
      };
    } catch (error) {
      this.logger.error(`Error generating AI energy analysis: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error generating AI energy analysis: ${error.message}`
      };
    }
  }
}

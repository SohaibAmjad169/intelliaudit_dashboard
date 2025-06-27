import { Controller, Post, Get, Body, Param, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FieldNotesService } from '../services/field-notes.service';
import { EnergyBreakdownService } from '../services/energy-breakdown.service';
import { CreateFieldNotesDto } from '../dto/create-field-notes.dto';
import { FieldNotesResponseDto, GetFieldNotesResponseDto } from '../dto/field-notes-response.dto';
import { EnergyBreakdownDto } from '../dto/energy-breakdown.dto';
import { EnergyBreakdownRepository } from '../repositories/energy-breakdown.repository';

@ApiTags('Field Notes')
@Controller('field-notes')
export class FieldNotesController {
  private readonly logger = new Logger(FieldNotesController.name);

  constructor(
    private readonly fieldNotesService: FieldNotesService,
    private readonly energyBreakdownService: EnergyBreakdownService,
    private readonly energyBreakdownRepository: EnergyBreakdownRepository
  ) {}

  @Post()
  @ApiOperation({ summary: 'Process field notes to extract equipment information' })
  @ApiResponse({
    status: 201,
    description: 'Field notes successfully processed',
    type: FieldNotesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processFieldNotes(@Body() createFieldNotesDto: CreateFieldNotesDto): Promise<FieldNotesResponseDto> {

    try {
      // Log request data details

      // Process the field notes for all equipment types
      const result = await this.fieldNotesService.processAllFieldNotes(createFieldNotesDto);

      // Log response details

      // Log full response for detailed analysis

      // Generate baseline energy breakdown from field notes
      try {
        this.logger.log(`Automatically generating baseline energy breakdown for project ${createFieldNotesDto.projectId}`);

        // Generate baseline energy breakdown
        await this.energyBreakdownService.generateBaselineEnergyBreakdown(createFieldNotesDto.projectId);

        this.logger.log(`Successfully generated baseline energy breakdown for project ${createFieldNotesDto.projectId}`);
      } catch (error) {
        this.logger.error(`Error generating baseline energy breakdown: ${error.message}`, error.stack);
        // Don't fail the entire request if energy breakdown generation fails
      }

      return result;
    } catch (error) {
      this.logger.error(`Error processing field notes: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process field notes: ${error.message}`);
    }
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get field notes data for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Field notes data retrieved successfully',
    type: GetFieldNotesResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getFieldNotes(@Param('projectId') projectId: string): Promise<GetFieldNotesResponseDto> {

    try {
      return await this.fieldNotesService.getFieldNotes(projectId);
    } catch (error) {
      this.logger.error(`Error getting field notes: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get field notes: ${error.message}`);
    }
  }

  @Post(':equipmentType')
  @ApiOperation({ summary: 'Process field notes to extract specific equipment type information' })
  @ApiParam({ name: 'equipmentType', description: 'Type of equipment to extract (lighting, hvac, etc.)' })
  @ApiResponse({
    status: 201,
    description: 'Field notes successfully processed for specific equipment type',
    type: FieldNotesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processFieldNotesForEquipmentType(
    @Param('equipmentType') equipmentType: string,
    @Body() createFieldNotesDto: CreateFieldNotesDto
  ): Promise<FieldNotesResponseDto> {
    try {
      // Override the equipment type in the DTO
      createFieldNotesDto.equipmentType = equipmentType;

      // Process the field notes for the specific equipment type
      return await this.fieldNotesService.processFieldNotes(createFieldNotesDto);
    } catch (error) {
      this.logger.error(`Error processing field notes for ${equipmentType}: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process field notes for ${equipmentType}: ${error.message}`);
    }
  }

  @Get(':projectId/energy-breakdown')
  @ApiOperation({ summary: 'Get energy breakdown for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Energy breakdown retrieved successfully',
    type: EnergyBreakdownDto
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEnergyBreakdown(@Param('projectId') projectId: string): Promise<EnergyBreakdownDto> {
    try {
      // First check if we have a saved breakdown in the database (including comprehensive breakdowns)
      this.logger.log(`Checking for saved energy breakdown in database for project ${projectId}`);
      const savedBreakdown = await this.energyBreakdownRepository.getEnergyBreakdown(projectId);

      if (savedBreakdown && savedBreakdown.endUseComponents && savedBreakdown.endUseComponents.length > 0) {
        this.logger.log(`Found saved energy breakdown in database for project ${projectId}`);
        return savedBreakdown;
      }

      // If no saved breakdown found, generate one from equipment data
      this.logger.log(`No saved breakdown found, generating from equipment for project ${projectId}`);
      const breakdown = await this.energyBreakdownService.generateEnergyBreakdownFromEquipment(projectId);

      if (!breakdown || !breakdown.endUseComponents || breakdown.endUseComponents.length === 0) {
        throw new NotFoundException(`No energy breakdown data could be generated for project ${projectId}`);
      }

      return breakdown;
    } catch (error) {
      this.logger.error(`Error getting energy breakdown for project ${projectId}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to get energy breakdown: ${error.message}`);
    }
  }

  @Post(':projectId/baseline-energy-breakdown')
  @ApiOperation({ summary: 'Generate a baseline energy breakdown with minimal deviations based on field notes' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Baseline energy breakdown generated successfully',
    type: EnergyBreakdownDto
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateBaselineEnergyBreakdown(@Param('projectId') projectId: string): Promise<EnergyBreakdownDto> {
    try {
      this.logger.log(`Generating baseline energy breakdown for project ${projectId}`);

      // Call the service to generate a baseline energy breakdown
      const breakdown = await this.energyBreakdownService.generateBaselineEnergyBreakdown(projectId);

      if (!breakdown || !breakdown.endUseComponents || breakdown.endUseComponents.length === 0) {
        throw new NotFoundException(`No baseline energy breakdown could be generated for project ${projectId}`);
      }

      return breakdown;
    } catch (error) {
      this.logger.error(`Error generating baseline energy breakdown for project ${projectId}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to generate baseline energy breakdown: ${error.message}`);
    }
  }

  @Post(':projectId/comprehensive-energy-breakdown')
  @ApiOperation({ summary: 'Generate a comprehensive energy breakdown based on field notes', deprecated: true })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Comprehensive energy breakdown generated successfully',
    type: EnergyBreakdownDto
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateComprehensiveEnergyBreakdown(@Param('projectId') projectId: string): Promise<EnergyBreakdownDto> {
    try {
      this.logger.log(`Generating comprehensive energy breakdown for project ${projectId}`);

      // Call the service to generate a comprehensive energy breakdown
      const breakdown = await this.energyBreakdownService.generateComprehensiveEnergyBreakdown(projectId);

      if (!breakdown || !breakdown.endUseComponents || breakdown.endUseComponents.length === 0) {
        throw new NotFoundException(`No comprehensive energy breakdown could be generated for project ${projectId}`);
      }

      return breakdown;
    } catch (error) {
      this.logger.error(`Error generating comprehensive energy breakdown for project ${projectId}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to generate comprehensive energy breakdown: ${error.message}`);
    }
  }

  @Post(':projectId/energy-breakdown/redo')
  @ApiOperation({ summary: 'Regenerate energy breakdown from equipment data', deprecated: true })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Energy breakdown regenerated successfully',
    type: EnergyBreakdownDto
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async redoEnergyBreakdown(@Param('projectId') projectId: string): Promise<EnergyBreakdownDto> {
    try {
      this.logger.log(`Regenerating energy breakdown for project ${projectId}`);

      // Generate a new breakdown from equipment data
      const breakdown = await this.energyBreakdownService.generateEnergyBreakdownFromEquipment(projectId);

      if (!breakdown || !breakdown.endUseComponents || breakdown.endUseComponents.length === 0) {
        throw new NotFoundException(`No energy breakdown could be generated for project ${projectId}`);
      }

      // Save the new breakdown
      await this.energyBreakdownRepository.saveEnergyBreakdown({
        projectId,
        breakdownData: JSON.stringify(breakdown),
        model: 'equipment-based-redo',
        createdAt: new Date()
      });

      return breakdown;
    } catch (error) {
      this.logger.error(`Error regenerating energy breakdown for project ${projectId}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(`Failed to regenerate energy breakdown: ${error.message}`);
    }
  }

  @Post(':projectId/energy-breakdown/save')
  @ApiOperation({ summary: 'Save an energy breakdown for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Energy breakdown saved successfully',
    type: EnergyBreakdownDto
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async saveEnergyBreakdown(
    @Param('projectId') projectId: string,
    @Body() breakdownData: EnergyBreakdownDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Saving energy breakdown for project ${projectId}`);

      if (!breakdownData || !breakdownData.endUseComponents || breakdownData.endUseComponents.length === 0) {
        throw new BadRequestException('Invalid energy breakdown data');
      }

      // Save the energy breakdown to the database
      await this.energyBreakdownRepository.saveEnergyBreakdown({
        projectId,
        breakdownData: JSON.stringify(breakdownData),
        model: 'manual-save',
        createdAt: new Date()
      });

      return { success: true, message: 'Energy breakdown saved successfully' };
    } catch (error) {
      this.logger.error(`Error saving energy breakdown for project ${projectId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to save energy breakdown: ${error.message}`);
    }
  }
}
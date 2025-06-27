import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  Query, 
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EquipmentAnalysisService } from './equipment-analysis.service';
import { CreateEquipmentAnalysisDto, UpdateEquipmentAnalysisDto } from './dto/equipment-analysis.dto';
import { AuthGuard } from '../../../auth/auth.guard';

@ApiTags('equipment-analysis')
@Controller('equipment-analysis')
@UseGuards(AuthGuard)
export class EquipmentAnalysisController {
  constructor(private readonly equipmentAnalysisService: EquipmentAnalysisService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new equipment analysis record' })
  @ApiResponse({ status: 201, description: 'The equipment analysis has been created' })
  async create(@Body() createDto: CreateEquipmentAnalysisDto) {
    return this.equipmentAnalysisService.create(createDto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all equipment analysis records for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of equipment analysis records' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.equipmentAnalysisService.findByProjectId(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an equipment analysis record by ID' })
  @ApiParam({ name: 'id', description: 'Equipment analysis ID' })
  @ApiResponse({ status: 200, description: 'The equipment analysis record' })
  async findOne(@Param('id') id: string) {
    return this.equipmentAnalysisService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an equipment analysis record' })
  @ApiParam({ name: 'id', description: 'Equipment analysis ID' })
  @ApiResponse({ status: 200, description: 'The updated equipment analysis record' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEquipmentAnalysisDto
  ) {
    return this.equipmentAnalysisService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an equipment analysis record' })
  @ApiParam({ name: 'id', description: 'Equipment analysis ID' })
  @ApiResponse({ status: 200, description: 'Success message' })
  async remove(@Param('id') id: string) {
    return this.equipmentAnalysisService.delete(id);
  }

  @Get('project/:projectId/category/:category')
  @ApiOperation({ summary: 'Get equipment analysis records by category' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'category', description: 'Equipment category (e.g., HVAC, Lighting)' })
  @ApiResponse({ status: 200, description: 'List of equipment analysis records' })
  async findByCategory(
    @Param('projectId') projectId: string,
    @Param('category') category: string
  ) {
    return this.equipmentAnalysisService.findByCategory(projectId, category);
  }

  @Get('project/:projectId/type')
  @ApiOperation({ summary: 'Get equipment analysis records by equipment type' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'type', description: 'Equipment type (e.g., "Split System", "LED")' })
  @ApiResponse({ status: 200, description: 'List of equipment analysis records' })
  async findByType(
    @Param('projectId') projectId: string,
    @Query('type') equipmentType: string
  ) {
    return this.equipmentAnalysisService.findByEquipmentType(projectId, equipmentType);
  }

  @Get('project/:projectId/energy')
  @ApiOperation({ summary: 'Calculate energy usage for all equipment in a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Energy usage summary' })
  async calculateProjectEnergy(@Param('projectId') projectId: string) {
    return this.equipmentAnalysisService.calculateProjectEnergy(projectId);
  }

  @Post('migrate-weekly-hours')
  @ApiOperation({ summary: 'Migrate days_per_week to weekly_hours for all equipment' })
  @ApiResponse({ status: 200, description: 'Migration completed successfully' })
  async migrateWeeklyHours() {
    await this.equipmentAnalysisService.migrateDaysPerWeekToWeeklyHours();
    return { message: 'Successfully migrated equipment records to use weekly_hours' };
  }
}

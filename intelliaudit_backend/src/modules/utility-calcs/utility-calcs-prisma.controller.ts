import { Controller, Get, Param } from '@nestjs/common';
import { UtilityCalcsPrismaService } from './utility-calcs-prisma.service';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Utility Calculations')
@Controller('utility-calcs')
export class UtilityCalcsPrismaController {
  constructor(private readonly utilityCalcsService: UtilityCalcsPrismaService) {}

  @Get('projects/:projectId/total-cost')
  @ApiOperation({ summary: 'Get total utility cost for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Total utility cost retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        totalCost: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error retrieving total cost' })
  async getTotalUtilityCost(@Param('projectId') projectId: string) {
    return this.utilityCalcsService.getTotalUtilityCost(projectId);
  }

  @Get('projects/:projectId/total-usage')
  @ApiOperation({ summary: 'Get total utility usage for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Total utility usage retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        usageByType: { type: 'object' },
        totalElectric: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error retrieving total usage' })
  async getTotalUtilityUsage(@Param('projectId') projectId: string) {
    return this.utilityCalcsService.getTotalUtilityUsage(projectId);
  }

  @Get('projects/:projectId/monthly/:energyType')
  @ApiOperation({ summary: 'Get monthly utility data by energy type' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'energyType', description: 'Energy type (electric, natural-gas, or water)' })
  @ApiResponse({
    status: 200,
    description: 'Monthly utility data retrieved successfully',
    type: [Object]
  })
  @ApiResponse({ status: 400, description: 'Error retrieving monthly utility data' })
  async getMonthlyData(
    @Param('projectId') projectId: string,
    @Param('energyType') energyType: string
  ) {
    let meterType: string;
    
    // Convert frontend energy type to backend meter type
    switch(energyType) {
      case 'electric':
        meterType = 'Electric';
        break;
      case 'natural-gas':
        meterType = 'Natural Gas';
        break;
      case 'water':
        meterType = 'Municipally Supplied Potable Water - Mixed Indoor/Outdoor';
        break;
      default:
        meterType = energyType;
    }
    
    return this.utilityCalcsService.getMonthlyDataByType(projectId, meterType);
  }

  /**
   * LEGACY: This endpoint is no longer used as the equipment_calcs table has been removed.
   * Keeping this commented out for reference.
   */
  /*
  @Get('projects/:projectId/equipment')
  @ApiOperation({ summary: 'Get equipment calculations for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Equipment calculations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error retrieving equipment calculations' })
  async getEquipmentCalcs(@Param('projectId') projectId: string) {
    return this.utilityCalcsService.getEquipmentCalcs(projectId);
  }
  */
}

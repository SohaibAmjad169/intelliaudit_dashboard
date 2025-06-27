import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EnergyBreakdownDto, SaveEnergyBreakdownDto } from '../dto/energy-breakdown.dto';
import { EquipmentItemDto } from '../dto/field-notes-response.dto';

@Injectable()
export class EnergyBreakdownRepository {
  private readonly logger = new Logger(EnergyBreakdownRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Save energy breakdown data to the database
   * If a record already exists for the project, it will be updated
   * @param data The energy breakdown data to save
   * @returns The saved energy breakdown record
   */
  async saveEnergyBreakdown(data: SaveEnergyBreakdownDto) {
    try {
      // Parse the breakdownData to get totals
      const parsedData = JSON.parse(data.breakdownData);
      
      // Check if a record already exists for this project
      const existingRecord = await (this.prisma as any)['energy_breakdown'].findFirst({
        where: {
          project_id: data.projectId
        }
      });
      
      if (existingRecord) {
        // Update the existing record
        this.logger.log(`Updating existing energy breakdown for project ${data.projectId}`);
        return await (this.prisma as any)['energy_breakdown'].update({
          where: {
            id: existingRecord.id
          },
          data: {
            breakdown_data: JSON.parse(data.breakdownData), // Store as JSON in the database
            model_used: data.model,
            updated_at: new Date(),
            total_electric_kwh: parsedData.totalActualElectric || 0,
            total_gas_therms: parsedData.totalActualGas || 0,
            total_steam_mmbtu: parsedData.totalActualSteam || 0,
            total_other_mmbtu: parsedData.totalActualOther || 0,
          },
        });
      } else {
        // Create a new record
        this.logger.log(`Creating new energy breakdown for project ${data.projectId}`);
        return await (this.prisma as any)['energy_breakdown'].create({
          data: {
            project_id: data.projectId,
            breakdown_data: JSON.parse(data.breakdownData), // Store as JSON in the database
            model_used: data.model,
            created_at: data.createdAt || new Date(),
            total_electric_kwh: parsedData.totalActualElectric || 0,
            total_gas_therms: parsedData.totalActualGas || 0,
            total_steam_mmbtu: parsedData.totalActualSteam || 0,
            total_other_mmbtu: parsedData.totalActualOther || 0,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error saving energy breakdown: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get energy breakdown for a project
   * @param projectId Project ID to get energy breakdown for
   * @returns Energy breakdown, or null if not found
   */
  async getEnergyBreakdown(projectId: string): Promise<EnergyBreakdownDto | null> {
    try {
      // Fetch the energy breakdown from the database
      const record = await (this.prisma as any)['energy_breakdown'].findFirst({
        where: {
          project_id: projectId
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      if (!record) {
        return null;
      }

      // Parse the JSON data
      const breakdownData = typeof record.breakdown_data === 'string'
        ? JSON.parse(record.breakdown_data)
        : record.breakdown_data;

      return breakdownData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get equipment analysis data for a project
   * @param projectId Project ID
   * @returns Array of equipment items
   */
  async getEquipmentAnalysis(projectId: string): Promise<EquipmentItemDto[]> {
    try {
      // Fetch equipment data from the equipment_analysis table
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId
        }
      });

      // Map database entities to DTOs
      return equipment.map(item => this.mapToDto(item));
    } catch (error) {
      this.logger.error(`Error getting equipment analysis for project ${projectId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get utility data for a project
   * @param projectId Project ID
   * @returns Utility data with total annual electric and gas usage
   */
  async getUtilityData(projectId: string): Promise<{ totalAnnualElectricKwh: number | null; totalAnnualGasTherms: number | null } | null> {
    try {
      // Try to get data from the utility_monthly_summary view first
      const summaryData = await this.prisma.$queryRaw<any[]>`
        SELECT
          SUM(total_electric_kwh) as total_annual_electric_kwh,
          SUM(total_gas_therms) as total_annual_gas_therms
        FROM utility_monthly_summary
        WHERE project_id = ${projectId}::uuid
        GROUP BY project_id
      `;

      if (summaryData && summaryData.length > 0) {
        const summary = summaryData[0];
        return {
          totalAnnualElectricKwh: summary.total_annual_electric_kwh ? Number(summary.total_annual_electric_kwh) : null,
          totalAnnualGasTherms: summary.total_annual_gas_therms ? Number(summary.total_annual_gas_therms) : null
        };
      }

      // If no summary data, calculate from utility_calcs
      const utilityCalcs = await this.prisma.utility_calcs.findMany({
        where: {
          project_id: projectId,
          meter_type: {
            in: ['Electric', 'Gas']
          }
        },
        select: {
          meter_type: true,
          usage: true
        }
      });

      if (!utilityCalcs || utilityCalcs.length === 0) {
        return null;
      }

      // Calculate totals by meter type
      let totalElectricKwh = 0;
      let totalGasTherms = 0;

      for (const calc of utilityCalcs) {
        if (calc.meter_type === 'Electric' && calc.usage) {
          totalElectricKwh += Number(calc.usage);
        } else if (calc.meter_type === 'Gas' && calc.usage) {
          totalGasTherms += Number(calc.usage);
        }
      }

      return {
        totalAnnualElectricKwh: totalElectricKwh > 0 ? totalElectricKwh : null,
        totalAnnualGasTherms: totalGasTherms > 0 ? totalGasTherms : null
      };
    } catch (error) {
      this.logger.error(`Error getting utility data for project ${projectId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get building info for a project
   * @param projectId Project ID
   * @returns Building info with type and total units
   */
  async getBuildingInfo(projectId: string): Promise<{ type: string, total_units?: number } | null> {
    try {
      // Fetch building info from the projects table
      const project = await this.prisma.projects.findUnique({
        where: {
          id: projectId
        },
        select: {
          building_type: true,
          total_units: true
        }
      });

      if (!project) {
        return null;
      }

      return {
        type: project.building_type || 'unknown',
        total_units: project.total_units ? Number(project.total_units) : undefined
      };
    } catch (error) {
      this.logger.error(`Error getting building info for project ${projectId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get project details including raw field notes
   * @param projectId Project ID
   * @returns Project details with raw notes
   */
  async getProjectDetails(projectId: string): Promise<{ id: string, raw_notes?: string } | null> {
    try {
      // Fetch project details from the projects table
      const project = await this.prisma.projects.findUnique({
        where: {
          id: projectId
        },
        select: {
          id: true,
          raw_notes: true
        }
      });

      if (!project) {
        return null;
      }

      return {
        id: project.id,
        raw_notes: project.raw_notes || undefined
      };
    } catch (error) {
      this.logger.error(`Error getting project details for project ${projectId}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Map database entity to DTO with proper type conversion
   */
  private mapToDto(entity: any): EquipmentItemDto {
    return {
      id: entity.id,
      equipment_type: entity.equipment_type,
      manufacturer: entity.manufacturer || undefined,
      model: entity.model || undefined,
      category: entity.category || undefined,
      quantity: entity.quantity ? Number(entity.quantity) : undefined,
      location: entity.location || undefined,
      energy_source: entity.energy_source || undefined,
      source_type: entity.source_type || 'field_notes',
      wattage: entity.wattage ? Number(entity.wattage) : undefined,
      capacity: entity.capacity || undefined,
      weekly_hours: entity.weekly_hours ? Number(entity.weekly_hours) : undefined,
      annual_kwh: entity.annual_kwh ? Number(entity.annual_kwh) : undefined,
      annual_therms: entity.annual_therms ? Number(entity.annual_therms) : undefined,
      lamps_per_fixture: entity.lamps_per_fixture ? Number(entity.lamps_per_fixture) : undefined,
      number_of_lamps: entity.number_of_lamps ? Number(entity.number_of_lamps) : undefined,
      lamp_type: entity.lamp_type || undefined,
      multiplier: entity.multiplier ? Number(entity.multiplier) : undefined,
      end_use_category: entity.end_use_category || undefined,
      efficiency: entity.efficiency ?
        (typeof entity.efficiency === 'string' ?
          JSON.parse(entity.efficiency) :
          entity.efficiency) :
        undefined,
      cooling_capacity_tons: entity.cooling_capacity_tons ? Number(entity.cooling_capacity_tons) : undefined,
      heating_capacity_mbh: entity.heating_capacity_mbh ? Number(entity.heating_capacity_mbh) : undefined,
      fuel_type: entity.fuel_type || undefined,
      serves: entity.serves || undefined,
      serial_number: entity.serial_number || undefined,
      year: entity.year ? Number(entity.year) : undefined,
      age: entity.age ? Number(entity.age) : undefined
    };
  }
}
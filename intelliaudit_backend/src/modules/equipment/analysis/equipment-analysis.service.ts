import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEquipmentAnalysisDto, UpdateEquipmentAnalysisDto } from './dto/equipment-analysis.dto';

@Injectable()
export class EquipmentAnalysisService {
  private readonly logger = new Logger(EquipmentAnalysisService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new equipment analysis record
   */
  async create(createDto: CreateEquipmentAnalysisDto) {
    
    try {
      // Handle JSON fields properly
      const data = this.prepareDataForPrisma(createDto);
      
      const result = await this.prisma.equipment_analysis.create({
        data
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error creating equipment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find all equipment analysis records for a project
   */
  async findByProjectId(projectId: string) {
    
    try {
      const results = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return results;
    } catch (error) {
      this.logger.error(`Error finding equipment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find equipment analysis by ID
   */
  async findById(id: string) {
    
    try {
      const result = await this.prisma.equipment_analysis.findUnique({
        where: { id }
      });
      
      if (!result) {
        this.logger.warn(`Equipment analysis with ID ${id} not found`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error finding equipment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an equipment analysis record
   */
  async update(id: string, updateDto: UpdateEquipmentAnalysisDto) {
    
    try {
      // Handle JSON fields properly
      const data = this.prepareDataForPrisma(updateDto);
      
      const result = await this.prisma.equipment_analysis.update({
        where: { id },
        data
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error updating equipment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete an equipment analysis record
   */
  async delete(id: string) {
    
    try {
      await this.prisma.equipment_analysis.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting equipment analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find equipment analysis records by category
   */
  async findByCategory(projectId: string, category: string) {
    
    try {
      const results = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          category: {
            equals: category,
            mode: 'insensitive'
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return results;
    } catch (error) {
      this.logger.error(`Error finding ${category} equipment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find equipment analysis records by equipment type
   */
  async findByEquipmentType(projectId: string, equipmentType: string) {
    
    try {
      const results = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          equipment_type: {
            contains: equipmentType,
            mode: 'insensitive'
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      return results;
    } catch (error) {
      this.logger.error(`Error finding ${equipmentType} equipment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate energy usage for all equipment in a project
   */
  async calculateProjectEnergy(projectId: string) {
    
    try {
      const equipment = await this.findByProjectId(projectId);
      
      let totalKwh = 0;
      let totalTherms = 0;
      
      // Define the type for the energy category data
      interface EnergyCategoryData {
        kwh: number;
        therms: number;
        count: number;
      }
      
      // Use Record to properly type the object with string keys
      const energyByCategory: Record<string, EnergyCategoryData> = {};
      
      for (const item of equipment) {
        const category = item.category || 'Other';
        
        if (!energyByCategory[category]) {
          energyByCategory[category] = {
            kwh: 0,
            therms: 0,
            count: 0
          };
        }
        
        // Add kWh if available
        if (item.annual_kwh) {
          const kwh = parseFloat(item.annual_kwh.toString());
          totalKwh += kwh;
          energyByCategory[category].kwh += kwh;
        }
        
        // Add therms if available
        if (item.annual_therms) {
          const therms = parseFloat(item.annual_therms.toString());
          totalTherms += therms;
          energyByCategory[category].therms += therms;
        }
        
        energyByCategory[category].count++;
      }
      
      return {
        totalKwh,
        totalTherms,
        energyByCategory,
        equipmentCount: equipment.length
      };
    } catch (error) {
      this.logger.error(`Error calculating project energy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Migrate days_per_week to weekly_hours for all equipment
   */
  async migrateDaysPerWeekToWeeklyHours() {
    try {
      // Get all equipment with days_per_week but no weekly_hours
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          days_per_week: { not: null },
          weekly_hours: null
        }
      });

      // Update each equipment item
      for (const item of equipment) {
        const daysPerWeek = Number(item.days_per_week) || 7;
        const operatingHours = Number(item.operating_hours) || 24;
        const weeklyHours = daysPerWeek * operatingHours;

        await this.prisma.equipment_analysis.update({
          where: { id: item.id },
          data: {
            weekly_hours: weeklyHours,
            // Update annual_hours based on new weekly_hours
            annual_hours: weeklyHours * 52,
            // Update annual_kwh if wattage exists
            ...(item.wattage ? {
              annual_kwh: (Number(item.wattage) * weeklyHours * 52) / 1000
            } : {})
          }
        });
      }

      // Log success
      this.logger.log(`Successfully migrated ${equipment.length} equipment records from days_per_week to weekly_hours`);
    } catch (error) {
      this.logger.error('Error migrating days_per_week to weekly_hours:', error);
      throw error;
    }
  }

  /**
   * Prepare data for Prisma by handling JSON fields
   */
  private prepareDataForPrisma(dto: CreateEquipmentAnalysisDto | UpdateEquipmentAnalysisDto) {
    const data: any = { ...dto };
    
    // Handle JSON fields
    if (data.specifications && typeof data.specifications !== 'string') {
      data.specifications = data.specifications;
    }
    
    if (data.condition && typeof data.condition !== 'string') {
      data.condition = data.condition;
    }
    
    if (data.location && typeof data.location !== 'string' && typeof data.location !== 'object') {
      data.location = JSON.stringify(data.location);
    } else if (typeof data.location === 'object') {
      data.location = JSON.stringify(data.location);
    }
    
    if (data.photos && typeof data.photos !== 'string') {
      data.photos = JSON.stringify(data.photos);
    }
    
    // Remove id from data if it's an update operation
    if ('id' in dto && dto.constructor.name === 'UpdateEquipmentAnalysisDto') {
      delete data.id;
    }
    
    return data;
  }
}

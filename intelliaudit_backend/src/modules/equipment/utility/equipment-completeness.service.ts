import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { equipment_analysis } from '@prisma/client';

// Define required fields by equipment category
const REQUIRED_FIELDS: Record<string, string[]> = {
  'HVAC': [
    'equipment_type',
    'manufacturer',
    'model',
    'cooling_efficiency',
    'heating_efficiency',
    'capacity',
    'refrigerant_type',
    'wattage',
    'annual_hours'
  ],
  'Lighting': [
    'equipment_type',
    'lighting_type',
    'wattage',
    'quantity',
    'weekly_hours'
  ],
  'DHW': [
    'equipment_type',
    'manufacturer',
    'model',
    'capacity',
    'fuel_type',
    'efficiency',
    'recovery_rate'
  ],
  'Water Fixture': [
    'equipment_type',
    'flow_rate_gpm',
    'quantity',
    'daily_usage'
  ],
  'Laundry': [
    'equipment_type',
    'manufacturer',
    'model',
    'water_usage_per_cycle',
    'cycles_per_week',
    'energy_source'
  ],
  'Irrigation': [
    'equipment_type',
    'irrigation_area',
    'irrigation_schedule',
    'flow_rate_gpm'
  ],
  'Appliance': [
    'equipment_type',
    'manufacturer',
    'model',
    'wattage',
    'energy_source',
    'energy_star_rated'
  ],
  // Default for any other category
  'default': [
    'equipment_type',
    'manufacturer',
    'model',
    'wattage',
    'quantity',
    'weekly_hours'
  ]
};

// Define critical fields that are absolutely necessary for energy calculations
const CRITICAL_FIELDS: Record<string, string[]> = {
  'HVAC': [
    'wattage',
    'weekly_hours',
    'capacity'
  ],
  'Lighting': [
    'wattage',
    'quantity',
    'weekly_hours'
  ],
  'DHW': [
    'capacity',
    'fuel_type',
    'efficiency'
  ],
  'Water Fixture': [
    'flow_rate_gpm',
    'daily_usage'
  ],
  'Laundry': [
    'water_usage_per_cycle',
    'cycles_per_week',
    'energy_source'
  ],
  'Irrigation': [
    'irrigation_area',
    'flow_rate_gpm'
  ],
  'Appliance': [
    'wattage',
    'energy_source',
    'weekly_hours'
  ],
  // Default for any other category
  'default': [
    'wattage',
    'quantity',
    'weekly_hours'
  ]
};

interface CompletenessResult {
  id: string;
  equipment_type: string;
  category: string;
  completenessScore: number;
  missingFields: string[];
  missingCriticalFields: string[];
  hasCriticalGaps: boolean;
}

@Injectable()
export class EquipmentCompletenessService {
  private readonly logger = new Logger(EquipmentCompletenessService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check completeness of all equipment for a project
   */
  async checkProjectEquipmentCompleteness(projectId: string): Promise<{
    overallCompleteness: number;
    equipmentResults: CompletenessResult[];
    equipmentWithCriticalGaps: number;
    totalEquipment: number;
  }> {
    
    try {
      // Get all equipment for the project
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: { 
          project_id: projectId,
          // Use a filter for is_duplicate if it exists
          ...(this.prisma.equipment_analysis.fields.is_duplicate ? { is_duplicate: false } : {})
        }
      });
      
      
      // Check completeness for each item
      const results: CompletenessResult[] = [];
      let totalScore = 0;
      let equipmentWithCriticalGaps = 0;
      
      for (const item of equipment) {
        const result = this.checkEquipmentCompleteness(item);
        results.push(result);
        
        totalScore += result.completenessScore;
        if (result.hasCriticalGaps) {
          equipmentWithCriticalGaps++;
        }
      }
      
      // Calculate overall completeness
      const overallCompleteness = equipment.length > 0 
        ? totalScore / equipment.length 
        : 0;
      
      
      return {
        overallCompleteness,
        equipmentResults: results,
        equipmentWithCriticalGaps,
        totalEquipment: equipment.length
      };
    } catch (error) {
      this.logger.error(`Error checking equipment completeness: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Check completeness of a single equipment item
   */
  checkEquipmentCompleteness(equipment: equipment_analysis): CompletenessResult {
    const category = equipment.category || 'default';
    
    // Get required fields for this category
    const categoryKey = category as string;
    const requiredFields = REQUIRED_FIELDS[categoryKey] || REQUIRED_FIELDS['default'];
    const criticalFields = CRITICAL_FIELDS[categoryKey] || CRITICAL_FIELDS['default'];
    
    // Check which fields are missing
    const missingFields = requiredFields.filter((field: string) => {
      const value = equipment[field as keyof equipment_analysis];
      return value === null || value === undefined || value === '';
    });
    
    // Check which critical fields are missing
    const missingCriticalFields = criticalFields.filter((field: string) => {
      const value = equipment[field as keyof equipment_analysis];
      return value === null || value === undefined || value === '';
    });
    
    // Calculate completeness score (0-1)
    const completenessScore = 1 - (missingFields.length / requiredFields.length);
    
    return {
      id: equipment.id,
      equipment_type: equipment.equipment_type || 'Unknown',
      category: category,
      completenessScore,
      missingFields,
      missingCriticalFields,
      hasCriticalGaps: missingCriticalFields.length > 0
    };
  }
  
  /**
   * Get equipment items with critical data gaps
   */
  async getEquipmentWithCriticalGaps(projectId: string): Promise<any[]> {
    const { equipmentResults } = await this.checkProjectEquipmentCompleteness(projectId);
    
    // Get IDs of equipment with critical gaps
    const idsWithGaps = equipmentResults
      .filter(result => result.hasCriticalGaps)
      .map(result => result.id);
    
    // Fetch the full equipment records
    if (idsWithGaps.length === 0) {
      return [];
    }
    
    return this.prisma.equipment_analysis.findMany({
      where: {
        id: { in: idsWithGaps }
      }
    });
  }
  
  /**
   * Update equipment completeness status in the database
   */
  async updateEquipmentCompletenessStatus(projectId: string): Promise<void> {
    const { equipmentResults } = await this.checkProjectEquipmentCompleteness(projectId);
    
    // Update each equipment item with its completeness status
    for (const result of equipmentResults) {
      // Create an update data object with only the fields that exist in the schema
      const updateData: any = {};
      
      // Check if each field exists in the Prisma schema before adding it
      if (this.prisma.equipment_analysis.fields.completeness_score) {
        updateData.completeness_score = result.completenessScore;
      }
      
      if (this.prisma.equipment_analysis.fields.has_critical_gaps) {
        updateData.has_critical_gaps = result.hasCriticalGaps;
      }
      
      if (this.prisma.equipment_analysis.fields.missing_fields) {
        updateData.missing_fields = JSON.stringify(result.missingFields);
      }
      
      if (this.prisma.equipment_analysis.fields.missing_critical_fields) {
        updateData.missing_critical_fields = JSON.stringify(result.missingCriticalFields);
      }
      
      // Only update if we have fields to update
      if (Object.keys(updateData).length > 0) {
        await this.prisma.equipment_analysis.update({
          where: { id: result.id },
          data: updateData
        });
      }
    }
    
  }
}

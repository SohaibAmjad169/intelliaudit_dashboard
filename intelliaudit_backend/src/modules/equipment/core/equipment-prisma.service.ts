import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Normalizes a UUID by ensuring all segments have the correct length.
 * Pads segments with leading zeros if they're too short.
 */
function normalizeUUID(uuid: string): string {
  if (!uuid || !uuid.includes('-')) return uuid;

  // Standard UUID segment lengths
  const segmentLengths = [8, 4, 4, 4, 12];

  // Split the UUID into segments
  const segments = uuid.split('-');

  // If we don't have exactly 5 segments, return as is
  if (segments.length !== 5) return uuid;

  // Pad each segment to its required length
  const normalizedSegments = segments.map((segment, index) => {
    const expectedLength = segmentLengths[index];
    if (segment.length < expectedLength) {
      return segment.padStart(expectedLength, '0');
    }
    return segment;
  });

  // Join segments back together
  return normalizedSegments.join('-');
}

@Injectable()
export class EquipmentPrismaService {
  private readonly logger = new Logger(EquipmentPrismaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find equipment data by project ID
   * @param projectId The project ID
   * @returns Array of equipment items
   */
  async findByProjectId(projectId: string): Promise<any[]> {
    try {
      // Normalize the project ID
      const normalizedProjectId = normalizeUUID(projectId);

      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: normalizedProjectId
        },
        select: {
          id: true,
          equipment_type: true,
          quantity: true,
          location: true,
          wattage: true,
          annual_kwh: true,
          annual_therms: true,
          condition: true,
          manufacturer: true,
          model: true,
          specifications: true,
          source_type: true,
          operating_hours: true,
          days_per_week: true,
          created_at: true,
          weekly_hours: true,
          annual_hours: true,
          lamps_per_fixture: true,
          multiplier: true,
          end_use_category: true,
          lamp_type: true
        }
      });

      // Format the equipment data for analysis
      return this.formatEquipmentForAnalysis(equipment);

    } catch (error) {
      this.logger.error(`Error in findByProjectId: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Format equipment data for energy analysis
   * @param equipmentData Raw equipment data from database
   * @returns Formatted equipment data for analysis
   */
  private formatEquipmentForAnalysis(equipmentData: any[]): any[] {
    return equipmentData.map(item => {
      // Get wattage from specifications if available
      let wattage = Number(item.specifications?.wattage || item.wattage || 0);

      // Calculate weekly hours if not already present
      let weeklyHours = Number(item.weekly_hours || 0);

      // Calculate annual kWh if not already present
      let annualKwh = Number(item.annual_kwh || 0);
      if (!annualKwh && wattage && weeklyHours) {
        // Annual kWh = wattage (W) * weekly hours * 52 weeks / 1000
        annualKwh = (wattage * weeklyHours * 52) / 1000;
      }

      // Extract lamp type from specifications or use the direct field
      let lampType = item.lamp_type;
      if (!lampType && item.specifications) {
        // Try to extract from specifications
        lampType = item.specifications.lampType || item.specifications.lamp_type;

        // If still not found, try to infer from equipment_type for lighting equipment
        if (!lampType && item.equipment_type &&
            (item.equipment_type.toLowerCase().includes('light') ||
             item.equipment_type.toLowerCase().includes('lamp') ||
             item.equipment_type.toLowerCase().includes('fixture'))) {

          const type = item.equipment_type.toLowerCase();
          if (type.includes('led')) lampType = 'LED';
          else if (type.includes('cfl')) lampType = 'CFL';
          else if (type.includes('t-8') || type.includes('t8')) lampType = 'T-8';
          else if (type.includes('incandescent')) lampType = 'Incandescent';
          else if (type.includes('halogen')) lampType = 'Halogen';
          else if (type.includes('fluorescent')) {
            if (type.includes('compact')) lampType = 'CFL';
            else lampType = 'Fluorescent';
          }
        }
      }

      // Calculate number of lamps (quantity × lamps_per_fixture)
      let numberOfLamps = item.number_of_lamps;
      if (!numberOfLamps && item.quantity && item.lamps_per_fixture) {
        numberOfLamps = Math.round(Number(item.quantity) * Number(item.lamps_per_fixture));
      }

      // Check for zero values in critical fields
      const flags = [];
      const quantity = Number(item.quantity || 0);

      if (quantity === 0) flags.push('zero_quantity');
      if (wattage === 0) flags.push('zero_wattage');
      if (weeklyHours === 0) flags.push('zero_weekly_hours');
      if (annualKwh === 0) flags.push('zero_annual_kwh');

      // Log for debugging
      if (flags.length > 0) {
        this.logger.debug(`Equipment ${item.equipment_type} has flags: ${flags.join(', ')}`);
      }

      const formattedItem = {
        id: item.id,
        equipment_type: item.equipment_type || item.type || 'Unknown',
        quantity: quantity,
        location: item.location || 'Unknown',
        wattage: wattage,
        annual_kwh: annualKwh,
        annual_therms: item.annual_therms,
        condition: item.condition,
        manufacturer: item.manufacturer || item.make,
        model: item.model,
        lamps_per_fixture: item.lamps_per_fixture,
        number_of_lamps: numberOfLamps,
        multiplier: item.multiplier || 1.0,
        end_use_category: item.end_use_category,
        lamp_type: lampType,
        specifications: item.specifications || {},
        source_type: item.source_type,
        operating_hours: Number(item.operating_hours || 0),
        days_per_week: Number(item.days_per_week || 0),
        weekly_hours: weeklyHours,
        created_at: item.created_at,
        flags: flags
      };

      return formattedItem;
    }).filter(item => item.equipment_type !== 'Unknown'); // Filter out items with no type
  }

  /**
   * Find all analysis data (equipment and photos) by project ID
   * @param projectId The project ID
   * @param filters Optional filters for category and type
   * @returns Combined array of equipment and photo analysis items
   */
  async findAllAnalysis(projectId: string, filters?: { category?: string; type?: string }): Promise<any[]> {
    try {
      // Normalize the project ID
      const normalizedProjectId = normalizeUUID(projectId);

      // Add a safeguard to check if the projectId is a valid UUID
      if (!this.isValidUUID(normalizedProjectId)) {
        this.logger.warn(`Invalid project ID format: ${normalizedProjectId}`);
        return [];
      }

      // Build the WHERE clause based on filters
      const where: any = {
        project_id: normalizedProjectId
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.type) {
        where.equipment_type = {
          contains: filters.type,
          mode: 'insensitive'
        };
      }

      // Use Prisma's built-in query builder instead of raw SQL
      const equipment = await this.prisma.equipment_analysis.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        },
        select: {
          id: true,
          equipment_type: true,
          quantity: true,
          location: true,
          wattage: true,
          annual_kwh: true,
          annual_therms: true,
          condition: true,
          manufacturer: true,
          model: true,
          specifications: true,
          source_type: true,
          operating_hours: true,
          days_per_week: true,
          created_at: true,
          weekly_hours: true,
          annual_hours: true,
          lamps_per_fixture: true,
          multiplier: true,
          end_use_category: true,
          lamp_type: true
        }
      });

      // Use the formatEquipmentForAnalysis method to properly handle calculations
      return this.formatEquipmentForAnalysis(equipment);
    } catch (error) {
      this.logger.error(`Error in findAllAnalysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Attempts to clean up invalid records in the database
   */
  public async cleanupInvalidRecords(projectId: string): Promise<void> {
    try {
      // Project ID is already normalized at this point

      // Find invalid UUIDs in the table
      const invalidRecords = await this.prisma.$queryRaw`
        SELECT id FROM equipment_analysis
        WHERE project_id = ${projectId}::uuid
        AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `;

      if (Array.isArray(invalidRecords) && invalidRecords.length > 0) {
        this.logger.warn(`Found ${invalidRecords.length} invalid UUID records to clean up`);

        // Delete invalid records using raw query
        await this.prisma.$executeRaw`
          DELETE FROM equipment_analysis
          WHERE project_id = ${projectId}::uuid
          AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        `;

      }
    } catch (error) {
      this.logger.error('Failed to clean up invalid records:', error);
    }
  }

  /**
   * Validates if a string is a proper UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Process numeric fields to ensure they're stored as numbers
   * @param data Data object with potentially string numeric values
   * @returns Data object with numeric values converted to numbers
   */
  private processNumericFields(data: any): any {
    const numericFields = [
      'quantity',
      'wattage',
      'annual_kwh',
      'annual_therms',
      'operating_hours',
      'days_per_week',
      'weekly_hours',
      'annual_hours',
      'lamps_per_fixture',
      'number_of_lamps',
      'multiplier',
      'capacity',
      'cooling_capacity_tons',
      'heating_capacity_mbh',
      'year',
      'age'
    ];

    const processedData = { ...data };

    // Convert string numeric values to actual numbers
    for (const field of numericFields) {
      if (field in processedData && processedData[field] !== null && processedData[field] !== undefined) {
        // If it's a string that represents a number, convert it
        if (typeof processedData[field] === 'string' && !isNaN(Number(processedData[field]))) {
          processedData[field] = Number(processedData[field]);
          this.logger.debug(`Converted ${field} from string to number: ${processedData[field]}`);
        }
      }
    }

    return processedData;
  }

  /**
   * Find a single equipment item by ID
   * @param id Equipment ID
   * @returns Equipment item or null if not found
   */
  async findUniqueAnalysis(id: string): Promise<any | null> {
    try {
      // ID is already normalized at this point
      const equipment = await this.prisma.equipment_analysis.findUnique({
        where: { id }
      });

      if (!equipment) {
        this.logger.warn(`Equipment with ID ${id} not found`);
        return null;
      }

      return equipment;
    } catch (error) {
      this.logger.error(`Error fetching equipment by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update equipment by ID
   * @param id Equipment ID
   * @param data Updated equipment data
   * @returns Updated equipment item
   */
  async updateEquipment(id: string, data: any): Promise<any> {
    try {
      // Normalize the UUID
      const normalizedId = normalizeUUID(id);

      // Validate UUID
      if (!this.isValidUUID(normalizedId)) {
        this.logger.warn(`Invalid equipment ID format: ${normalizedId}`);
        return { error: 'Invalid equipment ID format' };
      }

      // Remove any fields that shouldn't be updated directly
      const { id: _, created_at, updated_at, ...rawUpdateData } = data;

      // Process numeric fields to ensure they're stored as numbers
      const updateData = this.processNumericFields(rawUpdateData);

      // Update the equipment record with normalized ID
      const updatedEquipment = await this.prisma.equipment_analysis.update({
        where: { id: normalizedId },
        data: updateData
      });

      return updatedEquipment;
    } catch (error) {
      this.logger.error(`Error updating equipment with ID ${id}:`, error);
      throw error;
    }
  }
}

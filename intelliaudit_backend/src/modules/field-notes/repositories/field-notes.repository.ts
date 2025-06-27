import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EquipmentItemDto } from '../dto/field-notes-response.dto';

@Injectable()
export class FieldNotesRepository {
  private readonly logger = new Logger(FieldNotesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save raw field notes to the projects table
   * @param projectId Project ID
   * @param notes Raw field notes text
   */
  async saveRawNotes(
    projectId: string,
    notes: string
  ): Promise<void> {
    try {
      await this.prisma.projects.update({
        where: { id: projectId },
        data: { raw_notes: notes }
      });

    } catch (error) {
      this.logger.error(`Error saving raw notes for project ${projectId}:`, error);
      throw new Error(`Failed to save raw notes: ${error.message}`);
    }
  }

  /**
   * Save raw field notes to the projects table using a transaction
   * @param tx Prisma transaction
   * @param projectId Project ID
   * @param notes Raw field notes text
   */
  async saveRawNotesWithTransaction(
    tx: Prisma.TransactionClient,
    projectId: string,
    notes: string
  ): Promise<void> {
    try {
      await tx.projects.update({
        where: { id: projectId },
        data: { raw_notes: notes }
      });

    } catch (error) {
      this.logger.error(`Error saving raw notes for project ${projectId} with transaction:`, error);
      throw new Error(`Failed to save raw notes with transaction: ${error.message}`);
    }
  }

  /**
   * Get raw field notes for a project
   * @param projectId Project ID
   * @returns Raw field notes text
   */
  async getRawNotes(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: { raw_notes: true }
      });

      return project?.raw_notes || null;
    } catch (error) {
      this.logger.error(`Error getting raw notes for project ${projectId}:`, error);
      throw new Error(`Failed to get raw notes: ${error.message}`);
    }
  }

  /**
   * Save processed equipment to the equipment_analysis table
   * @param equipment Array of equipment items
   * @param projectId Project ID
   * @param aiModel AI model used for processing
   */
  async saveEquipment(
    equipment: EquipmentItemDto[],
    projectId: string,
    aiModel: string
  ): Promise<EquipmentItemDto[]> {
    try {
      const savedEquipment = [];

      // Process each equipment item individually
      for (const item of equipment) {
        const data = {
          project_id: projectId,
          equipment_type: item.equipment_type,
          manufacturer: item.manufacturer || null,
          model: item.model || null,
          category: item.category || null,
          quantity: item.quantity || 1,
          location: item.location || null,
          energy_source: item.energy_source || null,
          source_type: 'field_notes',
          ai_model: aiModel,
          created_at: new Date(),
          updated_at: new Date(),
          wattage: item.wattage || null,
          capacity: item.capacity || null,
          weekly_hours: item.weekly_hours || null,
          days_per_week: item.days_per_week || null,
          annual_hours: item.annual_hours || null,
          annual_kwh: item.annual_kwh || null,
          annual_therms: item.energy_source?.toLowerCase() === 'gas' ? (item.annual_kwh ? item.annual_kwh / 29.3 : null) : null,
          input_rating: item.input_rating || null,
          efficiency: item.efficiency || null,
          efficiency_unit: item.efficiency_unit || null,
          temperature_rise: item.temperature_rise || null,
          load_factor: item.load_factor || 1.0,
          multiplier: item.multiplier || 1.0,
          lamps_per_fixture: item.lamps_per_fixture || 1.0,
          number_of_lamps: item.number_of_lamps || null,
          lamp_type: item.lamp_type || null,
          flow_rate: item.flow_rate !== null && item.flow_rate !== undefined ? String(item.flow_rate) : null,
          confidence: item.confidence || null,
          assumptions: item.assumptions ? (item.assumptions as Prisma.InputJsonValue) : { dbgenerated: 'null' },
          recommendations: item.recommendations || null,
          end_use_category: item.end_use_category || null,
          is_calculation_verified: false
        };

        const savedItem = await this.prisma.equipment_analysis.create({
          data
        });

        savedEquipment.push(this.mapToDto(savedItem));
      }

      return savedEquipment;
    } catch (error) {
      this.logger.error(`Error saving equipment for project ${projectId}:`, error);
      throw new Error(`Failed to save equipment: ${error.message}`);
    }
  }

  /**
   * Save processed equipment to the equipment_analysis table using a transaction
   * @param tx Prisma transaction
   * @param equipment Array of equipment items
   * @param projectId Project ID
   * @param aiModel AI model used for processing
   */
  async saveEquipmentWithTransaction(
    tx: Prisma.TransactionClient,
    equipment: EquipmentItemDto[],
    projectId: string,
    aiModel: string
  ): Promise<EquipmentItemDto[]> {
    try {
      const equipmentData = equipment.map(item => ({
        project_id: projectId,
        equipment_type: item.equipment_type,
        manufacturer: item.manufacturer || null,
        model: item.model || null,
        category: item.category || null,
        quantity: item.quantity || 1,
        location: item.location || null,
        energy_source: item.energy_source || null,
        source_type: 'field_notes',
        ai_model: aiModel,
        created_at: new Date(),
        updated_at: new Date(),
        wattage: item.wattage || null,
        capacity: item.capacity || null,
        weekly_hours: item.weekly_hours || null,
        days_per_week: item.days_per_week || null,
        annual_hours: item.annual_hours || null,
        annual_kwh: item.annual_kwh || null,
        annual_therms: item.energy_source?.toLowerCase() === 'gas' ? (item.annual_kwh ? item.annual_kwh / 29.3 : null) : null,
        input_rating: item.input_rating || null,
        efficiency: item.efficiency ? JSON.stringify(item.efficiency) : null,
        efficiency_unit: item.efficiency_unit || null,
        temperature_rise: item.temperature_rise || null,
        load_factor: item.load_factor || 1.0,
        multiplier: item.multiplier || 1.0,
        lamps_per_fixture: item.lamps_per_fixture || 1.0,
        number_of_lamps: item.number_of_lamps || null,
        lamp_type: item.lamp_type || null,
        flow_rate: item.flow_rate !== null && item.flow_rate !== undefined ? String(item.flow_rate) : null,
        confidence: item.confidence || null,
        assumptions: item.assumptions ? (item.assumptions as Prisma.InputJsonValue) : { dbgenerated: 'null' },
        recommendations: item.recommendations || null,
        end_use_category: item.end_use_category || null,
        is_calculation_verified: false
      }));

      // Create equipment records in a single transaction
      await tx.equipment_analysis.createMany({
        data: equipmentData
      });


      // Get the created equipment with IDs
      const savedEquipment = await tx.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          source_type: 'field_notes'
        },
        orderBy: {
          created_at: 'desc'
        },
        take: equipment.length
      });

      return savedEquipment.map(item => this.mapToDto(item));
    } catch (error) {
      this.logger.error(`Error saving equipment for project ${projectId} with transaction:`, error);
      throw new Error(`Failed to save equipment with transaction: ${error.message}`);
    }
  }

  /**
   * Get all equipment for a project with source_type 'field_notes'
   * @param projectId Project ID
   * @returns Array of equipment items
   */
  async getEquipmentByProject(projectId: string): Promise<EquipmentItemDto[]> {
    try {
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          source_type: 'field_notes'
        }
      });

      return equipment.map(item => this.mapToDto(item));
    } catch (error) {
      this.logger.error(`Error getting equipment for project ${projectId}:`, error);
      throw new Error(`Failed to get equipment: ${error.message}`);
    }
  }

  /**
   * Process field notes and save results in a single transaction
   * @param projectId Project ID
   * @param notes Raw field notes text
   * @param equipment Processed equipment items
   * @param aiModel AI model used for processing
   */
  async processFieldNotesTransaction(
    projectId: string,
    notes: string,
    equipment: EquipmentItemDto[],
    aiModel: string
  ): Promise<EquipmentItemDto[]> {
    try {
      // Use a transaction to ensure all database operations succeed or fail together
      return await this.prisma.$transaction(async (tx) => {
        // Save raw notes
        await this.saveRawNotesWithTransaction(tx, projectId, notes);

        // Save equipment
        const savedEquipment = await this.saveEquipmentWithTransaction(
          tx,
          equipment,
          projectId,
          aiModel
        );

        return savedEquipment;
      });
    } catch (error) {
      this.logger.error(`Error in field notes transaction for project ${projectId}:`, error);
      throw new Error(`Transaction failed: ${error.message}`);
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
      efficiency: entity.efficiency ?
        (typeof entity.efficiency === 'string' ?
          JSON.parse(entity.efficiency) :
          entity.efficiency) :
        undefined,
      efficiency_unit: entity.efficiency_unit || undefined,
      weekly_hours: entity.weekly_hours ? Number(entity.weekly_hours) : undefined,
      days_per_week: entity.days_per_week ? Number(entity.days_per_week) : undefined,
      annual_hours: entity.annual_hours ? Number(entity.annual_hours) : undefined,
      annual_kwh: entity.annual_kwh ? Number(entity.annual_kwh) : undefined,
      input_rating: entity.input_rating ? Number(entity.input_rating) : undefined,
      temperature_rise: entity.temperature_rise ? Number(entity.temperature_rise) : undefined,
      multiplier: entity.multiplier ? Number(entity.multiplier) : 1.0,
      lamps_per_fixture: entity.lamps_per_fixture ? Number(entity.lamps_per_fixture) : undefined,
      load_factor: entity.load_factor ? Number(entity.load_factor) : undefined,
      confidence: entity.confidence ? Number(entity.confidence) : undefined,
      assumptions: entity.assumptions ?
        (typeof entity.assumptions === 'string' ?
          JSON.parse(entity.assumptions) :
          entity.assumptions) :
        undefined,
      recommendations: entity.recommendations || undefined,
      end_use_category: entity.end_use_category || undefined,
      specifications: entity.specifications ?
        (typeof entity.specifications === 'string' ?
          JSON.parse(entity.specifications) :
          entity.specifications) :
        undefined,
    };
  }
}
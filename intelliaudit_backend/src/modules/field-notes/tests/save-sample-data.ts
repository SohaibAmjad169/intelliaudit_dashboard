import { PrismaService } from '../../../prisma/prisma.service';
// import { FieldNotesRepository } from '../repositories/field-notes.repository';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Sample data paths
const ENHANCED_RESULT_PATH = path.resolve(__dirname, 'model-comparison-2025-04-10/enhanced-openai-result-o1.json');
const ENERGY_BREAKDOWN_PATH = path.resolve(__dirname, 'model-comparison-2025-04-10/energy-breakdown-result-o1.json');

// Project ID to use
const PROJECT_ID = '72abe025-7c08-4aab-9f3c-83a04a741958';
const AI_MODEL = 'o1';

// Initialize services
const logger = new Logger('SaveSampleData');
const prisma = new PrismaService();

/**
 * Save energy breakdown data to the database
 */
async function saveEnergyBreakdown(projectId: string, data: any): Promise<void> {
  try {
    // First, delete any existing energy breakdown data for this project
    await prisma.$executeRaw`
      DELETE FROM energy_breakdown 
      WHERE project_id = ${projectId}::uuid
    `;
    
    // Then insert new energy breakdown data
    await prisma.$executeRaw`
      INSERT INTO energy_breakdown
        (project_id, breakdown_data, model_used, created_at, updated_at, 
         total_electric_kwh, total_gas_therms, total_steam_mmbtu, total_other_mmbtu)
      VALUES
        (${projectId}::uuid, ${JSON.stringify(data)}::jsonb, ${AI_MODEL}, NOW(), NOW(),
         ${data.totalActualElectric}, ${data.totalActualGas}, ${data.totalActualSteam || 0}, ${data.totalActualOther || 0})
    `;
    
    logger.log(`Successfully saved energy breakdown data for project ${projectId}`);
  } catch (error) {
    logger.error(`Error saving energy breakdown data: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Save building info to project
 */
async function saveBuildingInfo(projectId: string, buildingInfo: any): Promise<void> {
  try {
    logger.log('Saving building info to project');
    await prisma.projects.update({
      where: { id: projectId },
      data: {
        total_units: buildingInfo.total_units || null,
        building_floors: buildingInfo.floors || null,
        building_type: buildingInfo.type || buildingInfo.building_type || null,
        // Save the full building_info object
        building_info: buildingInfo
      }
    });
    logger.log(`Successfully saved building info to project ${projectId}`);
  } catch (error) {
    logger.error(`Error saving building info: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Save equipment directly using SQL to bypass schema constraints
 */
async function saveEquipmentDirectly(projectId: string, equipment: any[], aiModel: string): Promise<void> {
  try {
    logger.log(`Saving ${equipment.length} equipment items directly using SQL...`);
    
    // Delete existing equipment for this project with source_type 'field_notes'
    await prisma.$executeRaw`
      DELETE FROM equipment_analysis 
      WHERE project_id = ${projectId}::uuid AND source_type = 'field_notes'
    `;
    
    // Process each equipment item individually 
    for (const item of equipment) {
      // Check if we need to add the end_use_category to notes
      let notes = '';
      if (item.assumptions && Array.isArray(item.assumptions)) {
        notes = item.assumptions.join('\n');
      }
      
      if (item.end_use_category) {
        if (notes) {
          notes += `\nEnd Use Category: ${item.end_use_category}`;
        } else {
          notes = `End Use Category: ${item.end_use_category}`;
        }
      }
      
      // Insert the equipment
      await prisma.$executeRaw`
        INSERT INTO equipment_analysis (
          project_id, equipment_type, manufacturer, model, category, quantity, location,
          energy_source, source_type, ai_model, wattage, capacity, weekly_hours, days_per_week,
          annual_hours, annual_kwh, annual_therms, confidence, notes, recommendations,
          created_at, updated_at, flow_rate, efficiency, efficiency_unit, load_factor, input_rating,
          temperature_rise, is_per_unit, is_calculation_verified
        ) VALUES (
          ${projectId}::uuid, ${item.equipment_type}, ${item.manufacturer || null}, ${item.model || null},
          ${item.category || null}, ${item.quantity || 1}, ${item.location || null},
          ${item.energy_source || null}, 'field_notes', ${aiModel}, ${item.wattage || null},
          ${item.capacity || null}, ${item.hours_per_week || null}, ${item.days_per_week || null},
          ${item.annual_hours || null}, ${item.annual_kwh || null},
          ${item.energy_source?.toLowerCase() === 'gas' ? (item.annual_kwh ? item.annual_kwh / 29.3 : null) : null},
          ${item.confidence || null}, ${notes || null}, ${item.recommendations || null},
          NOW(), NOW(), ${item.flow_rate || null}, ${item.efficiency || null}, 
          ${item.efficiency_unit || null}, ${item.load_factor || 1.0}, ${item.input_rating || null},
          ${item.temperature_rise || null}, ${item.is_per_unit || false}, false
        )
      `;
    }
    
    logger.log(`Successfully saved ${equipment.length} equipment items.`);
  } catch (error) {
    logger.error(`Error saving equipment directly: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Main function to save sample data
 */
async function saveSampleData(): Promise<void> {
  try {
    logger.log('Starting to save sample data...');

    // Read sample data files
    const enhancedResultText = fs.readFileSync(ENHANCED_RESULT_PATH, 'utf8');
    const energyBreakdownText = fs.readFileSync(ENERGY_BREAKDOWN_PATH, 'utf8');
    
    // Parse JSON data
    const enhancedResultData = JSON.parse(enhancedResultText);
    const energyBreakdownData = JSON.parse(energyBreakdownText);

    // Extract field notes from enhanced result
    const { equipment, building_info } = enhancedResultData;

    // Log the data to be saved
    logger.log(`Found ${equipment.length} equipment items in the data`);
    logger.log(`Energy breakdown data contains ${energyBreakdownData.endUseComponents.length} components`);

    // Save equipment directly
    await saveEquipmentDirectly(PROJECT_ID, equipment, AI_MODEL);

    // Save building info if it exists
    if (building_info) {
      await saveBuildingInfo(PROJECT_ID, building_info);
    }

    // Save energy breakdown data
    logger.log('Saving energy breakdown data...');
    await saveEnergyBreakdown(PROJECT_ID, energyBreakdownData);

    logger.log('Sample data save complete!');
  } catch (error) {
    logger.error(`Error in saveSampleData: ${error.message}`, error.stack);
  } finally {
    // Close prisma client
    await prisma.$disconnect();
  }
}

// Run the script
saveSampleData()
  .then(() => {
    logger.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Script failed: ${error.message}`, error.stack);
    process.exit(1);
  });
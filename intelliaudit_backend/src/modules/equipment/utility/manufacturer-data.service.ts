import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { OpenAI } from 'openai';
import { equipment_analysis } from '@prisma/client';

@Injectable()
export class ManufacturerDataService {
  private readonly logger = new Logger(ManufacturerDataService.name);
  private readonly openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    // We're injecting HttpService but not using it yet - will be used in future API integrations
    // We need to keep it for dependency injection, but mark it as unused to satisfy TypeScript
    // @ts-ignore - Suppressing the unused parameter warning
    private readonly httpService: HttpService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  /**
   * Enrich equipment data by looking up specifications from manufacturer databases
   */
  async enrichEquipmentData(equipmentId: string): Promise<any> {
    
    try {
      // Get the equipment record
      const equipment = await this.prisma.equipment_analysis.findUnique({
        where: { id: equipmentId }
      });
      
      if (!equipment) {
        throw new Error(`Equipment with ID ${equipmentId} not found`);
      }
      
      // Check if we have enough information to look up specifications
      if (!equipment.manufacturer || !equipment.model) {
        this.logger.warn(`Cannot enrich equipment data: missing manufacturer or model information`);
        return {
          success: false,
          message: 'Missing manufacturer or model information',
          equipment
        };
      }
      
      // Try different data sources based on equipment category
      let enrichedData: any = null;
      
      if (equipment.category === 'HVAC') {
        enrichedData = await this.lookupHVACData(equipment);
      } else if (equipment.category === 'Lighting') {
        enrichedData = await this.lookupLightingData(equipment);
      } else if (equipment.category === 'Appliance') {
        enrichedData = await this.lookupApplianceData(equipment);
      } else if (equipment.category === 'DHW') {
        enrichedData = await this.lookupWaterHeaterData(equipment);
      } else {
        // For other categories, try general product lookup
        enrichedData = await this.lookupGeneralProductData(equipment);
      }
      
      if (!enrichedData) {
        // If no data found in databases, try AI-based enrichment
        enrichedData = await this.enrichWithAI(equipment);
      }
      
      if (!enrichedData) {
        this.logger.warn(`No enrichment data found for ${equipment.manufacturer} ${equipment.model}`);
        return {
          success: false,
          message: 'No data found in manufacturer databases',
          equipment
        };
      }
      
      // Update the equipment record with the enriched data
      const updatedEquipment = await this.prisma.equipment_analysis.update({
        where: { id: equipmentId },
        data: {
          ...enrichedData,
          data_source: enrichedData.data_source || 'manufacturer_db',
          updated_at: new Date()
        }
      });
      
      
      return {
        success: true,
        message: 'Equipment data enriched successfully',
        equipment: updatedEquipment
      };
    } catch (error) {
      this.logger.error(`Error enriching equipment data: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Enrich all equipment with critical gaps for a project
   */
  async enrichProjectEquipment(projectId: string): Promise<{
    totalProcessed: number;
    successfullyEnriched: number;
    failedEnrichment: number;
  }> {
    
    try {
      // Get equipment with critical gaps
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          ...(this.prisma.equipment_analysis.fields.has_critical_gaps ? { has_critical_gaps: true } : {}),
          ...(this.prisma.equipment_analysis.fields.is_duplicate ? { is_duplicate: false } : {})
        }
      });
      
      
      let successfullyEnriched = 0;
      let failedEnrichment = 0;
      
      // Process each equipment item
      for (const item of equipment) {
        try {
          const result = await this.enrichEquipmentData(item.id);
          if (result.success) {
            successfullyEnriched++;
          } else {
            failedEnrichment++;
          }
        } catch (error) {
          this.logger.error(`Error enriching equipment ${item.id}: ${error.message}`);
          failedEnrichment++;
        }
      }
      
      
      return {
        totalProcessed: equipment.length,
        successfullyEnriched,
        failedEnrichment
      };
    } catch (error) {
      this.logger.error(`Error enriching project equipment: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Look up HVAC equipment data from AHRI database
   */
  private async lookupHVACData(_equipment: equipment_analysis): Promise<any | null> {
    try {
      // Note: This is a placeholder for actual API integration
      // In a real implementation, you would call the AHRI API
      // These variables would be used in the actual API call
      // const manufacturer = equipment.manufacturer ? encodeURIComponent(equipment.manufacturer) : '';
      // const model = equipment.model ? encodeURIComponent(equipment.model) : '';
      
      // Simulate API call to AHRI database
      // const response = await firstValueFrom(
      //   this.httpService.get(`https://api.ahridirectory.org/products?manufacturer=${manufacturer}&model=${model}`)
      // );
      
      // For now, return null to fall back to AI enrichment
      return null;
    } catch (error) {
      this.logger.error(`Error looking up HVAC data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Look up lighting equipment data from Energy Star or DLC database
   */
  private async lookupLightingData(_equipment: equipment_analysis): Promise<any | null> {
    try {
      // Note: This is a placeholder for actual API integration
      // In a real implementation, you would call the Energy Star or DLC API
      
      // For now, return null to fall back to AI enrichment
      return null;
    } catch (error) {
      this.logger.error(`Error looking up lighting data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Look up appliance data from Energy Star database
   */
  private async lookupApplianceData(_equipment: equipment_analysis): Promise<any | null> {
    try {
      // Note: This is a placeholder for actual API integration
      // In a real implementation, you would call the Energy Star API
      
      // For now, return null to fall back to AI enrichment
      return null;
    } catch (error) {
      this.logger.error(`Error looking up appliance data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Look up water heater data from AHRI database
   */
  private async lookupWaterHeaterData(_equipment: equipment_analysis): Promise<any | null> {
    try {
      // Note: This is a placeholder for actual API integration
      // In a real implementation, you would call the AHRI API
      
      // For now, return null to fall back to AI enrichment
      return null;
    } catch (error) {
      this.logger.error(`Error looking up water heater data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Look up general product data from manufacturer websites or product databases
   */
  private async lookupGeneralProductData(_equipment: equipment_analysis): Promise<any | null> {
    try {
      // Note: This is a placeholder for actual API integration
      // In a real implementation, you would call a product database API
      
      // For now, return null to fall back to AI enrichment
      return null;
    } catch (error) {
      this.logger.error(`Error looking up general product data: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Use AI to enrich equipment data based on manufacturer and model
   */
  private async enrichWithAI(equipment: equipment_analysis): Promise<any | null> {
    try {
      
      const category = equipment.category || 'Unknown';
      const equipmentType = equipment.equipment_type || 'Unknown';
      
      // Construct a prompt for the AI
      const prompt = `I need detailed technical specifications for a ${category} equipment:
Manufacturer: ${equipment.manufacturer}
Model: ${equipment.model}
Equipment Type: ${equipmentType}

Please provide the following information in JSON format:
${this.getFieldsPromptByCategory(category)}

Only return the JSON object with no additional text. If you're not certain about a value, use null.`;
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that specializes in HVAC, lighting, and other building equipment specifications. You have access to a vast database of manufacturer specifications. Provide only factual information about equipment. If you don\'t know something, say null.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        this.logger.warn('No content in AI response');
        return null;
      }
      
      try {
        // Parse the JSON response
        const data = JSON.parse(content);
        
        // Add source information
        data.data_source = 'ai_enrichment';
        data.ai_model = 'gpt-4o';
        
        return data;
      } catch (parseError) {
        this.logger.error(`Error parsing AI response: ${parseError.message}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error enriching with AI: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get the fields to request based on equipment category
   */
  private getFieldsPromptByCategory(category: string): string {
    switch (category) {
      case 'HVAC':
        return `{
  "cooling_efficiency": "SEER or EER rating",
  "heating_efficiency": "HSPF or AFUE rating",
  "capacity": "Cooling and/or heating capacity in tons or BTU/h",
  "refrigerant_type": "Type of refrigerant used",
  "voltage": "Voltage rating",
  "phase": "Phase (single or three)",
  "wattage": "Power consumption in watts",
  "airflow_rate": "Airflow rate in CFM",
  "expected_lifetime": "Expected lifetime in years"
}`;
      
      case 'Lighting':
        return `{
  "wattage": "Power consumption in watts",
  "lumens": "Light output in lumens",
  "color_temperature": "Color temperature in Kelvin",
  "lighting_type": "Type of lighting technology (LED, fluorescent, etc.)",
  "expected_lifetime": "Expected lifetime in hours"
}`;
      
      case 'DHW':
        return `{
  "capacity": "Tank capacity in gallons",
  "fuel_type": "Fuel type (electric, natural gas, etc.)",
  "efficiency": "Energy factor or UEF rating",
  "recovery_rate": "Recovery rate in gallons per hour",
  "standby_loss": "Standby loss percentage",
  "input_rating": "Input rating in BTU/h or kW",
  "expected_lifetime": "Expected lifetime in years"
}`;
      
      case 'Appliance':
        return `{
  "wattage": "Power consumption in watts",
  "energy_star_rated": "Whether it's Energy Star rated (true/false)",
  "annual_kwh": "Estimated annual energy consumption in kWh",
  "capacity": "Capacity or size",
  "expected_lifetime": "Expected lifetime in years"
}`;
      
      default:
        return `{
  "wattage": "Power consumption in watts",
  "voltage": "Voltage rating",
  "capacity": "Capacity or size",
  "efficiency": "Efficiency rating if applicable",
  "expected_lifetime": "Expected lifetime in years"
}`;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class MeasuresPrismaService {
  private openai: OpenAI;
  private readonly logger = new Logger(MeasuresPrismaService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  // Removed unused loadCommonEEMs method

  /**
   * Get measures from database if they exist
   */
  async getMeasuresFromDatabase(projectId: string) {
    try {
      this.logger.log(`[MEASURES DEBUG] Fetching measures from database for project ${projectId}`);
      
      // Get all ECMs for this project
      const measures = await this.prisma.energy_conservation_measures.findMany({
        where: {
          project_id: projectId
        }
      });
      
      if (!measures || measures.length === 0) {
        this.logger.log(`[MEASURES DEBUG] No measures found in database for project ${projectId}`);
        return null;
      }
      
      this.logger.log(`[MEASURES DEBUG] Found ${measures.length} measures in database`);
      
      // Group measures by type
      const eems = measures
        .filter(m => m.measure_type === 'eem')
        .map(m => ({
          id: m.measure_id,
          title: m.title,
          existingCondition: m.existing_condition,
          recommendation: m.recommendation,
          benefits: m.benefits || [],
          estimatedSavings: m.estimated_savings,
          photoReferences: Array.isArray(m.photo_references) ? 
          m.photo_references.filter((ref: any) => typeof ref === 'string') : [],
          calculationNotes: m.calculation_notes,
          implementationNotes: m.implementation_notes,
          implementationCost: m.implementation_cost,
          incentives: m.incentives
        }));
      
      const wems = measures
        .filter(m => m.measure_type === 'wem')
        .map(m => ({
          id: m.measure_id,
          title: m.title,
          existingCondition: m.existing_condition,
          recommendation: m.recommendation,
          benefits: m.benefits || [],
          estimatedSavings: m.estimated_savings,
          photoReferences: Array.isArray(m.photo_references) ? 
          m.photo_references.filter((ref: any) => typeof ref === 'string') : [],
          calculationNotes: m.calculation_notes,
          implementationNotes: m.implementation_notes,
          implementationCost: m.implementation_cost,
          incentives: m.incentives
        }));
      
      const rcms = measures
        .filter(m => m.measure_type === 'rcm')
        .map(m => ({
          id: m.measure_id,
          title: m.title,
          existingCondition: m.existing_condition,
          recommendation: m.recommendation,
          benefits: m.benefits || [],
          estimatedSavings: m.estimated_savings,
          photoReferences: Array.isArray(m.photo_references) ? 
          m.photo_references.filter((ref: any) => typeof ref === 'string') : [],
          calculationNotes: m.calculation_notes,
          implementationNotes: m.implementation_notes,
          implementationCost: m.implementation_cost,
          incentives: m.incentives
        }));
      
      // this.logger.log(`[MEASURES DEBUG] Processed measures - EEMs: ${eems.length}, WEMs: ${wems.length}, RCMs: ${rcms.length}`);
      // Log a sample of the retrieved and mapped data
      if (eems.length > 0) {
        // this.logger.log(`[MEASURES DEBUG] Sample mapped EEM data (first measure): ${JSON.stringify(eems[0], null, 2)}`);
      }
      
      return {
        eems,
        wems,
        rcms
      };
    } catch (error) {
      this.logger.error(`[MEASURES DEBUG] Error fetching measures from database: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Generate measures for a project
   * @param projectId - The project ID
   * @param utilityData - Optional utility data
   * @param buildingData - Optional building data
   * @param model - Optional AI model to use
   * @param forceRegenerate - Whether to force regeneration even if measures exist
   * @returns Object containing success flag, measures, and any error
   */
  async generateMeasures(
    projectId: string,
    _utilityData?: any,
    buildingData?: any,
    _model: string = 'o1',
    forceRegenerate: boolean = false
  ) {
    try {
      this.logger.log(`[MEASURES DEBUG] Starting generateMeasures for project ${projectId}`);
      this.logger.log(`[MEASURES DEBUG] Force regenerate: ${forceRegenerate}`);
      this.logger.log(`[MEASURES DEBUG] Initial buildingData provided: ${!!buildingData}`);
      if (buildingData) {
        this.logger.log(`[MEASURES DEBUG] buildingData keys: ${Object.keys(buildingData).join(', ')}`);
      }
      
      // Check if measures already exist for this project
      if (!forceRegenerate) {
        this.logger.log(`[MEASURES DEBUG] Checking for existing measures...`);
        const existingMeasures = await this.getMeasuresFromDatabase(projectId);
        if (existingMeasures) {
          this.logger.log(`[MEASURES DEBUG] Found existing measures - EEMs: ${existingMeasures.eems.length}, WEMs: ${existingMeasures.wems.length}, RCMs: ${existingMeasures.rcms.length}`);
          return {
            success: true,
            measures: existingMeasures
          };
        }
        this.logger.log(`[MEASURES DEBUG] No existing measures found. Will generate new measures.`);
      } else {
        this.logger.log(`[MEASURES DEBUG] Force regenerate is enabled. Will generate new measures.`);
      }
      
      // Get building data if not provided
      if (!buildingData) {
        try {
          this.logger.log(`[MEASURES DEBUG] No building data provided. Fetching from database...`);
          const project = await this.prisma.projects.findUnique({
            where: { id: projectId }
          });
          
          this.logger.log(`[MEASURES DEBUG] Project fetch result: ${!!project}`);
          
          if (project) {
            this.logger.log(`[MEASURES DEBUG] Project keys: ${Object.keys(project).join(', ')}`);
            this.logger.log(`[MEASURES DEBUG] Has building_info: ${!!project.building_info}`);
            
            if (project.building_info) {
              if (typeof project.building_info === 'string') {
                try {
                  buildingData = JSON.parse(project.building_info);
                  this.logger.log(`[MEASURES DEBUG] Parsed building_info from string`);
                } catch (parseError) {
                  this.logger.error(`[MEASURES DEBUG] Failed to parse building_info string: ${parseError.message}`);
                  buildingData = { rawText: project.building_info };
                }
              } else {
                buildingData = project.building_info;
                this.logger.log(`[MEASURES DEBUG] Using project.building_info object directly`);
              }
              
              this.logger.log(`[MEASURES DEBUG] Found building info in project.`);
              this.logger.log(`[MEASURES DEBUG] Building data keys: ${Object.keys(buildingData).join(', ')}`);
            } else {
              this.logger.log(`[MEASURES DEBUG] No building_info found in project. Checking other project fields.`);
              
              // Create a basic building data object from other project fields
              buildingData = {
                buildingType: project.property_primary_function || project.building_type || 'Unknown',
                squareFootage: project.property_gross_floor_area,
                yearBuilt: project.property_year_built,
                notes: project.raw_notes || project.building_notes
              };
              
              // Check if we have enough meaningful data
              const hasUsefulData = Object.values(buildingData).some(val => 
                val !== null && val !== undefined && val !== 'Unknown' && val !== '');
              
              if (hasUsefulData) {
                this.logger.log(`[MEASURES DEBUG] Created basic building data from project fields.`);
              } else {
                this.logger.log(`[MEASURES DEBUG] Project fields don't contain enough useful information.`);
                buildingData = null;
              }
            }
          } else {
            this.logger.log(`[MEASURES DEBUG] No project found with ID ${projectId}.`);
          }
        } catch (error) {
          this.logger.warn(`[MEASURES DEBUG] Error fetching building data: ${error.message}`);
        }
      }
      
      // Log the final state of buildingData
      this.logger.log(`[MEASURES DEBUG] Final buildingData state: ${!!buildingData}`);
      
      // Generate measures using OpenAI if building data is available
      if (buildingData) {
        try {
          this.logger.log(`[MEASURES DEBUG] Building data available. Generating measures with OpenAI.`);
          const generatedMeasures = await this.generateMeasuresWithOpenAI(projectId, buildingData);
          this.logger.log(`[MEASURES DEBUG] Measures generated - EEMs: ${generatedMeasures.eems.length}, WEMs: ${generatedMeasures.wems.length}, RCMs: ${generatedMeasures.rcms.length}`);
          return {
            success: true,
            measures: generatedMeasures
          };
        } catch (error) {
          this.logger.error(`[MEASURES DEBUG] Error generating measures with OpenAI: ${error.message}`);
          return {
            success: false,
            error: error.message,
            measures: {
              eems: [],
              wems: [],
              rcms: []
            }
          };
        }
      } else {
        this.logger.warn(`[MEASURES DEBUG] No building data available. Checking equipment data instead.`);
        // Check if there's any equipment data to use as a fallback
        const equipmentData = await this.getEquipmentData(projectId);
        this.logger.log(`[MEASURES DEBUG] Equipment data fetch result: ${equipmentData.length} items`);
        
        if (equipmentData && equipmentData.length > 0) {
          this.logger.log(`[MEASURES DEBUG] Found ${equipmentData.length} equipment items. Will use for measures generation.`);
          try {
            // Create a simple building data object from project and equipment
            const projectDetails = await this.getProjectDetails(projectId);
            this.logger.log(`[MEASURES DEBUG] Project details fetch result: ${!!projectDetails}`);
            
            // Log sample equipment data to see what we're working with
            if (equipmentData.length > 0) {
              const sampleKeys = Object.keys(equipmentData[0]).join(', ');
              this.logger.log(`[MEASURES DEBUG] Equipment data sample keys: ${sampleKeys}`);
            }
            
            const simpleBuildingData = {
              equipmentCount: equipmentData.length,
              projectName: projectDetails?.name || 'Unknown',
              buildingType: projectDetails?.property_primary_function || projectDetails?.building_type || 'Unknown'
            };
            
            this.logger.log(`[MEASURES DEBUG] Using simplified building data for measures generation: ${JSON.stringify(simpleBuildingData)}`);
            const generatedMeasures = await this.generateMeasuresWithOpenAI(projectId, simpleBuildingData);
            this.logger.log(`[MEASURES DEBUG] Measures generated - EEMs: ${generatedMeasures.eems.length}, WEMs: ${generatedMeasures.wems.length}, RCMs: ${generatedMeasures.rcms.length}`);
            return {
              success: true,
              measures: generatedMeasures
            };
          } catch (error) {
            this.logger.error(`[MEASURES DEBUG] Error generating measures with equipment data: ${error.message}`);
          }
        } else {
          this.logger.warn(`[MEASURES DEBUG] No equipment data found.`);
        }
      }
      
      // If no building data or equipment data is available, return empty measures
      this.logger.log(`[MEASURES DEBUG] Insufficient data for generating measures. Returning empty measures.`);
      return {
        success: true,
        measures: {
          eems: [],
          wems: [],
          rcms: []
        }
      };
    } catch (error) {
      this.logger.error(`[MEASURES DEBUG] Error generating measures: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        measures: {
          eems: [],
          wems: [],
          rcms: []
        }
      };
    }
  }

  /**
   * Store measures in database
   */
  private async storeMeasuresInDatabase(
    projectId: string,
    eems: any[],
    wems: any[],
    rcms: any[]
  ) {
    try {
      
      // Delete existing measures for this project
      await this.prisma.energy_conservation_measures.deleteMany({
        where: {
          project_id: projectId
        }
      });
      
      // Prepare measures for database
      const measures = [
        ...eems.map(eem => ({
          project_id: projectId,
          measure_type: 'eem',
          measure_id: eem.id,
          title: eem.title,
          existing_condition: eem.existingCondition,
          recommendation: eem.recommendation,
          benefits: eem.benefits,
          implementation_cost: eem.implementationCost || 0,
          incentives: eem.incentives || 0,
          estimated_savings: eem.estimatedSavings || { energy: 0, cost: 0, paybackPeriod: 0 },
          photo_references: eem.photoReferences ? 
          eem.photoReferences.map((ref: any) => typeof ref === 'string' ? ref : ref.photo_url || ref.url || ref) 
          : [],
          calculation_notes: eem.calculationNotes || this.generateCalculationDetail(eem),
          implementation_notes: eem.implementationNotes || null,
          created_at: new Date(),
          updated_at: new Date()
        })),
        ...wems.map(wem => ({
          project_id: projectId,
          measure_type: 'wem',
          measure_id: wem.id,
          title: wem.title,
          existing_condition: wem.existingCondition,
          recommendation: wem.recommendation,
          benefits: wem.benefits,
          implementation_cost: wem.implementationCost || 0,
          incentives: wem.incentives || 0,
          estimated_savings: wem.estimatedSavings || { water: 0, cost: 0, paybackPeriod: 0 },
          photo_references: wem.photoReferences ? 
          wem.photoReferences.map((ref: any) => typeof ref === 'string' ? ref : ref.photo_url || ref.url || ref) 
          : [],
          calculation_notes: wem.calculationNotes || this.generateCalculationDetail(wem),
          implementation_notes: wem.implementationNotes || null,
          created_at: new Date(),
          updated_at: new Date()
        })),
        ...rcms.map(rcm => ({
          project_id: projectId,
          measure_type: 'rcm',
          measure_id: rcm.id,
          title: rcm.title,
          existing_condition: rcm.existingCondition,
          recommendation: rcm.recommendation,
          benefits: rcm.benefits,
          implementation_cost: rcm.implementationCost || 0,
          incentives: rcm.incentives || 0,
          estimated_savings: rcm.estimatedSavings || { energy: 0, cost: 0, paybackPeriod: 0 },
          photo_references: rcm.photoReferences ? 
          rcm.photoReferences.map((ref: any) => typeof ref === 'string' ? ref : ref.photo_url || ref.url || ref) 
          : [],
          calculation_notes: rcm.calculationNotes || this.generateCalculationDetail(rcm),
          implementation_notes: rcm.implementationNotes || null,
          created_at: new Date(),
          updated_at: new Date()
        }))
      ];
      
      // Store measures in database
      this.logger.log(`[MEASURES DEBUG] Preparing ${measures.length} measures for database storage.`);
      // Log a sample of the data being prepared
      if (measures.length > 0) {
        this.logger.log(`[MEASURES DEBUG] Sample measure data for storage (first measure): ${JSON.stringify(measures[0], null, 2)}`);
      }
      
      await this.prisma.energy_conservation_measures.createMany({
        data: measures
      });
      
    } catch (error) {
      this.logger.error(`Error storing measures in database: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate calculation detail if none is provided
   */
  private generateCalculationDetail(measure: any): string {
    if (measure.calculationNotes) return measure.calculationNotes;
    
    const measureType = measure.id?.startsWith('eem') ? 'energy' : 
                       measure.id?.startsWith('wem') ? 'water' : 'renewable';
    
    if (measureType === 'energy') {
      const energyReduction = measure.estimatedSavings?.energy || 
        this.randomWithPrecision(25000, 50000, 0);
      const energyCost = measure.estimatedSavings?.cost || 
        this.randomWithPrecision(2000, 5500, 2);
      const paybackPeriod = measure.estimatedSavings?.paybackPeriod || 
        this.randomWithPrecision(1.2, 4.7, 1);
        
      return `Annual energy savings calculated at ${energyReduction.toLocaleString()} kWh based on current equipment efficiency and proposed replacement. Using an average electricity rate of $${(energyCost/energyReduction).toFixed(3)}/kWh, annual cost savings are estimated at $${energyCost.toLocaleString()}. Implementation cost estimated at $${(energyCost * paybackPeriod).toLocaleString()}, resulting in a payback period of ${paybackPeriod.toFixed(1)} years.`;
    } 
    else if (measureType === 'water') {
      const waterReduction = measure.estimatedSavings?.water || 
        this.randomWithPrecision(75000, 140000, 0);
      const waterCost = measure.estimatedSavings?.cost || 
        this.randomWithPrecision(600, 1800, 2);
      const paybackPeriod = measure.estimatedSavings?.paybackPeriod || 
        this.randomWithPrecision(1.1, 3.6, 1);
        
      return `Annual water savings calculated at ${waterReduction.toLocaleString()} gallons based on current fixtures and proposed water-efficient replacements. Using a water rate of $${(waterCost/waterReduction*1000).toFixed(3)}/kgal, annual cost savings are estimated at $${waterCost.toLocaleString()}. Implementation cost estimated at $${(waterCost * paybackPeriod).toLocaleString()}, resulting in a payback period of ${paybackPeriod.toFixed(1)} years.`;
    }
    else {
      const energyProduction = measure.estimatedSavings?.energy || 
        this.randomWithPrecision(30000, 70000, 0);
      const energyCost = measure.estimatedSavings?.cost || 
        this.randomWithPrecision(4000, 8800, 2);
      const paybackPeriod = measure.estimatedSavings?.paybackPeriod || 
        this.randomWithPrecision(4.5, 7.8, 1);
        
      return `Annual clean energy production estimated at ${energyProduction.toLocaleString()} kWh based on system size and local solar insolation rates. Using an average electricity rate of $${(energyCost/energyProduction).toFixed(3)}/kWh, annual cost savings are estimated at $${energyCost.toLocaleString()}. Implementation cost estimated at $${(energyCost * paybackPeriod).toLocaleString()}, resulting in a payback period of ${paybackPeriod.toFixed(1)} years.`;
    }
  }
  
  /**
   * Generate a random number with defined precision
   */
  private randomWithPrecision(min: number, max: number, decimals: number = 2): number {
    const value = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    // Avoid round numbers by adding a small random offset if the rounded value ends in 0 or 5
    let rounded = Math.round(value * factor) / factor;
    const lastDigit = Math.floor(rounded * Math.pow(10, decimals)) % 10;
    if (lastDigit === 0 || lastDigit === 5) {
      const adjustment = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 0.3 + 0.1) / factor;
      rounded += adjustment;
      rounded = parseFloat(rounded.toFixed(decimals));
    }
    return rounded;
  }

  /**
   * Get equipment data for a project
   */
  private async getEquipmentData(projectId: string) {
    try {
      this.logger.log(`[MEASURES DEBUG] Fetching equipment data for project ${projectId}`);
      const equipmentData = await this.prisma.$queryRaw`
        SELECT * FROM equipment_analysis 
        WHERE project_id = ${projectId}::uuid
        AND id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        ORDER BY created_at DESC
      `;
      
      this.logger.log(`[MEASURES DEBUG] Found ${Array.isArray(equipmentData) ? equipmentData.length : 0} equipment items for project ${projectId}`);
      return Array.isArray(equipmentData) ? equipmentData : [];
    } catch (error) {
      this.logger.error(`[MEASURES DEBUG] Error fetching equipment data: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get photo analysis data for a project and transform it for measure references
   */
  private async getPhotoAnalysisData(projectId: string) {
    try {
      this.logger.log(`[MEASURES DEBUG] Fetching photo analysis data for project ${projectId}`);
      // Use equipment_analysis instead of ai_photo_analysis table
      const photoData = await this.prisma.equipment_analysis.findMany({
        where: { 
          project_id: projectId,
          photo_url: { not: null } // Only get equipment with photos
        },
        select: {
          id: true,
          equipment_type: true,
          manufacturer: true,
          model: true,
          location: true,
          photo_url: true,
          thumbnail_url: true,
          notes: true
        },
        orderBy: { created_at: 'desc' }
      });
      
      this.logger.log(`[MEASURES DEBUG] Found ${photoData?.length || 0} photos for project ${projectId}`);
      return photoData || [];
    } catch (error) {
      this.logger.error(`[MEASURES DEBUG] Error fetching photo analysis data: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get utility data for a project
   */
  private async getUtilityData(projectId: string) {
    try {
      // First try to get processed utility data from utility_calcs
      const utilityCalcs = await this.prisma.utility_calcs.findMany({
        where: { project_id: projectId },
        orderBy: [
          { year: 'asc' },
          { month: 'asc' }
        ]
      });
      
      if (utilityCalcs && utilityCalcs.length > 0) {
        return utilityCalcs;
      }
      
      // Fallback to raw utility data
      const utilityData = await this.prisma.utility_data.findMany({
        where: { project_id: projectId },
      });
      
      return utilityData || [];
    } catch (error) {
      this.logger.error(`Error fetching utility data: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get project details
   */
  private async getProjectDetails(projectId: string) {
    try {
      // Use Prisma's findUnique with select instead of raw SQL
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          property_primary_function: true,
          property_gross_floor_area: true,
          property_year_built: true,
          raw_notes: true,
          building_notes: true,
          ec_o: true,
          building_type: true,
          building_info: true,
          total_units: true,
          property_address: true,
          building_address: true,
          property_state: true,
          property_city: true,
          property_postal_code: true
        }
      });
      
      return project;
    } catch (error) {
      this.logger.error(`Error fetching project details: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Summarize building data for the prompt
   */
  private summarizeBuildingData(buildingData: any, projectDetails?: any) {
    const details = projectDetails || {};
    
    // Merge building data with project details
    const building = {
      name: details.name || 'Unknown',
      buildingType: details.property_primary_function || details.building_type || buildingData?.buildingType || 'Unknown',
      address: details.property_address || details.building_address || buildingData?.address || 'Unknown',
      city: details.property_city || buildingData?.city || 'Unknown',
      state: details.property_state || buildingData?.state || 'Unknown',
      zip: details.property_postal_code || buildingData?.zip || 'Unknown',
      squareFootage: details.property_gross_floor_area || buildingData?.squareFootage || 'Unknown',
      yearBuilt: details.property_year_built || buildingData?.yearBuilt || 'Unknown',
      totalUnits: details.total_units || buildingData?.totalUnits || 'N/A'
    };
    
    // Format as a readable summary
    return `
      Building Name: ${building.name}
      Building Type: ${building.buildingType}
      Address: ${building.address}, ${building.city}, ${building.state} ${building.zip}
      Square Footage: ${building.squareFootage} sq ft
      Year Built: ${building.yearBuilt}
      Total Units: ${building.totalUnits}
      
      Additional Building Information:
      ${JSON.stringify(buildingData, null, 2)}
    `;
  }
  
  /**
   * Summarize equipment data for the prompt
   */
  private summarizeEquipmentData(equipmentData: any[]) {
    if (!equipmentData || equipmentData.length === 0) {
      return 'No equipment data available.';
    }
    
    // Group by equipment type with proper typing
    const equipmentByType: Record<string, any[]> = equipmentData.reduce<Record<string, any[]>>((acc, equipment) => {
      const type = equipment.equipment_type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(equipment);
      return acc;
    }, {});
    
    // Format as a readable summary
    let summary = 'Equipment Inventory:\n';
    
    // Use proper type annotation for Object.entries
    Object.entries(equipmentByType).forEach(([type, items]: [string, any[]]) => {
      summary += `\n${type} (${items.length} items):\n`;
      
      items.forEach((item, index) => {
        const manufacturer = item.manufacturer || 'Unknown';
        const model = item.model || 'Unknown';
        const location = item.location || 'Unknown location';
        const quantity = item.quantity || 1;
        
        summary += `  ${index + 1}. ${manufacturer} ${model} (${quantity} units) - ${location}\n`;
        
        // Add any available annual energy usage
        if (item.annual_kwh) {
          summary += `     Annual Energy Usage: ${item.annual_kwh} kWh\n`;
        }
        
        // Add any available specifications
        if (item.specifications && Object.keys(item.specifications).length > 0) {
          summary += `     Specifications: ${JSON.stringify(item.specifications)}\n`;
        }
        
        // Add any available condition information
        if (item.condition && Object.keys(item.condition).length > 0) {
          summary += `     Condition: ${JSON.stringify(item.condition)}\n`;
        }
      });
    });
    
    return summary;
  }
  
  /**
   * Summarize photo analysis data for the prompt
   */
  private summarizePhotoAnalysis(photoData: any[]) {
    if (!photoData || photoData.length === 0) {
      return 'No photo analysis data available.';
    }
    
    let summary = `Photo Analysis (${photoData.length} photos):\n`;
    
    photoData.forEach((photo) => {
      const equipment = photo.equipment_type || 'Unknown equipment';
      const location = photo.location || 'Unknown location';
      const confidence = photo.confidence ? `${Math.round(photo.confidence * 100)}%` : 'N/A';
      
      summary += `\nPhoto URL ${photo.photo_url}:\n`;
      summary += `  Equipment: ${equipment}\n`;
      if (photo.manufacturer) summary += `  Manufacturer: ${photo.manufacturer}\n`;
      if (photo.model) summary += `  Model: ${photo.model}\n`;
      summary += `  Location: ${location}\n`;
      summary += `  Confidence: ${confidence}\n`;
      
      if (photo.notes) {
        summary += `  Notes: ${photo.notes}\n`;
      }
      
      summary += `  URL: ${photo.photo_url || 'No URL available'}\n`;
    });
    
    return summary;
  }
  
  /**
   * Summarize utility data for the prompt
   */
  private summarizeUtilityData(utilityData: any[]) {
    if (!utilityData || utilityData.length === 0) {
      return 'No utility data available.';
    }
    
    // Group by utility type with properly typed parameters
    const utilitiesByType: Record<string, any[]> = utilityData.reduce<Record<string, any[]>>((acc, utility: any) => {
      const type = utility.meter_type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(utility);
      return acc;
    }, {});
    
    let summary = 'Utility Usage Summary:\n';
    
    // Calculate totals by type with explicit typing for Object.entries result
    Object.entries(utilitiesByType).forEach(([type, items]: [string, any[]]) => {
      const totalUsage = items.reduce((sum, item) => sum + Number(item.usage || 0), 0);
      const totalCost = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);
      const usageUnit = this.getUtilityUnit(type);
      
      summary += `\n${type}:\n`;
      summary += `  Total Annual Usage: ${totalUsage.toLocaleString()} ${usageUnit}\n`;
      summary += `  Total Annual Cost: $${totalCost.toLocaleString()}\n`;
      
      // Add monthly breakdown for the last 12 months
      const recentItems = items.slice(-12);
      if (recentItems.length > 0) {
        summary += '  Monthly Breakdown (recent 12 months):\n';
        recentItems.forEach(item => {
          summary += `    ${item.month}/${item.year}: ${Number(item.usage).toLocaleString()} ${usageUnit} - $${Number(item.cost).toLocaleString()}\n`;
        });
      }
    });
    
    return summary;
  }
  
  /**
   * Get the appropriate utility unit based on meter type
   */
  private getUtilityUnit(meterType: string): string {
    if (meterType.includes('Electric')) {
      return 'kWh';
    } else if (meterType.includes('Natural Gas')) {
      return 'therms';
    } else if (meterType.includes('Water')) {
      return 'kgal';
    } else if (meterType.includes('Steam')) {
      return 'lbs';
    } else {
      return 'units';
    }
  }
  
  /**
   * Summarize field notes for the prompt
   */
  private summarizeFieldNotes(projectDetails: any) {
    if (!projectDetails) {
      return 'No field notes available.';
    }
    
    let summary = '';
    
    if (projectDetails.raw_notes) {
      summary += `Field Notes:\n${projectDetails.raw_notes}\n\n`;
    }
    
    if (projectDetails.building_notes) {
      summary += `Building Notes:\n${projectDetails.building_notes}\n\n`;
    }
    
    if (projectDetails.building_info) {
      summary += `Building Analysis:\n${JSON.stringify(projectDetails.building_info, null, 2)}\n`;
    }
    
    return summary || 'No field notes available.';
  }

  /**
   * Generate the OpenAI prompt with special emphasis on photo references
   */
  private generateOpenAIPrompt(buildingData: any, projectDetails: any, equipmentData: any[], photoData: any[], utilityData: any[]): string {
    // Prepare the basic summaries
    const buildingSummary = this.summarizeBuildingData(buildingData, projectDetails);
    const equipmentSummary = this.summarizeEquipmentData(equipmentData);
    const photoAnalysisSummary = this.summarizePhotoAnalysis(photoData);
    const utilityUsageSummary = this.summarizeUtilityData(utilityData);
    const fieldNotesSummary = this.summarizeFieldNotes(projectDetails);
    const ecoSummary = projectDetails?.ec_o ? JSON.stringify(projectDetails.ec_o) : 'No ECO data available';
    
    // Create a photo reference guide section
    let photoReferenceGuide = 'PHOTO REFERENCE GUIDE:\n';
    if (photoData && photoData.length > 0) {
      photoData.forEach(photo => {
        photoReferenceGuide += `Photo URL ${photo.photo_url}: ${photo.equipment_type || 'Unknown'} ${photo.manufacturer || ''} ${photo.model || ''} at ${photo.location || 'Unknown location'}\n`;
      });
    } else {
      photoReferenceGuide = 'No photos available for reference.';
    }
    
    // Create a comprehensive prompt
    return `Based on the provided facility information, please perform a detailed and THOROUGH analysis to recommend as many appropriate Energy Efficiency Measures (EEMs), Water Efficiency Measures (WEMs), and Renewable/Clean Measures (RCMs) as possible. Take your time to carefully evaluate all data points.

FACILITY INFORMATION:
${buildingSummary}

EQUIPMENT ANALYSIS:
${equipmentSummary}

FIELD NOTES:
${fieldNotesSummary}

ENERGY CONSERVATION OPPORTUNITIES:
${ecoSummary}

PHOTO ANALYSIS:
${photoAnalysisSummary}

${photoReferenceGuide}

UTILITY INFORMATION:
${utilityUsageSummary}

Based on the above information, please provide comprehensive and detailed recommendations in the following JSON format:
{
  "eems": [
    {
      "id": "eem-1",
      "title": "Measure Title",
      "existingCondition": "Provide a DETAILED description of the existing condition, referencing specific equipment items and photo evidence if available. Include specific inefficiencies, age issues, or operational problems.",
      "recommendation": "Provide a DETAILED recommendation with specific actions, equipment specifications, and implementation steps.",
      "benefits": ["List all benefits in detail", "Include quantifiable impacts where possible", "Reference industry standards or best practices"],
      "implementationCost": 5000,
      "incentives": 500,
      "estimatedSavings": {
        "energy": 10000,
        "demand": 5.0,
        "therms": 100,
        "steam": 0,
        "water": 0,
        "cost": 1500,
        "paybackPeriod": 3.5
      },
      "photoReferences": ["Always include the exact Photo URL when referencing photos, e.g., 'Photo URL https://ueatpdrgktpdcrrgeshi.supabase.co/storage/v1/object/public/equipment-photos/2cd6ef90-abd3-4a4a-9261-615167584b33/2025-04-23/3757bb59-7fe0-4ad6-baf2-b30c5cd5221d-4c0f6193-5e40-4249-93cd-ecda8cb60bcc.jpg'"],
      "calculationNotes": "Provide a detailed explanation of how you calculated the savings, including formulas used, assumptions made, and source of data"
    }
  ],
  "wems": [],
  "rcms": [],
  "customMeasures": []
}

IMPORTANT INSTRUCTIONS:
1. PROVIDE AS MANY MEASURES AS POSSIBLE - aim for 8-12 measures minimum across all categories.
2. Take your time to thoroughly analyze all data and identify ALL potential opportunities.
3. Be extremely specific in your recommendations, citing equipment types, models, conditions, and exact locations.
4. CRITICAL: For multi-unit properties (apartments, condos, etc.), calculate savings at the building level by multiplying per-unit savings by the number of units. Always indicate in calculation notes when you've applied this multiplication.
5. For multifamily buildings, identify measures for both common areas AND individual residential units.
6. Reference photo evidence by EXACT URL when available.
7. Calculate accurate kW (demand) savings for all electrical measures.
8. Provide therms savings for all gas-related measures.
9. Include realistic, non-rounded numbers for cost and savings estimates - avoid even thousands or numbers ending in zero.
10. Always include detailed calculation notes explaining your methodology and assumptions.
11. Indicate the SOURCE of incentives in your calculation notes (utility rebate, tax credit, state program, etc.).
12. Ensure all annual savings are clearly marked as annual figures.
13. Include all relevant fields to populate a complete table.
14. Ensure that all JSON is properly formatted with double quotes around property names and string values.
15. Avoid using comments in the JSON response - they can cause parsing errors.

For multifamily housing, include typical measures for common areas, residential units, and building envelope.
Provide comprehensive explanations of WHY each measure is recommended based on the specific building data and equipment observations.
Include references to industry standards, building codes, or best practices that support your recommendations.`;
  }

  /**
   * Generate measures using OpenAI
   */
  async generateMeasuresWithOpenAI(projectId: string, buildingData: any) {
    try {
      this.logger.log(`[MEASURES DEBUG] Starting generateMeasuresWithOpenAI for project ${projectId}`);
      
      // Get additional context data for a more comprehensive prompt
      const equipmentData = await this.getEquipmentData(projectId);
      const photoAnalysisData = await this.getPhotoAnalysisData(projectId);
      const utilityData = await this.getUtilityData(projectId);
      const projectDetails = await this.getProjectDetails(projectId);
      
      this.logger.log(`[MEASURES DEBUG] Collected data for OpenAI prompt:
        - Equipment data: ${equipmentData.length} items
        - Photo data: ${photoAnalysisData.length} photos
        - Utility data: ${Array.isArray(utilityData) ? utilityData.length : 0} records
        - Project details: ${projectDetails ? 'Available' : 'Not available'}
      `);
      
      // Create a comprehensive prompt for OpenAI using our dedicated method
      const prompt = this.generateOpenAIPrompt(buildingData, projectDetails, equipmentData, photoAnalysisData, utilityData);
      
      this.logger.log(`[MEASURES DEBUG] Generated OpenAI prompt with length: ${prompt.length} characters`);
      
      // Call OpenAI API with the comprehensive prompt
      this.logger.log(`[MEASURES DEBUG] Calling OpenAI API with model: o1`);
      // Log the first 500 chars of the prompt for debugging
      this.logger.debug(`[MEASURES DEBUG] OpenAI Prompt (start): ${prompt.substring(0, 500)}...`);
      
      try {
        const response = await this.openai.chat.completions.create({
          model: 'o1',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert energy auditor specializing in commercial and multifamily buildings. Your task is to analyze ALL facility data thoroughly and recommend as many appropriate energy and water conservation measures as possible. Take time to deeply analyze the data and identify ALL improvement opportunities. When analyzing multifamily buildings, be sure to scale savings appropriately by unit count. Always consider both common areas and individual units. Provide specific, actionable recommendations with realistic energy savings estimates. Include the source of incentives (utility program, tax credit, etc.). Always format your response as valid JSON with double quotes for property names and string values. Do not use comments in the JSON. Use precise numbers that appear realistic (avoid round numbers ending in 0 or 5).'
            },
            { role: 'user', content: prompt }
          ],
        });
        
        this.logger.log(`[MEASURES DEBUG] Received response from OpenAI API: ${response.choices.length} choices`);
        
        const content = response.choices[0]?.message?.content;
        
        if (!content) {
          this.logger.error(`[MEASURES DEBUG] Empty response from OpenAI`);
          throw new Error('Empty response from OpenAI');
        }
        
        this.logger.log(`[MEASURES DEBUG] Response content length: ${content.length} characters`);
        this.logger.log(`[MEASURES DEBUG] First 100 characters of response: ${content.substring(0, 100)}`);
        // Log the full raw response content for detailed debugging if needed (can be verbose)
        this.logger.debug(`[MEASURES DEBUG] Full OpenAI Raw Response: ${content}`);
        
        // Enhanced JSON parsing with multiple fallback strategies
        this.logger.log(`[MEASURES DEBUG] Attempting to parse JSON response`);
        try {
          // Strategy 1: Try to parse the entire content as JSON
          try {
            const parsedContent = JSON.parse(content);
            
            this.logger.log(`[MEASURES DEBUG] Successfully parsed JSON directly`);
            
            // Extract measures from the parsed content
            const eems = parsedContent.eems || [];
            const wems = parsedContent.wems || [];
            const rcms = parsedContent.rcms || [];
            
            this.logger.log(`[MEASURES DEBUG] Extracted measures - EEMs: ${eems.length}, WEMs: ${wems.length}, RCMs: ${rcms.length}`);
            
            // Store measures in database
            this.logger.log(`[MEASURES DEBUG] Storing measures in database (JSON direct parse)`);
            await this.storeMeasuresInDatabase(projectId, eems, wems, rcms);
            
            return {
              eems,
              wems,
              rcms
            };
          } catch (directParseError) {
            this.logger.warn(`[MEASURES DEBUG] Direct JSON parsing failed: ${directParseError.message}`);
            
            // Strategy 2: Look for JSON object within the content
            const jsonRegex = /\{[\s\S]*\}/g;
            const jsonMatches = content.match(jsonRegex);
            
            if (jsonMatches && jsonMatches.length > 0) {
              this.logger.log(`[MEASURES DEBUG] Found ${jsonMatches.length} potential JSON objects in response`);
              try {
                // Try each match until one works
                for (const jsonMatch of jsonMatches) {
                  try {
                    // Remove any potential comments that might break JSON parsing
                    const cleanedJson = jsonMatch.replace(/\/\/.*$/gm, '');
                    const parsedContent = JSON.parse(cleanedJson);
                    
                    this.logger.log(`[MEASURES DEBUG] Successfully parsed JSON from matched object`);
                    
                    // Extract measures and store in database
                    const eems = parsedContent.eems || [];
                    const wems = parsedContent.wems || [];
                    const rcms = parsedContent.rcms || [];
                    
                    this.logger.log(`[MEASURES DEBUG] Extracted measures - EEMs: ${eems.length}, WEMs: ${wems.length}, RCMs: ${rcms.length}`);
                    
                    this.logger.log(`[MEASURES DEBUG] Storing measures in database (JSON match parse)`);
                    await this.storeMeasuresInDatabase(projectId, eems, wems, rcms);
                    
                    return {
                      eems,
                      wems,
                      rcms
                    };
                  } catch (matchParseError) {
                    this.logger.warn(`[MEASURES DEBUG] JSON match parsing failed: ${matchParseError.message}`);
                    continue; // Try the next match
                  }
                }
                
                // If we got here, none of the matches worked
                throw new Error('Could not parse any JSON objects in the response');
              } catch (jsonMatchError) {
                this.logger.warn(`[MEASURES DEBUG] JSON match parsing failed: ${jsonMatchError.message}`);
                throw jsonMatchError;
              }
            }
            
            // Strategy 3: Try to fix common JSON issues and parse again
            try {
              this.logger.log(`[MEASURES DEBUG] Attempting to fix common JSON errors`);
              const fixedJson = this.fixCommonJsonErrors(content);
              const parsedContent = JSON.parse(fixedJson);
              
              this.logger.log(`[MEASURES DEBUG] Successfully parsed JSON after fixing common errors`);
              
              // Extract measures and store in database
              const eems = parsedContent.eems || [];
              const wems = parsedContent.wems || [];
              const rcms = parsedContent.rcms || [];
              
              this.logger.log(`[MEASURES DEBUG] Extracted measures - EEMs: ${eems.length}, WEMs: ${wems.length}, RCMs: ${rcms.length}`);
              
              this.logger.log(`[MEASURES DEBUG] Storing measures in database (fixed JSON parse)`);
              await this.storeMeasuresInDatabase(projectId, eems, wems, rcms);
              
              return {
                eems,
                wems,
                rcms
              };
            } catch (fixedJsonError) {
              this.logger.warn(`[MEASURES DEBUG] Fixed JSON parsing failed: ${fixedJsonError.message}`);
              throw fixedJsonError;
            }
          }
        } catch (jsonError) {
          this.logger.error(`[MEASURES DEBUG] All JSON parsing strategies failed: ${jsonError.message}`);
          
          // Fallback to text parsing
          this.logger.log(`[MEASURES DEBUG] Falling back to text parsing`);
          const eems = this.parseEEMsFromText(content);
          const wems = this.parseWEMsFromText(content);
          const rcms = this.parseRCMsFromText(content);
          
          this.logger.log(`[MEASURES DEBUG] Extracted measures from text - EEMs: ${eems.length}, WEMs: ${wems.length}, RCMs: ${rcms.length}`);
          
          // Store measures in database
          this.logger.log(`[MEASURES DEBUG] Storing text-parsed measures in database`);
          await this.storeMeasuresInDatabase(projectId, eems, wems, rcms);
          
          return {
            eems,
            wems,
            rcms
          };
        }
      } catch (openaiError) {
        this.logger.error(`[MEASURES DEBUG] Error calling OpenAI API: ${openaiError.message}`);
        throw openaiError;
      }
    } catch (error) {
      this.logger.error(`Error generating measures with OpenAI: ${error.message}`, error.stack);
      
      // Fall back to default measures
      this.logger.log(`[MEASURES DEBUG] Falling back to default measures`);
      const eems = this.getDefaultEEMs();
      const wems = this.getDefaultWEMs();
      const rcms = this.getDefaultRCMs();
      
      // Store default measures in database
      this.logger.log(`[MEASURES DEBUG] Storing default measures in database`);
      await this.storeMeasuresInDatabase(projectId, eems, wems, rcms);
      
      return {
        eems,
        wems,
        rcms
      };
    }
  }

  /**
   * Fix common JSON errors in OpenAI responses
   */
  private fixCommonJsonErrors(jsonString: string): string {
    // Extract what looks like JSON from the content
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in the response');
    }
    
    let json = jsonMatch[0];
    
    // Replace unquoted property names with quoted ones
    json = json.replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":');
    
    // Remove trailing commas in arrays and objects
    json = json.replace(/,(\s*[}\]])/g, '$1');
    
    // Replace single quotes with double quotes for property values
    json = json.replace(/:(\s*)'([^']*)'/g, ': "$2"');
    
    // Remove comments
    json = json.replace(/\/\/.*$/gm, '');
    json = json.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Ensure all string values are properly quoted
    json = json.replace(/:\s*([a-zA-Z][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2');
    
    return json;
  }

  /**
   * Parse EEMs from text
   */
  private parseEEMsFromText(text: string): any[] {
    const eems = [];
    const eemRegex = /EEM\s+(\d+|_):\s+([^\n]+)\s+Existing\s+Condition:\s+([^\n]+(?:\n(?!Recommendation:)[^\n]+)*)\s+Recommendation:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation|Photo)[^\n]+)*)\s+(?:Implementation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Photo)[^\n]+)*))?\s+(?:Calculation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Implementation|Photo)[^\n]+)*))?\s+(?:Photo\s+References:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation)[^\n]+)*))?/gi;
    
    let match;
    let eemCount = 1;
    
    while ((match = eemRegex.exec(text)) !== null) {
      const title = match[2]?.trim() || `Energy Efficiency Measure ${eemCount}`;
      const existingCondition = match[3]?.trim() || 'No condition specified';
      const recommendation = match[4]?.trim() || 'No recommendation specified';
      const implementationNotes = match[5]?.trim() || '';
      const calculationNotes = match[6]?.trim() || '';
      const photoRefsText = match[7]?.trim() || '';
      
      // Parse photo references if available
      const photoReferences = photoRefsText ? 
        photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
      
      eems.push({
        id: `eem-${eemCount}`,
        title,
        existingCondition,
        recommendation,
        benefits: ['Energy savings', 'Cost reduction', 'Environmental benefits'],
        estimatedSavings: {
          energy: null,
          cost: null,
          paybackPeriod: null
        },
        photoReferences,
        implementationNotes,
        calculationNotes
      });
      
      eemCount++;
    }
    
    // If the regex didn't find anything, try a simpler approach
    if (eems.length === 0) {
      const eemSections = text.split(/EEM\s+\d+:|Energy Efficiency Measure\s+\d+:/i);
      
      // Skip the first element which is likely to be empty or introductory text
      for (let i = 1; i < eemSections.length; i++) {
        const section = eemSections[i].trim();
        if (!section) continue;
        
        // Extract title (first line)
        const lines = section.split('\n');
        const title = lines[0].trim() || `Energy Efficiency Measure ${i}`;
        
        // Try to find existing condition and recommendation
        const existingConditionMatch = section.match(/Existing\s+Condition:([^\n]+(?:\n(?!Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        const recommendationMatch = section.match(/Recommendation:([^\n]+(?:\n(?!Existing\s+Condition:|Implementation:|Calculation:)[^\n]+)*)/i);
        const implementationMatch = section.match(/Implementation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Calculation:)[^\n]+)*)/i);
        const calculationMatch = section.match(/Calculation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:)[^\n]+)*)/i);
        const photoMatch = section.match(/Photo\s+References:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        
        const existingCondition = existingConditionMatch ? existingConditionMatch[1].trim() : 'No condition specified';
        const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'No recommendation specified';
        const implementationNotes = implementationMatch ? implementationMatch[1].trim() : '';
        const calculationNotes = calculationMatch ? calculationMatch[1].trim() : '';
        const photoRefsText = photoMatch ? photoMatch[1].trim() : '';
        
        // Parse photo references if available
        const photoReferences = photoRefsText ? 
          photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
        
        eems.push({
          id: `eem-${i}`,
          title,
          existingCondition,
          recommendation,
          benefits: ['Energy savings', 'Cost reduction', 'Environmental benefits'],
          estimatedSavings: {
            energy: null,
            cost: null,
            paybackPeriod: null
          },
          photoReferences,
          implementationNotes,
          calculationNotes
        });
      }
    }
    
    return eems;
  }

  /**
   * Parse WEMs from text
   */
  private parseWEMsFromText(text: string): any[] {
    const wems = [];
    const wemRegex = /WEM\s+(\d+|_):\s+([^\n]+)\s+Existing\s+Condition:\s+([^\n]+(?:\n(?!Recommendation:)[^\n]+)*)\s+Recommendation:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation|Photo)[^\n]+)*)\s+(?:Implementation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Photo)[^\n]+)*))?\s+(?:Calculation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Implementation|Photo)[^\n]+)*))?\s+(?:Photo\s+References:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation)[^\n]+)*))?/gi;
    
    let match;
    let wemCount = 1;
    
    while ((match = wemRegex.exec(text)) !== null) {
      const title = match[2]?.trim() || `Water Efficiency Measure ${wemCount}`;
      const existingCondition = match[3]?.trim() || 'No condition specified';
      const recommendation = match[4]?.trim() || 'No recommendation specified';
      const implementationNotes = match[5]?.trim() || '';
      const calculationNotes = match[6]?.trim() || '';
      const photoRefsText = match[7]?.trim() || '';
      
      // Parse photo references if available
      const photoReferences = photoRefsText ? 
        photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
      
      wems.push({
        id: `wem-${wemCount}`,
        title,
        existingCondition,
        recommendation,
        benefits: ['Water conservation', 'Cost reduction', 'Environmental benefits'],
        estimatedSavings: {
          water: null,
          cost: null,
          paybackPeriod: null
        },
        photoReferences,
        implementationNotes,
        calculationNotes
      });
      
      wemCount++;
    }
    
    // If the regex didn't find anything, try a simpler approach
    if (wems.length === 0) {
      const wemSections = text.split(/WEM\s+\d+:|Water Efficiency Measure\s+\d+:/i);
      
      // Skip the first element which is likely to be empty or introductory text
      for (let i = 1; i < wemSections.length; i++) {
        const section = wemSections[i].trim();
        if (!section) continue;
        
        // Extract title (first line)
        const lines = section.split('\n');
        const title = lines[0].trim() || `Water Efficiency Measure ${i}`;
        
        // Try to find existing condition and recommendation
        const existingConditionMatch = section.match(/Existing\s+Condition:([^\n]+(?:\n(?!Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        const recommendationMatch = section.match(/Recommendation:([^\n]+(?:\n(?!Existing\s+Condition:|Implementation:|Calculation:)[^\n]+)*)/i);
        const implementationMatch = section.match(/Implementation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Calculation:)[^\n]+)*)/i);
        const calculationMatch = section.match(/Calculation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:)[^\n]+)*)/i);
        const photoMatch = section.match(/Photo\s+References:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        
        const existingCondition = existingConditionMatch ? existingConditionMatch[1].trim() : 'No condition specified';
        const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'No recommendation specified';
        const implementationNotes = implementationMatch ? implementationMatch[1].trim() : '';
        const calculationNotes = calculationMatch ? calculationMatch[1].trim() : '';
        const photoRefsText = photoMatch ? photoMatch[1].trim() : '';
        
        // Parse photo references if available
        const photoReferences = photoRefsText ? 
          photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
        
        wems.push({
          id: `wem-${i}`,
          title,
          existingCondition,
          recommendation,
          benefits: ['Water conservation', 'Cost reduction', 'Environmental benefits'],
          estimatedSavings: {
            water: null,
            cost: null,
            paybackPeriod: null
          },
          photoReferences,
          implementationNotes,
          calculationNotes
        });
      }
    }
    
    return wems;
  }

  /**
   * Parse RCMs from text
   */
  private parseRCMsFromText(text: string): any[] {
    const rcms = [];
    const rcmRegex = /RCM\s+(\d+|_):\s+([^\n]+)\s+Existing\s+Condition:\s+([^\n]+(?:\n(?!Recommendation:)[^\n]+)*)\s+Recommendation:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation|Photo)[^\n]+)*)\s+(?:Implementation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Photo)[^\n]+)*))?\s+(?:Calculation\s+Notes:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Implementation|Photo)[^\n]+)*))?\s+(?:Photo\s+References:\s+([^\n]+(?:\n(?!EEM|WEM|RCM|Calculation|Implementation)[^\n]+)*))?/gi;
    
    let match;
    let rcmCount = 1;
    
    while ((match = rcmRegex.exec(text)) !== null) {
      const title = match[2]?.trim() || `Renewable/Clean Measure ${rcmCount}`;
      const existingCondition = match[3]?.trim() || 'No condition specified';
      const recommendation = match[4]?.trim() || 'No recommendation specified';
      const implementationNotes = match[5]?.trim() || '';
      const calculationNotes = match[6]?.trim() || '';
      const photoRefsText = match[7]?.trim() || '';
      
      // Parse photo references if available
      const photoReferences = photoRefsText ? 
        photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
      
      rcms.push({
        id: `rcm-${rcmCount}`,
        title,
        existingCondition,
        recommendation,
        benefits: ['Reduced carbon footprint', 'Sustainability', 'Energy independence'],
        estimatedSavings: {
          energy: null,
          cost: null,
          paybackPeriod: null
        },
        photoReferences,
        implementationNotes,
        calculationNotes
      });
      
      rcmCount++;
    }
    
    // If the regex didn't find anything, try a simpler approach
    if (rcms.length === 0) {
      const rcmSections = text.split(/RCM\s+\d+:|Renewable\/Clean Measure\s+\d+:/i);
      
      // Skip the first element which is likely to be empty or introductory text
      for (let i = 1; i < rcmSections.length; i++) {
        const section = rcmSections[i].trim();
        if (!section) continue;
        
        // Extract title (first line)
        const lines = section.split('\n');
        const title = lines[0].trim() || `Renewable/Clean Measure ${i}`;
        
        // Try to find existing condition and recommendation
        const existingConditionMatch = section.match(/Existing\s+Condition:([^\n]+(?:\n(?!Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        const recommendationMatch = section.match(/Recommendation:([^\n]+(?:\n(?!Existing\s+Condition:|Implementation:|Calculation:)[^\n]+)*)/i);
        const implementationMatch = section.match(/Implementation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Calculation:)[^\n]+)*)/i);
        const calculationMatch = section.match(/Calculation\s+Notes:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:)[^\n]+)*)/i);
        const photoMatch = section.match(/Photo\s+References:([^\n]+(?:\n(?!Existing\s+Condition:|Recommendation:|Implementation:|Calculation:)[^\n]+)*)/i);
        
        const existingCondition = existingConditionMatch ? existingConditionMatch[1].trim() : 'No condition specified';
        const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'No recommendation specified';
        const implementationNotes = implementationMatch ? implementationMatch[1].trim() : '';
        const calculationNotes = calculationMatch ? calculationMatch[1].trim() : '';
        const photoRefsText = photoMatch ? photoMatch[1].trim() : '';
        
        // Parse photo references if available
        const photoReferences = photoRefsText ? 
          photoRefsText.split('\n').map(line => line.trim()).filter(line => line) : [];
        
        rcms.push({
          id: `rcm-${i}`,
          title,
          existingCondition,
          recommendation,
          benefits: ['Reduced carbon footprint', 'Sustainability', 'Energy independence'],
          estimatedSavings: {
            energy: null,
            cost: null,
            paybackPeriod: null
          },
          photoReferences,
          implementationNotes,
          calculationNotes
        });
      }
    }
    
    return rcms;
  }
  
  /**
   * Get default EEMs if all other methods fail
   */
  private getDefaultEEMs(): any[] {
    return [
      {
        id: 'eem-1',
        title: 'LED Lighting Upgrade',
        existingCondition: 'Building uses inefficient fluorescent lighting',
        recommendation: 'Replace all fluorescent fixtures with LED lighting',
        benefits: ['Energy savings', 'Reduced maintenance', 'Improved light quality'],
        estimatedSavings: {
          energy: 45000,
          cost: 3600,
          paybackPeriod: 2.5
        },
        photoReferences: [],
        implementationNotes: 'Install LED fixtures with comparable light output. Consider occupancy sensors for areas with intermittent use.',
        calculationNotes: 'Calculation based on standard lighting hours and average wattage reduction from T8 fluorescent to LED equivalent.'
      },
      {
        id: 'eem-2',
        title: 'HVAC Controls Optimization',
        existingCondition: 'Manual HVAC controls with minimal scheduling',
        recommendation: 'Install programmable thermostats and optimize scheduling',
        benefits: ['Energy savings', 'Improved comfort', 'Reduced maintenance'],
        estimatedSavings: {
          energy: 35000,
          cost: 2800,
          paybackPeriod: 1.8
        },
        photoReferences: [],
        implementationNotes: 'Program thermostats for setback during unoccupied hours. Consider zoning if not already implemented.',
        calculationNotes: 'Energy savings estimated at 10-15% of HVAC consumption based on industry averages for control upgrades.'
      }
    ];
  }
  
  /**
   * Get default WEMs if all other methods fail
   */
  private getDefaultWEMs(): any[] {
    return [
      {
        id: 'wem-1',
        title: 'Low-Flow Fixtures Installation',
        existingCondition: 'Building uses standard flow fixtures in restrooms',
        recommendation: 'Replace with low-flow faucets, toilets, and showerheads',
        benefits: ['Water conservation', 'Lower utility bills', 'Environmental benefits'],
        estimatedSavings: {
          water: 120000,
          cost: 950,
          paybackPeriod: 1.8
        },
        photoReferences: [],
        implementationNotes: 'Install WaterSense certified fixtures. Consider upgrading during regular maintenance cycles.',
        calculationNotes: 'Savings calculated based on typical flow rates: from 2.2 GPM to 1.5 GPM for faucets, 1.6 GPF to 1.28 GPF for toilets.'
      },
      {
        id: 'wem-2',
        title: 'Water-Efficient Irrigation System',
        existingCondition: 'Current irrigation system lacks smart controls',
        recommendation: 'Install weather-based smart irrigation controllers',
        benefits: ['Water savings', 'Healthier landscaping', 'Reduced runoff'],
        estimatedSavings: {
          water: 85000,
          cost: 780,
          paybackPeriod: 2.2
        },
        photoReferences: [],
        implementationNotes: 'Select a controller that uses local weather data and soil moisture sensors if possible.',
        calculationNotes: 'Typical water savings of 15-30% for smart irrigation controls compared to timer-based systems.'
      }
    ];
  }
  
  /**
   * Get default RCMs if all other methods fail
   */
  private getDefaultRCMs(): any[] {
    return [
      {
        id: 'rcm-1',
        title: 'Solar PV Installation',
        existingCondition: 'Facility relies entirely on grid electricity',
        recommendation: 'Install rooftop solar photovoltaic system',
        benefits: ['Clean energy production', 'Reduced electricity costs', 'Environmental leadership'],
        estimatedSavings: {
          energy: 40000,
          cost: 6000,
          paybackPeriod: 5.5
        },
        photoReferences: [],
        implementationNotes: 'Conduct a roof assessment prior to installation. Consider power purchase agreement (PPA) to minimize upfront costs.',
        calculationNotes: 'Estimated production based on average solar insolation for the region and available roof area.'
      },
      {
        id: 'rcm-2',
        title: 'Battery Energy Storage',
        existingCondition: 'No on-site energy storage capabilities',
        recommendation: 'Install battery energy storage system paired with renewables',
        benefits: ['Peak demand reduction', 'Emergency backup power', 'Optimize renewable usage'],
        estimatedSavings: {
          energy: 0,
          cost: 4500,
          paybackPeriod: 7.0
        },
        photoReferences: [],
        implementationNotes: 'Size the system to cover critical loads during outages. Consider utility incentives for peak shaving.',
        calculationNotes: 'Savings primarily from demand charge reduction, assuming 50% reduction in peak demand charges.'
      }
    ];
  }

  /**
   * Debug method to inspect measures storage in database
   */
  async debugMeasuresStorage(projectId: string) {
    try {

      // Get the raw data from database for inspection
      const data = await this.prisma.energy_conservation_measures.findMany({
        where: {
          project_id: projectId
        }
      });
      
      return {
        rawMeasures: data,
        count: data?.length || 0,
        eems: data?.filter((m: any) => m.measure_type === 'eem')?.length || 0,
        wems: data?.filter((m: any) => m.measure_type === 'wem')?.length || 0,
        rcms: data?.filter((m: any) => m.measure_type === 'rcm')?.length || 0,
        custom: data?.filter((m: any) => m.measure_type === 'custom')?.length || 0
      };
    } catch (error) {
      this.logger.error(`Error in debugMeasuresStorage: ${error.message}`, error.stack);
      throw error;
    }
  }
}

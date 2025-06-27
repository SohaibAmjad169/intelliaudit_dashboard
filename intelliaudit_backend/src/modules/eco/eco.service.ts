import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { UtilityCalcsPrismaService } from '../utility-calcs/utility-calcs-prisma.service';
import { ProjectService } from '../projects/project.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface ECOCompletionRequest {
  projectId: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ECOMeasure {
  title: string;
  description: string;
  estimatedSavings: string;
  implementationCost: string;
  paybackPeriod: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ECNOAnalysis {
  observations: string[];
  recommendations: ECOMeasure[];
  summary: string;
  projectName?: string;
  inspectionDate?: string;
  facilityLocation?: string;
  facilityType?: string;
  facilitySize?: string;
  facilityPurpose?: string;
  weatherConditions?: string;
  clientCommunication?: string;
  followUpActions?: string[];
  assumptions?: string[];
  metadata?: any;
  // New fields for dynamic equipment lists and sections
  hvacEquipment?: string[] | string;
  lightingEquipment?: string[] | string;
  utilitySummary?: string[] | string;
  equipmentInventory?: string[] | string;
  buildingEnvelopeDescription?: string;
  buildingEnvelopeComponents?: string[] | string;
  occupancyScheduleDetails?: string[] | string;
  savingsPotential?: string[] | string;
  // Additional fields used in the service
  hvacSystemDescription?: string;
  lightingSystemDescription?: string;
  utilityDataDescription?: string;
  equipmentDataDescription?: string;
}

@Injectable()
export class ECOService {
  private readonly logger = new Logger(ECOService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private utilityCalcsPrismaService: UtilityCalcsPrismaService,
    private projectService: ProjectService,
    private prisma: PrismaService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

  }

  /**
   * Get ECO data for a project
   */
  async getECOData(projectId: string): Promise<ECNOAnalysis> {
    try {
      // Get project details
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      // Check if project has ECO data
      if (!project.ec_o) {
        this.logger.log(`No ECO data found for project ${projectId}. Generating new analysis.`);
        // If no ECO data exists, generate it
        return this.generateECNOAnalysis(projectId);
      }

      // Parse and return existing ECO data
      try {
        const analysis = JSON.parse(project.ec_o);
        this.logger.log(`Returning existing ECO data for project ${projectId}`);
        return analysis;
      } catch (error) {
        this.logger.error(`Error parsing ECO data for project ${projectId}: ${error.message}`);
        
        // Try to salvage the data by checking if it's already a valid JSON object
        if (typeof project.ec_o === 'object' && project.ec_o !== null) {
          this.logger.log(`Using existing ECO data object for project ${projectId}`);
          return project.ec_o as unknown as ECNOAnalysis;
        }
        
        // If parsing fails and it's not already an object, generate new analysis
        this.logger.log(`Generating new ECO data for project ${projectId} due to parse failure`);
        return this.generateECNOAnalysis(projectId);
      }
    } catch (error) {
      this.logger.error(`Error fetching ECO data: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch ECO data');
    }
  }

  /**
   * Generate ECNO (Existing Conditions and Observations) analysis
   * for ASHRAE Level 2 energy audit using utility data and store it in the project
   */
  async generateECNOAnalysis(projectId: string): Promise<ECNOAnalysis> {
    try {
      
      // Get project details
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        this.logger.error(`Project with ID ${projectId} not found`);
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get utility calculation data
      let utilityCalcs;
      try {
        utilityCalcs = await this.utilityCalcsPrismaService.getTotalUtilityCost(projectId);
      } catch (utilityError) {
        this.logger.error(`Error fetching utility data: ${utilityError.message}`);
        utilityCalcs = null;
      }
      
      // Manually construct the Utility Summary from calculated data
      const utilitySummaryArray: string[] = [];
      if (utilityCalcs?.Electric?.total != null && utilityCalcs.Electric.total > 0) {
        utilitySummaryArray.push(`Electric cost: $${Math.round(utilityCalcs.Electric.total).toLocaleString()}/year`);
      }
      if (utilityCalcs?.['Natural Gas']?.total != null && utilityCalcs['Natural Gas'].total > 0) {
        utilitySummaryArray.push(`Gas cost: $${Math.round(utilityCalcs['Natural Gas'].total).toLocaleString()}/year`);
      }
      // Ensure Water cost is included if available
      if (utilityCalcs?.Water?.total != null && utilityCalcs.Water.total > 0) {
        utilitySummaryArray.push(`Water cost: $${Math.round(utilityCalcs.Water.total).toLocaleString()}/year`);
      }
      if (utilityCalcs?.Total?.total != null && utilityCalcs.Total.total > 0) {
        utilitySummaryArray.push(`Total annual utility cost: $${Math.round(utilityCalcs.Total.total).toLocaleString()} (may include additional utility-related fees)`);
      }
      
      if (utilitySummaryArray.length === 0) {
        this.logger.warn(`No utility summary data could be constructed for project ${projectId}`);
      }
      
      // Get only field notes equipment (exclude photo-based equipment)
      let fieldNotesEquipment: any[] = [];
      try {
        const rawEquipment = await this.prisma.$queryRaw`
          SELECT * FROM equipment_analysis 
          WHERE project_id = ${projectId}::uuid
          AND (source_type = 'field_notes' OR photo_url IS NULL)
          AND id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        `;
        
        // Filter out unnecessary fields and null values to reduce token usage
        fieldNotesEquipment = Array.isArray(rawEquipment) 
          ? rawEquipment.map(item => {
              // Keep only essential properties
              const essentialProps = {
                id: item.id,
                equipment_type: item.equipment_type,
                quantity: item.quantity,
                wattage: item.wattage,
                manufacturer: item.manufacturer,
                model: item.model,
                location: item.location,
                condition: item.condition,
                operating_hours: item.operating_hours,
                days_per_week: item.days_per_week,
                source_type: item.source_type,
                lamps_per_fixture: item.lamps_per_fixture,
                lamp_type: item.lamp_type
              };
              
              // Remove null or undefined values
              return Object.entries(essentialProps)
                .filter(([_, value]) => value !== null && value !== undefined)
                .reduce((obj: Record<string, any>, [key, value]) => {
                  obj[key] = value;
                  return obj;
                }, {});
            })
          : [];
      } catch (equipmentError) {
        this.logger.error(`Error fetching field notes equipment data: ${equipmentError.message}`);
      }
      
      // Prepare data for OpenAI prompt (exclude utilitySummary generation from AI)
      const projectData = {
        name: project.name,
        address: project.building_address || project.property_address || '',
        city: project.property_city || '',
        state: project.property_state || '',
        zip: project.property_postal_code || project.zip_code || '',
        propertyType: project.property_primary_function || project.building_use_type || '',
        grossFloorArea: project.property_gross_floor_area || project.building_sqft || 0,
        yearBuilt: project.property_year_built || project.year_built || 0,
        fieldNotes: project.raw_notes || '',
        // Provide calculated utility data for context, but not for AI to summarize again
        utilityData: {
          electric: utilityCalcs?.Electric || { total: 0, units: 'kWh' },
          gas: utilityCalcs?.['Natural Gas'] || { total: 0, units: 'therms' },
          water: utilityCalcs?.Water || { total: 0, units: 'kgal' },
          totalCost: utilityCalcs?.Total?.total || 0
        },
        equipment: fieldNotesEquipment
      };
      
      // Generate analysis using OpenAI (AI should not generate utilitySummary)
      this.logger.log(`Generating analysis with OpenAI for project ${projectId}`);
      const analysisFromAI = await this.generateAnalysisWithOpenAI(projectData);
      
      // Combine AI analysis with the manually constructed utility summary
      const finalAnalysis: ECNOAnalysis = {
        ...analysisFromAI,
        utilitySummary: utilitySummaryArray, // Overwrite with manually constructed summary
      };
      
      // Store final analysis in the project
      await this.storeECNOAnalysisInProject(projectId, finalAnalysis);
      
      return finalAnalysis;
    } catch (error) {
      this.logger.error(`Error generating ECNO analysis: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new InternalServerErrorException(`Failed to generate ECNO analysis: ${error.message}`);
    }
  }

  /**
   * Generate analysis using OpenAI
   */
  private async generateAnalysisWithOpenAI(projectData: any): Promise<ECNOAnalysis> {
    try {
      // Prepare a summarized version of the data to reduce token count
      const summarizedProjectData = {
        ...projectData,
        equipment: this.summarizeEquipmentData(projectData.equipment)
      };
      
      const systemPrompt = `
        You are an expert energy auditor conducting an ASHRAE Level 2 energy audit.
        Your task is to analyze the provided building data, field notes, and equipment information to generate a comprehensive
        Existing Conditions and Observations (EC&O) analysis for the building.
        
        The analysis should include:
        1. Detailed observations about the building's energy usage patterns based on available data
        2. Specific energy conservation opportunities (ECOs) with estimated savings
        3. A summary of findings
        4. Recommendations prioritized by impact and feasibility
        
        Format your response as a JSON object with the following structure:
        {
          "observations": ["Observation 1", "Observation 2", ...],
          "recommendations": [
            {
              "title": "ECO Title",
              "description": "Detailed description",
              "estimatedSavings": "Estimated annual savings in kWh and dollars",
              "implementationCost": "Estimated implementation cost",
              "paybackPeriod": "Estimated payback period in years",
              "priority": "high|medium|low"
            },
            ...
          ],
          "summary": "Overall summary of findings",
          "hvacEquipment": ["Equipment 1", "Equipment 2", ...],
          "lightingEquipment": ["Equipment 1", "Equipment 2", ...],
          "equipmentInventory": ["Inventory item 1", "Inventory item 2", ...],
          "buildingEnvelopeDescription": "Description of building envelope",
          "buildingEnvelopeComponents": ["Component 1", "Component 2", ...],
          "occupancyScheduleDetails": ["Schedule detail 1", "Schedule detail 2", ...],
          "weatherConditions": "Description of weather conditions during audit"
        }
        
        DO NOT include the 'utilitySummary' field in your JSON response.
      `;
      
      const userPrompt = `
        Please analyze the following building data, field notes, and equipment information to generate an EC&O analysis:
        
        Project: ${JSON.stringify(summarizedProjectData, null, 2)}
        
        Based on this data, provide a comprehensive EC&O analysis for an ASHRAE Level 2 energy audit.
        Pay particular attention to the field notes and the equipment data derived from field notes.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: 'o1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        this.logger.error('Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }
      
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        
        // Parse JSON
        const parsedContent = JSON.parse(jsonString);
        
        // Validate and return analysis (utilitySummary will be added later)
        const validated = this.validateAnalysis(parsedContent);
        // Ensure utilitySummary is explicitly removed or undefined if AI included it
        delete (validated as any).utilitySummary; 
        return validated;
      } catch (error) {
        this.logger.error(`Error parsing OpenAI response: ${error.message}`);
        this.logger.error(`Raw response content: ${content.substring(0, 200)}...`);
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (error) {
      this.logger.error(`Error generating analysis with OpenAI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Summarize equipment data to reduce token count
   */
  private summarizeEquipmentData(equipmentData: any[]): any {
    if (!Array.isArray(equipmentData) || equipmentData.length === 0) {
      return [];
    }

    // Group equipment by type with proper typing
    const equipmentByType: Record<string, any[]> = {};
    
    for (const item of equipmentData) {
      const type = item.equipment_type || 'Unknown';
      if (!equipmentByType[type]) {
        equipmentByType[type] = [];
      }
      equipmentByType[type].push(item);
    }

    // Create a summary for each equipment type
    const summary = [];
    
    for (const [type, items] of Object.entries<any[]>(equipmentByType)) {
      const count = items.length;
      
      // Skip if there are no items of this type
      if (count === 0) continue;
      
      // Get the total wattage, if available
      let totalWattage = 0;
      let totalQuantity = 0;
      let hasValidWattage = false;
      
      for (const item of items) {
        const wattage = Number(item.wattage || 0);
        const quantity = Number(item.quantity || 1);
        
        if (wattage > 0) {
          totalWattage += wattage * quantity;
          totalQuantity += quantity;
          hasValidWattage = true;
        }
      }
      
      // Create a summary object with only essential information
      const typeSummary = {
        equipment_type: type,
        count: count,
        total_quantity: totalQuantity,
        average_wattage: hasValidWattage ? (totalWattage / totalQuantity).toFixed(2) : 'N/A',
        // Include a sample of up to 3 items for reference
        samples: items.slice(0, 3).map((item: any) => {
          // Extract only the most important fields for each sample
          return {
            equipment_type: item.equipment_type,
            quantity: item.quantity,
            wattage: item.wattage,
            location: item.location,
            manufacturer: item.manufacturer,
            model: item.model
          };
        })
      };
      
      summary.push(typeSummary);
    }
    
    return summary;
  }

  /**
   * Validate and format analysis
   */
  private validateAnalysis(analysis: any): ECNOAnalysis {
    // Ensure all required fields exist
    return {
      observations: Array.isArray(analysis.observations) ? analysis.observations : [],
      recommendations: Array.isArray(analysis.recommendations) ? this.processRecommendations(analysis) : [],
      summary: analysis.summary || 'No summary provided',
      hvacEquipment: analysis.hvacEquipment || [],
      lightingEquipment: analysis.lightingEquipment || [],
      equipmentInventory: analysis.equipmentInventory || [],
      buildingEnvelopeDescription: analysis.buildingEnvelopeDescription || '',
      buildingEnvelopeComponents: analysis.buildingEnvelopeComponents || [],
      occupancyScheduleDetails: analysis.occupancyScheduleDetails || [],
      weatherConditions: analysis.weatherConditions || 'Weather conditions not available',
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'OpenAI o1'
      }
    };
  }

  /**
   * Process recommendations to ensure they have all required fields
   */
  private processRecommendations(analysis: any): ECOMeasure[] {
    if (!Array.isArray(analysis.recommendations)) {
      return [];
    }
    
    return analysis.recommendations.map((rec: any) => ({
      title: rec.title || 'Untitled Recommendation',
      description: rec.description || 'No description provided',
      estimatedSavings: rec.estimatedSavings || 'Unknown',
      implementationCost: rec.implementationCost || 'Unknown',
      paybackPeriod: rec.paybackPeriod || 'Unknown',
      priority: rec.priority || 'medium'
    }));
  }

  /**
   * Store ECNO analysis in the project
   */
  async storeECNOAnalysisInProject(projectId: string, analysis: ECNOAnalysis): Promise<void> {
    try {
      
      // Update project with analysis
      await this.prisma.projects.update({
        where: { id: projectId },
        data: { ec_o: JSON.stringify(analysis) }
      });
      
    } catch (error) {
      this.logger.error(`Error storing ECNO analysis: ${error.message}`);
      throw new Error(`Failed to store ECNO analysis: ${error.message}`);
    }
  }

  /**
   * Enhance ECNO analysis with field notes and photos
   */
  async enhanceComprehensiveECNOAnalysis(projectId: string): Promise<ECNOAnalysis> {
    try {
      
      // Get existing analysis
      const analysis = await this.getECOData(projectId);
      
      // Get project details
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get utility data summary only
      const utilityData = await this.utilityCalcsPrismaService.getTotalUtilityCost(projectId);
      const utilitySummary = {
        electric: utilityData?.Electric ? { total: utilityData.Electric.total, units: 'kWh' } : null,
        gas: utilityData?.['Natural Gas'] ? { total: utilityData['Natural Gas'].total, units: 'therms' } : null,
        water: utilityData?.Water ? { total: utilityData.Water.total, units: 'kgal' } : null,
        totalCost: utilityData?.Total?.total || 0
      };
      
      // Get ONLY summary of equipment data (no individual records)
      let equipmentSummary: any[] = [];
      try {
        const equipmentTypeCounts = await this.prisma.$queryRaw`
          SELECT equipment_type, COUNT(*) as count
          FROM equipment_analysis 
          WHERE project_id = ${projectId}::uuid
          GROUP BY equipment_type
        `;
        
        // Convert BigInt to Number to avoid serialization issues
        equipmentSummary = Array.isArray(equipmentTypeCounts) 
          ? equipmentTypeCounts.map(item => ({
              equipment_type: item.equipment_type,
              count: Number(item.count) // Convert BigInt to Number
            }))
          : [];
      } catch (equipmentError) {
        this.logger.error(`Error fetching equipment summary: ${equipmentError.message}`);
      }
      
      // Get field notes
      const fieldNotes = project.raw_notes || '';
      
      // Get limited photo analysis data (max 5 photos)
      const photoAnalysisFull = await this.getPhotoAnalysisData(projectId);
      const photoAnalysis = photoAnalysisFull.slice(0, 5).map(photo => ({
        id: photo.id,
        equipment_type: photo.equipment_type,
        photo_url: photo.photo_url
      }));
      
      // Prepare minimal data for OpenAI prompt
      const enhancementData = {
        projectName: project.name,
        projectLocation: project.building_address || project.property_address || '',
        propertyType: project.property_primary_function || '',
        grossFloorArea: project.property_gross_floor_area || 0,
        yearBuilt: project.property_year_built || 0,
        fieldNotes: fieldNotes,
        photoCount: photoAnalysisFull.length,
        photoSample: photoAnalysis,
        equipmentSummary: equipmentSummary,
        utilitySummary: utilitySummary,
        // Include only essential parts of the existing analysis
        existingAnalysis: {
          observations: analysis.observations || [],
          recommendations: analysis.recommendations || [],
          summary: analysis.summary || ''
        }
      };
      
      // Generate enhanced analysis using OpenAI
      const systemPrompt = `
        You are an expert energy auditor enhancing an ASHRAE Level 2 energy audit.
        Your task is to analyze the provided field notes and limited sample data
        to enhance the existing EC&O analysis for the building.
        
        Format your response as a JSON object with the following structure:
        {
          "observations": ["New observation 1", "New observation 2"],
          "recommendations": [
            {
              "title": "New ECO Title",
              "description": "Description",
              "estimatedSavings": "Savings estimate",
              "implementationCost": "Cost estimate",
              "paybackPeriod": "Payback period",
              "priority": "high|medium|low"
            }
          ],
          "summary": "New insights to add to the summary",
          "hvacEquipment": [],
          "lightingEquipment": [],
          "utilitySummary": []
        }
        
        Focus on providing 2-3 new high-quality insights rather than trying to be comprehensive.
      `;
      
      const userPrompt = `
        Please provide targeted enhancements to the existing EC&O analysis using this limited data:
        
        Project: ${JSON.stringify(enhancementData, null, 2)}
        
        Your response should focus on 2-3 new high-quality observations and recommendations only.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: 'o1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        
        try {
          // Parse JSON
          const parsedContent = JSON.parse(jsonString);
          
          // Create enhanced analysis with minimal modifications to the original
          const enhancedAnalysis = {
            ...analysis,
            // Add new observations without duplicating
            observations: [...new Set([
              ...(analysis.observations || []),
              ...(parsedContent.observations || [])
            ])],
            // Add new recommendations
            recommendations: [
              ...(analysis.recommendations || []),
              ...(this.processRecommendations({ recommendations: parsedContent.recommendations || [] }))
            ],
            // Append to summary
            summary: analysis.summary 
              ? `${analysis.summary}\n\nAdditional Insights: ${parsedContent.summary || 'No additional insights provided'}` 
              : parsedContent.summary || 'No summary provided',
            // Add metadata about the enhancement
            metadata: {
              ...(analysis.metadata || {}),
              enhancedAt: new Date().toISOString(),
            }
          };

          // Store the enhanced analysis in the project ec_o field
          await this.storeECNOAnalysisInProject(projectId, enhancedAnalysis);
          
          return enhancedAnalysis;
        } catch (parseError) {
          this.logger.error(`Error parsing JSON: ${parseError.message}`);
          // If we can't parse the JSON properly, still try to return the original analysis
          return analysis;
        }
      } catch (error) {
        this.logger.error(`Error processing OpenAI response: ${error.message}`);
        // Return the original analysis if we couldn't enhance it
        return analysis;
      }
    } catch (error) {
      this.logger.error(`Error enhancing comprehensive ECNO analysis: ${error.message}`);
      if (error.response) {
        this.logger.error(`OpenAI API error: ${JSON.stringify(error.response.data)}`);
      }
      throw new InternalServerErrorException('Failed to enhance comprehensive ECNO analysis');
    }
  }

  async enhanceDirectECNOAnalysis(projectId: string, promptEnhancement: string): Promise<ECNOAnalysis> {
    try {
      // Get project details
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get utility data and include it in the OpenAI prompt
      const utilityData = await this.utilityCalcsPrismaService.getTotalUtilityCost(projectId);
      
      // Get safe equipment data
      const equipmentData = await this.prisma.$queryRaw`
        SELECT * FROM equipment_analysis 
        WHERE project_id = ${projectId}::uuid
        AND id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `;
      
      // Get existing analysis or create a new one if it doesn't exist
      let analysis: ECNOAnalysis;
      try {
        analysis = await this.getECOData(projectId);
      } catch (error) {
        this.logger.warn(`No existing ECO data found, generating a new analysis first: ${error.message}`);
        analysis = await this.generateECNOAnalysis(projectId);
      }
      
      // Prepare data for OpenAI prompt
      const enhancementData = {
        projectName: project.name,
        fieldNotes: promptEnhancement,
        photoAnalysis: [],
        equipment: equipmentData,
        utilityData: {
          electric: utilityData?.Electric || { total: 0, units: 'kWh' },
          gas: utilityData?.['Natural Gas'] || { total: 0, units: 'therms' },
          water: utilityData?.Water || { total: 0, units: 'kgal' },
          totalCost: utilityData?.Total?.total || 0
        },
        existingAnalysis: analysis
      };
      
      // Generate enhanced analysis using OpenAI
      const systemPrompt = `
        You are an expert energy auditor enhancing an ASHRAE Level 2 energy audit.
        Your task is to analyze the provided field notes and equipment data
        to enhance the existing EC&O analysis for the building.
        
        Format your response as a JSON object with the same structure as the existing analysis,
        but with enhanced observations, recommendations, and other details based on the new data.
      `;
      
      const userPrompt = `
        Please enhance the following EC&O analysis with the provided field notes:
        
        Enhancement Data: ${JSON.stringify(enhancementData, null, 2)}
        
        Based on this data, provide an enhanced EC&O analysis for an ASHRAE Level 2 energy audit.
      `;
      
      const response = await this.openai.chat.completions.create({
        model: 'o1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        
        // Parse JSON
        const parsedContent = JSON.parse(jsonString);
        
        // Create enhanced analysis
        const enhancedAnalysis = {
          // Combine original and new observations, removing duplicates
          observations: [...new Set([
            ...(analysis.observations || []),
            ...(parsedContent.observations || [])
          ])],
          // Use the new recommendations that incorporate both field notes and photo insights
          recommendations: this.processRecommendations(parsedContent),
          // Combine original summary with comprehensive insights
          summary: analysis.summary 
            ? `${analysis.summary}\n\nComprehensive Analysis Insights: ${parsedContent.summary || 'No additional insights provided'}` 
            : parsedContent.summary || 'No summary provided',
          // Add equipment details and specific section information from LLM
          weatherConditions: parsedContent.weatherConditions || analysis.weatherConditions || 'Weather conditions data not available.',
          occupancyScheduleDetails: parsedContent.occupancyScheduleDetails || analysis.occupancyScheduleDetails || [],
          hvacSystemDescription: parsedContent.hvacSystemDescription || analysis.hvacSystemDescription || '',
          hvacEquipment: parsedContent.hvacEquipment || analysis.hvacEquipment || [],
          lightingSystemDescription: parsedContent.lightingSystemDescription || analysis.lightingSystemDescription || '',
          lightingEquipment: parsedContent.lightingEquipment || analysis.lightingEquipment || [],
          utilityDataDescription: parsedContent.utilityDataDescription || analysis.utilityDataDescription || '',
          utilitySummary: parsedContent.utilitySummary || analysis.utilitySummary || [],
          equipmentDataDescription: parsedContent.equipmentDataDescription || analysis.equipmentDataDescription || '',
          equipmentInventory: parsedContent.equipmentInventory || analysis.equipmentInventory || [],
          buildingEnvelopeDescription: parsedContent.buildingEnvelopeDescription || analysis.buildingEnvelopeDescription || '',
          buildingEnvelopeComponents: parsedContent.buildingEnvelopeComponents || analysis.buildingEnvelopeComponents || [],
          // Add metadata about the enhancement
          metadata: {
            ...(analysis.metadata || {}),
            comprehensiveEnhanced: true,
            fieldNotesEnhanced: true,
            photosAnalyzed: false,
            lastEnhancedAt: new Date().toISOString(),
          }
        };

        // Store the enhanced analysis in the project ec_o field
        await this.storeECNOAnalysisInProject(projectId, enhancedAnalysis);
        
        return enhancedAnalysis;
      } catch (error) {
        this.logger.error(`Error parsing OpenAI response: ${error.message}`);
        throw new Error('Failed to parse OpenAI response');
      }
    } catch (error) {
      this.logger.error(`Error enhancing direct ECNO analysis: ${error.message}`);
      if (error.response) {
        this.logger.error(`OpenAI API error: ${JSON.stringify(error.response.data)}`);
      }
      throw new InternalServerErrorException('Failed to enhance direct ECNO analysis');
    }
  }

  /**
   * Get photo analysis data
   */
  private async getPhotoAnalysisData(projectId: string) {
    try {
      const photoAnalysis = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
          source_type: 'photo_analysis'
        },
        select: {
          id: true,
          equipment_type: true,
          manufacturer: true,
          model: true,
          location: true,
          photo_url: true,
          thumbnail_url: true,
          notes: true,
          source_type: true
        },
        orderBy: { created_at: 'desc' }
      });
      
      this.logger.log(`Found ${photoAnalysis.length} photos for project ${projectId} with source_type = photo_analysis`);
      return photoAnalysis;
    } catch (error) {
      this.logger.error(`Error fetching photo analysis: ${error.message}`);
      return [];
    }
  }
}
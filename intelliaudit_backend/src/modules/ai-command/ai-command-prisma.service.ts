import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { EnergyUsageAnalysisService } from './energy-usage-analysis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MeasuresPrismaService } from '../equipment/measures/measures-prisma.service';

interface CommandResponse {
  text: string;
  data?: any;
  type: 'text' | 'analysis' | 'error';
}

@Injectable()
export class AiCommandPrismaService {
  private readonly logger = new Logger(AiCommandPrismaService.name);
  private readonly openai;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly energyAnalysisService: EnergyUsageAnalysisService,
    private readonly prisma: PrismaService,
    private readonly measuresService: MeasuresPrismaService,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI configuration is missing');
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  /**
   * Process a command from the command bar
   * @param command - The command text from the user
   * @param projectId - Current project ID (optional)
   * @returns Response to the command
   */
  async processCommand(command: string, projectId?: string): Promise<CommandResponse> {
  
    
    try {
      // First, determine the intent of the command
      const intent = await this.classifyCommandIntent(command);
      
      switch (intent) {
        case 'energy_usage_analysis':
          return this.handleEnergyUsageAnalysis(command, projectId);
        case 'general_question':
        default:
          return this.handleGeneralQuestion(command, projectId);
      }
    } catch (error) {
      
      return {
        text: `I encountered an error processing your command: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Classify the intent of a user command
   * @param command - User command text
   * @returns Intent classification
   */
  private async classifyCommandIntent(command: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an intent classifier for an energy audit assistant. 
            Classify the user's command into one of these categories:
            - energy_usage_analysis: If the user wants to analyze energy usage or get recommendations
            - general_question: If the user is asking a general question about energy audits or the system
            
            Respond with ONLY the category name, nothing else.`
          },
          { role: 'user', content: command }
        ],
        temperature: 0.1,
      });

      const intent = response.choices[0]?.message?.content?.trim().toLowerCase() || 'general_question';
      return intent;
    } catch (error) {
      this.logger.error('Error classifying intent:', error);
      return 'general_question'; // Default to general question on error
    }
  }

  /**
   * Handle energy usage analysis commands
   * @param _command - User command (currently unused but kept for consistent method signature)
   * @param projectId - Current project ID
   * @returns Analysis response
   */
  private async handleEnergyUsageAnalysis(_command: string, projectId?: string): Promise<CommandResponse> {
    if (!projectId) {
      return {
        text: "I need a project ID to analyze energy usage. Please select a project first.",
        type: 'text'
      };
    }

    try {
      
      // Get analysis from the energy analysis service
      const analysisResult = await this.energyAnalysisService.analyzeEnergyUsage(projectId);
      
      // Get recommendations based on the analysis
      const recommendationsResult = await this.energyAnalysisService.generateRecommendations(
        projectId
      );
      
      // Create a user-friendly summary
      const summary = this.createEnergyAnalysisSummary(analysisResult, recommendationsResult);
      
      return {
        text: summary,
        data: {
          analysis: analysisResult,
          recommendations: recommendationsResult
        },
        type: 'analysis'
      };
    } catch (error) {
      this.logger.error('Error analyzing energy usage:', error);
      return {
        text: `I encountered an error analyzing energy usage: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Handle general questions about energy audits
   * @param command - User command
   * @param projectId - Optional project ID for context
   * @returns Response to the question
   */
  private async handleGeneralQuestion(command: string, projectId?: string): Promise<CommandResponse> {
    try {
      // Fetch context if projectId is available (Implementation pending)
      const context = projectId ? await this.getProjectContext(projectId) : undefined;
      
      // Pass command and context to getGeneralResponse
      const responseText = await this.getGeneralResponse(command, context);
      return {
        text: responseText,
        type: 'text'
      };
    } catch (error) {
      this.logger.error('Error handling general question:', error);
      return {
        text: `I'm having trouble answering that question right now.`,
        type: 'error'
      };
    }
  }

  /**
   * Get a general response using the AI model
   * @param command - User command
   * @param context - Optional project context data
   * @returns AI-generated response
   */
  private async getGeneralResponse(command: string, context?: string): Promise<string> {
    try {
      // Define the system prompt dynamically based on context availability
      let systemPromptContent = `You are IntelliAudit, an AI assistant specialized in energy audits and building efficiency.
You help energy auditors analyze buildings, equipment, and energy usage patterns.
Provide helpful, concise responses about energy auditing, HVAC systems, building efficiency,
and related topics. If you don't know something, say so honestly.`;

      if (context) {
        systemPromptContent += `

Use the following project data context PRIMARILY to answer the user's question. Supplement with your general knowledge only if the context doesn't suffice or the question is general. Context:
---
${context}
---`;
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Consider using o1 if that's the standard
        messages: [
          {
            role: 'system',
            content: systemPromptContent
          },
          { role: 'user', content: command }
        ],
        temperature: 0.5, // Slightly lower temperature for more factual responses when context is provided
      });

      return response.choices[0]?.message?.content || "I'm not sure how to respond to that.";
    } catch (error) {
      this.logger.error('Error getting general response:', error);
      return `I'm having trouble processing that request right now.`;
    }
  }

  /**
   * Create a user-friendly summary of energy usage analysis
   * @param analysis - Energy usage analysis result
   * @param recommendations - Optional energy saving recommendations
   * @returns Formatted summary
   */
  private createEnergyAnalysisSummary(analysis: any, recommendations?: any): string {
    let summary = analysis.analysis;
    
    // Add metrics summary
    if (analysis.metrics) {
      summary += '\n\nKey Metrics:\n';
      summary += `- Total equipment wattage: ${analysis.metrics.total_wattage.toLocaleString()} watts\n`;
      summary += `- Average equipment efficiency: ${(analysis.metrics.average_efficiency * 100).toFixed(1)}%\n`;
      summary += `- Estimated daily consumption: ${analysis.metrics.daily_kwh.toFixed(2)} kWh\n`;
      summary += `- Estimated monthly cost: $${analysis.metrics.monthly_cost.toFixed(2)}\n`;
    }
    
    // Add recommendations summary if available
    if (recommendations && recommendations.recommendations && recommendations.recommendations.length > 0) {
      summary += '\n\nTop Recommendations:\n';
      recommendations.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
        summary += `${index + 1}. ${rec.title}\n`;
        summary += `   Estimated savings: ${rec.estimated_savings}\n`;
        summary += `   Estimated cost: ${rec.estimated_cost}\n`;
      });
    }
    
    return summary;
  }

  /**
   * Fetches and formats comprehensive project data for AI context.
   * @param projectId - The ID of the project to fetch data for.
   * @returns A string containing the formatted project context, or undefined if error.
   */
  private async getProjectContext(projectId: string): Promise<string | undefined> {
    this.logger.log(`Attempting to fetch context for project: ${projectId}`);
    try {
      // 1. Attempt to fetch pre-generated context from the database
      const projectWithContext = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: { ai_context: true }, // Select only the ai_context field
      });

      // Check if context exists and is valid JSON
      if (projectWithContext?.ai_context && typeof projectWithContext.ai_context === 'object') {
        this.logger.log(`Found pre-generated context for project: ${projectId}`);
        try {
          // Stringify the fetched JSON to pass to the AI
          const contextString = JSON.stringify(projectWithContext.ai_context, null, 2);
          this.logger.log(`Using stored context. Length: ${contextString?.length}`);
          return contextString;
        } catch (stringifyError) {
            this.logger.error(`Error stringifying stored context for project ${projectId}: ${stringifyError.message}`);
            // Fall through to generate context on-the-fly if stringify fails
        }
      } else {
          this.logger.log(`No valid pre-generated context found for project ${projectId}. Generating on-the-fly.`);
      }

      // 2. Fallback: Generate context on-the-fly if not found or invalid
      const projectData = await this.fetchComprehensiveProjectData(projectId);
      if (!projectData) {
          this.logger.warn(`Could not fetch data to generate on-the-fly context for project: ${projectId}`);
          return undefined; // Return undefined if data fetch fails
      }
      
      const contextString = this.formatContext(projectData);
      this.logger.log(`Generated on-the-fly context. Length: ${contextString?.length}`);
      return contextString;
      
    } catch (error) {
      this.logger.error(`Error fetching context for project ${projectId}: ${error.message}`, error.stack);
      return undefined; // Return undefined on error
    }
  }

  /**
   * Placeholder function to fetch all relevant project data.
   * This needs to be implemented using injected services.
   * @param projectId - The project ID.
   * @returns An object containing various project data points.
   */
  private async fetchComprehensiveProjectData(projectId: string): Promise<any> {
    this.logger.log(`Fetching comprehensive data for project: ${projectId}`);
    
    const fetchData = async (fetcher: Promise<any>, name: string) => {
      try {
        return await fetcher;
      } catch (error) {
        this.logger.warn(`Failed to fetch ${name} for project ${projectId}: ${error.message}`);
        return null; // Return null if a specific fetch fails
      }
    };

    // Fetch project details, include more fields
    const projectPromise = this.prisma.projects.findUnique({ 
        where: { id: projectId },
        select: { 
            id: true,
            name: true,
            building_address: true,
            status: true,
            building_type: true,
            property_gross_floor_area: true,
            property_year_built: true,
            property_city: true,
            property_state: true,
            total_units: true,
            unit_types: true,
            building_floors: true,
            energy_star_score: true,
            site_total_energy: true,
            source_total_energy: true,
            site_intensity: true,
            source_intensity: true,
            direct_ghg_emissions: true,
            building_info: true, 
            building_notes: true,
            raw_notes: true,
            ec_o: true // Add ec_o field
        }
    });

    // Fetch *all* equipment analysis data, not just a sample
    const equipmentPromise = this.prisma.equipment_analysis.findMany({ 
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      // Fetch more fields from equipment_analysis
      select: {
          id: true,
          equipment_type: true,
          manufacturer: true,
          model: true,
          serial_number: true,
          specifications: true,
          condition: true,
          notes: true,
          category: true,
          quantity: true,
          operating_hours: true,
          annual_kwh: true
      }
      // Removed 'take: 50'
    });

    // Fetch *all* measures data using the service method
    const measuresPromise = this.measuresService.getMeasuresFromDatabase(projectId);
    
    // Fetch historical utility data (e.g., last 24 months)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const utilityDataPromise = this.prisma.utility_data.findMany({
        where: {
            project_id: projectId,
            end_date: { gte: twoYearsAgo } // Filter for the last 2 years
        },
        orderBy: { end_date: 'desc' }
    });

    // Execute all promises concurrently
    const [project, equipment, measures, utilityData] = await Promise.all([
      fetchData(projectPromise, 'project details'),
      fetchData(equipmentPromise, 'equipment analysis'),
      fetchData(measuresPromise, 'measures'),
      fetchData(utilityDataPromise, 'utility data (last 2 years)')
    ]);

    return {
      project,
      equipment,
      measures, // Contains eems, wems, rcms fetched by the service
      utilityData // Array of historical utility data
      // buildingInfo is now part of the project object
    };
  }
  
  /**
   * Formats the fetched project data into a string suitable for the AI prompt.
   * @param data - The comprehensive project data object.
   * @returns A formatted string.
   */
  private formatContext(data: any): string {
    // Select and summarize data carefully to manage token count.
    const context: Record<string, any> = {};

    if (data.project) {
      // Include more project fields, handle potential nulls
      context.project = {
        id: data.project.id,
        name: data.project.name || 'N/A',
        address: data.project.building_address || 'N/A',
        status: data.project.status || 'N/A',
        building_type: data.project.building_type || 'N/A',
        gross_floor_area: data.project.property_gross_floor_area || 'N/A',
        year_built: data.project.property_year_built || 'N/A',
        city: data.project.property_city || 'N/A',
        state: data.project.property_state || 'N/A',
        total_units: data.project.total_units,
        building_floors: data.project.building_floors,
        energy_star_score: data.project.energy_star_score,
        site_intensity: data.project.site_intensity,
        source_intensity: data.project.source_intensity,
        direct_ghg_emissions: data.project.direct_ghg_emissions,
        ec_o: data.project.ec_o || null, // Include ec_o field
        // Add notes fields if they exist
        ...(data.project.building_notes && { building_notes: data.project.building_notes }),
        ...(data.project.raw_notes && { raw_notes_summary: data.project.raw_notes.substring(0, 200) + '...' }) // Summarize raw notes
      };
      
      // Parse and include building_info if available
      if (data.project.building_info) {
          let buildingInfoData = data.project.building_info;
          if (typeof buildingInfoData === 'string') {
              try { buildingInfoData = JSON.parse(buildingInfoData); } catch (e) { /* Keep as string */ }
          }
          context.project.building_info = {
              stories: buildingInfoData?.stories,
              construction_type: buildingInfoData?.construction_type,
              foundation_type: buildingInfoData?.foundation_type,
              roof_type: buildingInfoData?.roof_type,
              // Add more fields from building_info as needed
          };
      }
    }

    // Summarize equipment data
    if (data.equipment && data.equipment.length > 0) {
      const equipmentSummary: Record<string, any> = {
        total_count: data.equipment.length,
        types: {},
        conditions: { Good: 0, Fair: 0, Poor: 0, Unknown: 0 },
        sample: []
      };

      data.equipment.forEach((eq: any, index: number) => {
        // Count by type
        const type = eq.equipment_type || 'Unknown Type';
        equipmentSummary.types[type] = (equipmentSummary.types[type] || 0) + (eq.quantity || 1);
        
        // Count by condition (assuming condition is structured { overall: 'Good' | ... })
        const conditionStatus = eq.condition?.overall || 'Unknown';
        if (equipmentSummary.conditions.hasOwnProperty(conditionStatus)) {
            equipmentSummary.conditions[conditionStatus]++;
        } else {
            equipmentSummary.conditions['Unknown']++;
        }
        
        // Include first 5-10 items as sample with more detail
        if (index < 10) {
          equipmentSummary.sample.push({
            type: eq.equipment_type || 'N/A',
            make: eq.manufacturer || 'N/A',
            model: eq.model || 'N/A',
            quantity: eq.quantity || 1,
            condition: eq.condition?.overall || 'N/A',
            // Add key spec if available, e.g., capacity
            spec_capacity: eq.specifications?.capacity
          });
        }
      });
      context.equipmentSummary = equipmentSummary;
    }
    
    // Summarize measures data (EEMs, WEMs, RCMs)
    const allMeasures = [ ...(data.measures?.eems || []), ...(data.measures?.wems || []), ...(data.measures?.rcms || [])];
    if (allMeasures.length > 0) {
      context.measuresSummary = {
          total_count: allMeasures.length,
          eems_count: data.measures?.eems?.length || 0,
          wems_count: data.measures?.wems?.length || 0,
          rcms_count: data.measures?.rcms?.length || 0,
          // Include details of top 5 measures by potential savings (if available)
          sample_top_measures: allMeasures
            .sort((a: any, b: any) => (b.estimated_savings || 0) - (a.estimated_savings || 0)) // Sort by savings desc
            .slice(0, 5)
            .map((m: any) => ({ 
                title: m.title,
                description_summary: m.description?.substring(0, 100) + '...',
                estimated_savings: m.estimated_savings,
                estimated_cost: m.estimated_cost,
                type: m.measure_type // Assuming measure_type field exists
            })),
      };
    }

    // Summarize historical utility data
    if (data.utilityData && data.utilityData.length > 0) {
        context.utilityUsageSummary = {
            record_count: data.utilityData.length,
            time_period_start: data.utilityData[data.utilityData.length - 1]?.start_date,
            time_period_end: data.utilityData[0]?.end_date,
            meter_types: {},
            annual_totals: { ELECTRICITY: 0, NATURAL_GAS: 0, WATER: 0 }, // Placeholder for totals
        };
        
        data.utilityData.forEach((record: any) => {
            const type = record.meter_type || 'UNKNOWN';
            context.utilityUsageSummary.meter_types[type] = (context.utilityUsageSummary.meter_types[type] || 0) + 1;
            
            // Basic annual total calculation (assuming records cover full years)
            // A more robust calculation would be needed for partial years/gaps
            if (context.utilityUsageSummary.annual_totals.hasOwnProperty(type)) {
                context.utilityUsageSummary.annual_totals[type] += record.usage || 0;
            }
        });
    }

    // Convert the summarized context object to a JSON string
    try {
        // Use JSON.stringify with a replacer to handle potential BigInts from Prisma Decimal fields
        const jsonString = JSON.stringify(context, (_key, value) =>
            typeof value === 'bigint'
                ? value.toString() // Convert BigInt to string
                : value // Return other values unchanged
        , 2); // Pretty print
        return jsonString;
    } catch (error) {
        this.logger.error(`Error stringifying context for project ${data.project?.id}: ${error.message}`);
        // Fallback to a simpler representation if stringify fails
        return `{"error": "Could not format context", "project_id": "${data.project?.id}"}`; 
    }
  }

  /**
   * Generates the AI context for a given project and stores it in the database.
   * @param projectId - The ID of the project.
   * @returns An object indicating success or failure.
   */
  async generateAndStoreContext(projectId: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Attempting to generate and store context for project: ${projectId}`);
    try {
      // 1. Fetch comprehensive data (reuse existing private method)
      const projectData = await this.fetchComprehensiveProjectData(projectId);
      
      if (!projectData || !projectData.project) {
        throw new NotFoundException(`Project with ID ${projectId} not found or core data missing.`);
      }

      // 2. Format the context (reuse existing private method)
      const contextString = this.formatContext(projectData);
      let contextJson: any;
      try {
        contextJson = JSON.parse(contextString); // Ensure it's valid JSON before storing
      } catch (parseError) {
        this.logger.error(`Failed to parse formatted context string for project ${projectId}: ${parseError.message}`);
        throw new Error('Failed to create valid JSON context.');
      }

      // 3. Store the context in the projects table
      await this.prisma.projects.update({
        where: { id: projectId },
        data: {
          ai_context: contextJson, // Store the parsed JSON object
          // Optionally update an updated_at timestamp if you have one for the context
        },
      });

      this.logger.log(`Successfully generated and stored context for project: ${projectId}`);
      return { success: true, message: 'AI context generated and stored successfully.' };

    } catch (error) {
      this.logger.error(`Error generating/storing context for project ${projectId}: ${error.message}`, error.stack);
      // Re-throw specific known errors, or return a generic failure message
      if (error instanceof NotFoundException) {
          throw error;
      }
      return { 
        success: false, 
        message: `Failed to generate or store AI context: ${error.message}` 
      };
    }
  }
}

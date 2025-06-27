import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

interface EquipmentData {
  equipment_type: string;
  wattage: number | null;
  annual_hours: number | null;
  efficiency: number | null;
  quantity: number | null;
  energy_source: string | null;
  capacity: number | null;
  input_rating: number | null;
  load_factor: number | null;
}

interface EquipmentAnalysis {
  type: string;
  wattage: number;
  hours_per_day: number;
  efficiency: number;
  quantity: number;
  energy_source: string;
  capacity: number;
  input_rating: number;
  load_factor: number;
}

@Injectable()
export class EnergyUsageAnalysisService {
  private readonly logger = new Logger(EnergyUsageAnalysisService.name);
  private readonly openai;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI configuration is missing');
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
  }
  
  /**
   * Analyze energy usage data for a project
   * @param projectId The project ID to analyze
   * @param query Optional specific query about energy usage
   * @returns Analysis results
   */
  async analyzeEnergyUsage(projectId: string, query?: string): Promise<any> {
    try {
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
        },
        select: {
          equipment_type: true,
          wattage: true,
          annual_hours: true,
          efficiency: true,
          quantity: true,
          energy_source: true,
          capacity: true,
          input_rating: true,
          load_factor: true
        }
      }) as EquipmentData[];

      if (!equipment.length) {
        throw new Error('No equipment data found for this project');
      }

      const equipmentForAnalysis: EquipmentAnalysis[] = equipment.map(item => ({
        type: item.equipment_type,
        wattage: item.wattage || 0,
        hours_per_day: item.annual_hours ? Math.round(item.annual_hours / 365) : 0,
        efficiency: item.efficiency || 0,
        quantity: item.quantity || 1,
        energy_source: item.energy_source || 'electricity',
        capacity: item.capacity || 0,
        input_rating: item.input_rating || 0,
        load_factor: item.load_factor || 1
      }));
      
      const systemPrompt = `You are an energy efficiency expert analyzing equipment data for a building.
      Provide insights on energy usage, efficiency opportunities, and potential savings.
      Focus on practical recommendations that could reduce energy consumption.
      
      If the user has a specific question, focus your analysis on answering that question.
      Otherwise, provide a general analysis of the equipment's energy usage patterns.`;
      
      const userPrompt = query 
        ? `Analyze this equipment data with focus on: ${query}\n\n${JSON.stringify(equipmentForAnalysis, null, 2)}`
        : `Analyze this equipment data and provide energy efficiency recommendations:\n\n${JSON.stringify(equipmentForAnalysis, null, 2)}`;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      });
      
      const analysis = response.choices[0]?.message?.content || 'No analysis available';
      
      const totalWattage = equipmentForAnalysis.reduce((sum: number, item: EquipmentAnalysis) => 
        sum + (item.wattage * item.quantity), 0);
      
      const avgEfficiency = equipmentForAnalysis.reduce((sum: number, item: EquipmentAnalysis) => 
        sum + (item.efficiency * item.quantity), 0) / 
        equipmentForAnalysis.reduce((sum: number, item: EquipmentAnalysis) => 
          sum + item.quantity, 0);
      
      const dailyKwh = equipmentForAnalysis.reduce((sum: number, item: EquipmentAnalysis) => {
        if (item.energy_source === 'electricity') {
          return sum + (item.wattage * (item.hours_per_day || 8) * item.quantity * item.load_factor / 1000);
        }
        return sum;
      }, 0);
      
      const monthlyCost = dailyKwh * 30 * 0.15; // Assuming $0.15 per kWh
      
      return {
        analysis,
        metrics: {
          total_wattage: totalWattage,
          average_efficiency: avgEfficiency,
          daily_kwh: dailyKwh,
          monthly_cost: monthlyCost
        },
        equipment: equipmentForAnalysis,
        metadata: {
          timestamp: new Date().toISOString(),
          project_id: projectId,
          query: query || 'general analysis'
        }
      };
    } catch (error) {
      this.logger.error('Error analyzing energy usage:', error);
      throw error;
    }
  }
  
  /**
   * Generate energy saving recommendations based on equipment data
   * @param projectId The project ID
   * @returns Recommendations for energy savings
   */
  async generateRecommendations(projectId: string): Promise<any> {
    try {
      // Fetch real equipment data
      const equipment = await this.prisma.equipment_analysis.findMany({
        where: {
          project_id: projectId,
        },
        select: {
          id: true,
          project_id: true,
          equipment_type: true,
          manufacturer: true,
          model: true,
          category: true,
          quantity: true,
          wattage: true,
          annual_hours: true,
        }
      });

      if (!equipment.length) {
        throw new Error('No equipment data found for this project');
      }

      const equipmentSummary = equipment.map(item => ({
        id: item.id,
        project_id: item.project_id,
        equipment_type: item.equipment_type,
        manufacturer: item.manufacturer,
        model: item.model,
        category: item.category,
        quantity: item.quantity,
        wattage: item.wattage,
        annual_hours: item.annual_hours
      }));
      
      const systemPrompt = `You are an energy efficiency consultant specializing in building audits.
      Generate specific, actionable recommendations to improve energy efficiency.
      For each recommendation, include:
      1. A clear description of the action
      2. The estimated energy savings (percentage or kWh)
      3. The estimated cost to implement
      4. The payback period (if calculable)
      
      Focus on practical recommendations that building owners could realistically implement.
      Base your recommendations on this actual equipment data.`;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate energy efficiency recommendations based on this equipment data:\n\n${JSON.stringify(equipmentSummary, null, 2)}` }
        ],
        temperature: 0.7,
      });
      
      const recommendationsText = response.choices[0]?.message?.content || 'No recommendations available';
      
      // Parse the recommendations into a structured format
      const recommendationsList = recommendationsText
        .split(/\d+\.\s+/)
        .filter(Boolean)
        .map(rec => {
          const lines = rec.split('\n').filter(Boolean);
          const title = lines[0].trim();
          const details = lines.slice(1).join('\n');
          
          // Try to extract savings and cost information
          const savingsMatch = details.match(/savings[:\s]+(\d+[%\s\w\.]+)/i);
          const costMatch = details.match(/cost[:\s]+(\$[\d,]+)/i);
          const paybackMatch = details.match(/payback[:\s]+([\d\.]+\s+\w+)/i);
          
          return {
            title,
            details,
            estimated_savings: savingsMatch ? savingsMatch[1] : 'Varies',
            estimated_cost: costMatch ? costMatch[1] : 'Varies',
            payback_period: paybackMatch ? paybackMatch[1] : 'Varies'
          };
        });
      
      return {
        recommendations: recommendationsList,
        raw_text: recommendationsText,
        metadata: {
          timestamp: new Date().toISOString(),
          project_id: projectId,
          equipment_analyzed: equipment.length
        }
      };
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

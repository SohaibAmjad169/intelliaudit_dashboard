import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UtilityCalcsPrismaService {
  // Default energy cost constants
  private readonly DEFAULT_ENERGY_COSTS = {
    ELECTRICITY_KWH: 0.18,  // $0.18 per kWh
    NATURAL_GAS_THERM: 1.05, // $1.05 per therm
    WATER_GALLON: 10.26  // $10.26 per unit for water
  };
  
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Store utility calculations from utility data
   */
  async storeUtilityCalcs(
    projectId: string,
    propertyId: string,
    utilityData: any[]
  ) {
    try {
      if (!utilityData || utilityData.length === 0) {
        return { 
          success: true, 
          message: 'No utility data to process',
          count: 0
        };
      }

      const smoothedData = this.calculateRollingAverages(utilityData);
      
      // Fetch building address
      const buildingAddress = await this.fetchBuildingAddress(projectId);
      if (!buildingAddress) {
        return {
          success: false,
          message: `No building address found for project ID: ${projectId}`,
          count: 0
        };
      }
      
      // Format the data for storage in utility_calcs
      const formattedData = await Promise.all(smoothedData.map(async data => {
        // Use pre-processed month and year if available, otherwise extract from start_date
        const month = data.month || (data.start_date ? new Date(data.start_date).getUTCMonth() + 1 : new Date().getUTCMonth() + 1);
        const year = data.year || (data.start_date ? new Date(data.start_date).getUTCFullYear() : new Date().getUTCFullYear());

        // Calculate cost based on usage and meter type
        const meterType = data.meterType || data.meter_type;
        const cost = await this.calculateCost(data.usage, meterType);

        return {
          project_id: projectId,
          pm_id: propertyId,
          month: month,
          year: year,
          meter_id: data.meter_id || data.meterId || 'unknown',
          meter_type: meterType || 'Unknown',
          usage: data.usage,
          cost: cost,
          usage_units: this.getUsageUnits(meterType),
        };
      }));
      
      // Store in batches to avoid potential issues with large datasets
      const batchSize = 50;
      let successCount = 0;
      
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        
        try {
          // Use Prisma's createMany for batch insertion
          const result = await this.prisma.utility_calcs.createMany({
            data: batch,
            skipDuplicates: true, // Skip records that would cause a unique constraint violation
          });
          
          successCount += result.count;
        } catch (error) {
          // Continue with next batch even if there's an error
        }
      }
      
      return {
        success: successCount > 0,
        message: `Successfully stored ${successCount} of ${formattedData.length} utility calculation records`,
        count: successCount
      };
    } catch (error) {
      return {
        success: false,
        message: `Error storing utility calculations: ${error.message}`,
        count: 0
      };
    }
  }

  /**
   * Fetch building address from projects table
   */
  private async fetchBuildingAddress(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId },
        select: { building_address: true }
      });
      
      if (!project || !project.building_address) {
        return null;
      }
      
      return project.building_address;
    } catch (error) {
      return null;
    }
  }

  /**
   * Process utility calculations for a project - fetches utility data and processes it 
   */
  async processUtilityCalculations(projectId: string, propertyId: string) {
    try {
      // Fetch raw utility data from utility_data table
      const utilityData = await this.prisma.utility_data.findMany({
        where: {
          project_id: projectId,
          pm_id: propertyId
        },
        orderBy: [
          { meter_id: 'asc' },
          { start_date: 'asc' }
        ]
      });
      
      if (!utilityData || utilityData.length === 0) {
        return {
          success: false,
          message: 'No utility data found to process',
          count: 0
        };
      }
      
      // Pre-process the data to ensure correct month/year values
      const processedData = utilityData.map(data => {
        // Get the start date string
        const startDateStr = data.start_date?.toISOString() || 
                            (typeof data.start_date === 'string' ? data.start_date : null) ||
                            (data as any).startDate;
        
        let month, year;
        
        if (startDateStr) {
          // Extract date components directly from the ISO string to avoid timezone issues
          const dateParts = startDateStr.split('T')[0].split('-');
          if (dateParts.length >= 2) {
            year = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10);
          }
        }
        
        // Fallback to Date object if string parsing fails
        if (!month || !year) {
          const startDate = data.start_date ? new Date(data.start_date) : new Date();
          month = startDate.getUTCMonth() + 1;
          year = startDate.getUTCFullYear();
        }
        
        return {
          ...data,
          month: month,
          year: year
        };
      });
      
      // Process using the storeUtilityCalcs method with corrected data
      return await this.storeUtilityCalcs(projectId, propertyId, processedData);
      
    } catch (error) {
      return {
        success: false,
        message: `Error processing utility calculations: ${error.message}`,
        count: 0
      };
    }
  }

  /**
   * Get total utility cost for a project by meter type
   */
  async getTotalUtilityCost(projectId: string) {
    try {
      // Get all utility calculations for the project
      const utilityCalcs = await this.prisma.utility_calcs.findMany({
        where: { project_id: projectId }
      });
      
      if (!utilityCalcs || utilityCalcs.length === 0) {
        return {
          Electric: { total: 0, units: '$' },
          'Natural Gas': { total: 0, units: '$' },
          Steam: { total: 0, units: '$' },
          Water: { total: 0, units: '$' },
          Other: { total: 0, units: '$' },
          Total: { total: 0, units: '$' }
        };
      }
      
      // Group by meter type and sum costs
      const costByType: { [key: string]: { total: number, units: string } } = {
        Electric: { total: 0, units: '$' },
        'Natural Gas': { total: 0, units: '$' },
        Steam: { total: 0, units: '$' },
        Water: { total: 0, units: '$' },
        Other: { total: 0, units: '$' },
        Total: { total: 0, units: '$' }
      };
      
      utilityCalcs.forEach(calc => {
        const meterType = calc.meter_type || 'Other';
        const cost = typeof calc.cost === 'object' && calc.cost !== null ? Number(calc.cost) : (calc.cost || 0);
        
        if (costByType[meterType]) {
          costByType[meterType].total += cost;
        } else {
          costByType.Other.total += cost;
        }
        
        costByType.Total.total += cost;
      });
      
      return costByType;
    } catch (error) {
      return {
        Electric: { total: 0, units: '$' },
        'Natural Gas': { total: 0, units: '$' },
        Steam: { total: 0, units: '$' },
        Water: { total: 0, units: '$' },
        Other: { total: 0, units: '$' },
        Total: { total: 0, units: '$' }
      };
    }
  }

  /**
   * Get total utility usage for a project by meter type
   */
  async getTotalUtilityUsage(projectId: string) {
    try {
      interface UsageType {
        total: number;
        units: string;
      }
      
      const utilityCalcs = await this.prisma.utility_calcs.findMany({
        where: { project_id: projectId }
      });
      
      if (!utilityCalcs || utilityCalcs.length === 0) {
        return {
          Electric: { total: 0, units: 'kWh' },
          'Natural Gas': { total: 0, units: 'therms' },
          Steam: { total: 0, units: 'lb' },
          Water: { total: 0, units: 'kgal' },
          Other: { total: 0, units: '' }
        };
      }
      
      const usageByType: Record<string, UsageType> = {
        Electric: { total: 0, units: 'kWh' },
        'Natural Gas': { total: 0, units: 'therms' },
        Steam: { total: 0, units: 'lb' },
        Water: { total: 0, units: 'kgal' },
        Other: { total: 0, units: '' }
      };
      
      utilityCalcs.forEach(calc => {
        const meterType = calc.meter_type || 'Other';
        const usage = typeof calc.usage === 'object' && calc.usage !== null ? Number(calc.usage) : (calc.usage || 0);
        
        if (usageByType[meterType]) {
          usageByType[meterType].total += usage;
          usageByType[meterType].units = this.getUsageUnits(meterType);
        } else {
          usageByType.Other.total += usage;
        }
      });
      
      return usageByType;
    } catch (error) {
      return {
        Electric: { total: 0, units: 'kWh' },
        'Natural Gas': { total: 0, units: 'therms' },
        Steam: { total: 0, units: 'lb' },
        Water: { total: 0, units: 'kgal' },
        Other: { total: 0, units: '' }
      };
    }
  }

  /**
   * Get the appropriate usage units based on meter type
   */
  private getUsageUnits(meterType: string): string {
    if (!meterType) return '';
    
    if (meterType === 'Electric') {
      return 'kWh';
    } else if (meterType === 'Natural Gas') {
      return 'therms';
    } else if (meterType && meterType.includes('Water')) {
      return 'HCF';
    } else if (meterType === 'Steam') {
      return 'lb';
    }
    
    return '';
  }

  /**
   * Apply a 2-month rolling average to utility usage.
   * Formula: For each month M, average = (M + M-1) / 2
   * Example: Jan 2024 = (Dec 2023 + Jan 2024) / 2
   */
  private calculateRollingAverages(utilityData: any[]): any[] {
    try {
      const grouped: Record<string, any[]> = {};
 
      // Group data by meter ID
      for (const item of utilityData) {
        const meterId = item.meter_id || item.meterId || 'unknown';
        if (!grouped[meterId]) grouped[meterId] = [];
        
        const startDateStr = item.start_date?.toISOString() || 
                            (typeof item.start_date === 'string' ? item.start_date : null) ||
                            (item as any).startDate;
                            
        let month, year;
        const startDate = new Date(item.start_date || (item as any).startDate || new Date());
        
        if (startDateStr) {
          const dateParts = startDateStr.split('T')[0].split('-');
          if (dateParts.length >= 2) {
            year = parseInt(dateParts[0], 10);
            month = parseInt(dateParts[1], 10);
          } else {
            month = startDate.getUTCMonth() + 1;
            year = startDate.getUTCFullYear();
          }
        } else {
          month = startDate.getUTCMonth() + 1;
          year = startDate.getUTCFullYear();
        }
        
        grouped[meterId].push({
          ...item,
          date: startDate,
          month: month,
          year: year,
          usage: Number(item.usage) || 0
        });
      }
 
      const result: any[] = [];
 
      // Process each meter's data
      for (const [meterId, entries] of Object.entries(grouped)) {
        const sorted = entries.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        for (let i = 0; i < sorted.length; i++) {
          const current = sorted[i];
          
          let previousUsage = 0;
          let previousFound = false;
          
          if (current.month === 1) {
            const decemberEntries = sorted.filter(item => 
              item.month === 12 && item.year === current.year - 1
            );
            
            if (decemberEntries.length > 0) {
              previousUsage = decemberEntries[decemberEntries.length - 1].usage;
              previousFound = true;
            }
          } else {
            const previousMonth = sorted.find(item => 
              item.month === current.month - 1 && 
              item.year === current.year
            );
            
            if (previousMonth) {
              previousUsage = previousMonth.usage;
              previousFound = true;
            }
          }
 
          const avg = previousFound ? (current.usage + previousUsage) / 2 : current.usage;
 
          result.push({
            ...current,
            meter_id: meterId,
            meter_type: current.meter_type || current.meterType,
            usage: avg,
            month: current.month,
            year: current.year,
            date: undefined
          });
        }
      }
 
      return result;
    } catch (error) {
      return utilityData;
    }
  }

  /**
   * Calculate cost based on usage and meter type
   */
  private async calculateCost(usage: number, meterType: string): Promise<number> {
    if (!usage) {
      return 0;
    }

    let cost = 0;
    if (meterType === 'Electric') {
      cost = usage * this.DEFAULT_ENERGY_COSTS.ELECTRICITY_KWH;
    } else if (meterType === 'Natural Gas') {
      cost = usage * this.DEFAULT_ENERGY_COSTS.NATURAL_GAS_THERM;
    } else if (meterType && meterType.includes('Water')) {
      cost = usage * this.DEFAULT_ENERGY_COSTS.WATER_GALLON;
    } else if (meterType === 'Steam') {
      const steamToMMBtu = usage * 0.001194;
      cost = steamToMMBtu * 15.00;
    } else {
      cost = usage * this.DEFAULT_ENERGY_COSTS.ELECTRICITY_KWH;
    }
    
    return Math.round(cost);
  }

  /**
   * Get monthly data by meter type for a project
   */
  async getMonthlyDataByType(projectId: string, meterType: string) {
    try {
      return await this.prisma.utility_calcs.findMany({
        where: {
          project_id: projectId,
          meter_type: meterType
        },
        select: {
          month: true,
          year: true,
          usage: true,
          cost: true
        },
        orderBy: [
          { year: 'asc' },
          { month: 'asc' }
        ]
      });
    } catch (error) {
      return [];
    }
  }
}

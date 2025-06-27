import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface TotalUsage {
  electric: number;
  naturalGas: number;
  total: number;
}

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gets share page data for a project
   * @param projectId Project ID
   * @returns Share page data
   */
  async getSharePageData(projectId: string): Promise<any> {
    // Fetch energy audit data
    const energyMeasures = await this.prisma.energy_conservation_measures.findMany({
      where: { project_id: projectId }
    });

    const existingConditions = await this.prisma.equipment_analysis.findMany({
      where: { project_id: projectId }
    });

    const utilityData = await this.prisma.utility_data.findMany({
      where: { project_id: projectId }
    });

    // Calculate total usage from utility data
    const totalUsage = utilityData.reduce((acc: TotalUsage, curr) => {
      const usage = curr.usage instanceof Decimal ? curr.usage.toNumber() : (curr.usage || 0);
      if (curr.meter_type?.toLowerCase().includes('electric')) {
        acc.electric += usage;
      } else if (curr.meter_type?.toLowerCase().includes('gas')) {
        acc.naturalGas += usage;
      }
      return acc;
    }, { electric: 0, naturalGas: 0, total: 0 });
    totalUsage.total = totalUsage.electric + totalUsage.naturalGas;

    // Fetch water data
    const waterData = await this.prisma.utility_data.findMany({
      where: { 
        project_id: projectId,
        meter_type: { contains: 'water', mode: 'insensitive' }
      },
      orderBy: { start_date: 'asc' }
    });

    return {
      energyAudit: {
        measures: energyMeasures,
        existingConditions,
        totalUsage
      },
      waterAudit: {
        measures: [], // Water conservation measures not implemented yet
        existingConditions: [], // Water equipment analysis not implemented yet
        totalUsage: {
          water: waterData.reduce((sum: number, curr) => {
            const usage = curr.usage instanceof Decimal ? curr.usage.toNumber() : (curr.usage || 0);
            return sum + usage;
          }, 0)
        },
        monthlyData: {
          water: waterData.map(d => ({
            date: d.start_date,
            usage: d.usage instanceof Decimal ? d.usage.toNumber() : (d.usage || 0),
            cost: d.cost instanceof Decimal ? d.cost.toNumber() : (d.cost || 0)
          }))
        }
      }
    };
  }
} 
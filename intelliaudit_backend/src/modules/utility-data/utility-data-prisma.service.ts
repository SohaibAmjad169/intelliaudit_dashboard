import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UtilityDataPrismaService {
  private readonly logger = new Logger(UtilityDataPrismaService.name);
  
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Store raw utility data in the utility_data table
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param utilityData - The utility data to store
   * @param property - Property details
   * @returns Object indicating success or failure
   */
  async storeRawUtilityData(
    projectId: string,
    propertyId: string,
    utilityData: any[],
    property: any
  ) {
    try {
      console.log(`DEBUG - storeRawUtilityData - Input Parameters:`);
      console.log(`  projectId: ${projectId}`);
      console.log(`  propertyId: ${propertyId}`);
      console.log(`  utilityData: ${utilityData ? utilityData.length : 0} records`);
      console.log(`  property: ${property ? 'Present' : 'Missing'}`);
      
      if (!utilityData || utilityData.length === 0) {
        console.log(`DEBUG - No utility data to store`);
        return { 
          success: true, 
          message: 'No utility data to store',
          count: 0
        };
      }
      
      console.log(`DEBUG - Preparing to store ${utilityData.length} records`);
      
      // Format the data for database insertion
      const formattedData = utilityData.map(data => {
        const startDate = new Date(data.startDate);
        return {
          project_id: projectId,
          pm_id: propertyId,
          meter_id: data.meterId || 'unknown',
          meter_name: data.meterName || data.meterType || 'Unknown Meter',
          meter_type: data.meterType || 'Unknown',
          start_date: startDate,
          end_date: new Date(data.endDate),
          month: startDate.getMonth() + 1, // Adding month (1-12)
          year: startDate.getFullYear(), // Adding year
          usage: data.usage,
          cost: data.cost || 0,
          usage_units: this.getUsageUnits(data.meterType),
          property_name: property?.propertyName,
          property_address: property?.propertyAddress,
          property_city: property?.propertyCity,
          property_state: property?.propertyState,
          property_postal_code: property?.propertyPostalCode,
          property_primary_function: property?.propertyPrimaryFunction,
          property_gross_floor_area: property?.propertyGrossFloorArea,
          property_year_built: property?.propertyYearBuilt
        };
      });
      
      console.log(`DEBUG - Data formatted successfully`);
      console.log(`DEBUG - First formatted record sample:`, JSON.stringify(formattedData[0], null, 2));
      
      // Store in batches to avoid potential issues with large datasets
      const batchSize = 50;
      let successCount = 0;
      
      console.log(`DEBUG - Starting batch insertion with batch size: ${batchSize}`);
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        console.log(`DEBUG - Processing batch ${i/batchSize + 1} with ${batch.length} records`);
        
        try {
          // Use Prisma's createMany for batch insertion
          const result = await this.prisma.utility_data.createMany({
            data: batch,
            skipDuplicates: true, // This is equivalent to upsert with onConflict
          });
          
          successCount += result.count;
          
        } catch (error) {
        
        }
      }
      
      console.log(`DEBUG - Storage process completed: ${successCount} of ${utilityData.length} records stored`);
      return {
        success: successCount > 0,
        message: `Successfully stored ${successCount} of ${utilityData.length} raw utility data records`,
        count: successCount
      };
    } catch (error) {
      console.log(`DEBUG - Error in storeRawUtilityData:`, error);
      this.logger.error(`Error storing raw utility data: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Error storing raw utility data: ${error.message}`,
        count: 0
      };
    }
  }

  /**
   * Get usage units based on meter type
   */
  private getUsageUnits(meterType: string): string {
    switch (meterType) {
      case 'Electric':
        return 'kWh';
      case 'Natural Gas':
        return 'therms';
      case 'Steam':
        return 'lb';
      default:
        return '';
    }
  }
}

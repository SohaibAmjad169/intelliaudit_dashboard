import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyDataService } from '../property/property-data.service';

@Injectable()
export class UtilityDataPrismaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyDataService: PropertyDataService,
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
      

      if (!utilityData || utilityData.length === 0) {
        return { 
          success: true, 
          message: 'No utility data to store',
          count: 0
        };
      }
      
      // Format the data for storage
      console.log(`DEBUG - Starting to format data`);
      const formattedData = utilityData.map(data => {
        // Parse the date using ISO format to ensure consistent handling
        const startDateStr = data.startDate;
        const startDate = new Date(startDateStr);
        
        // Extract date components directly from the ISO string to avoid timezone issues
        // Format should be YYYY-MM-DD
        const dateParts = startDateStr.split('T')[0].split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10); // This will be 1-12 directly from the string
        
        // Log for debugging
        console.log(`DEBUG - Date parsing:
          Raw date: ${startDateStr}
          Parsed month: ${month}
          Parsed year: ${year}
        `);
        
        return {
          project_id: projectId,
          pm_id: propertyId,
          
          // Meter information
          meter_id: data.meterId,
          meter_name: `Meter ${data.meterId}`,
          meter_type: data.meterType,
          
          // Time period information
          start_date: startDate,
          end_date: new Date(data.endDate),
          month: month, // Use the directly parsed month (1-12)
          year: year,   // Use the directly parsed year
          
          // Usage and cost
          usage: data.usage,
          cost: data.cost || 0,
          usage_units: this.getUsageUnits(data.meterType),
          
          // Property information
          property_name: property.name,
          property_address: property.address,
          property_city: property.city,
          property_state: property.state,
          property_postal_code: property.postalCode,
          property_primary_function: property.primaryFunction,
          property_gross_floor_area: property.grossFloorArea,
          property_year_built: property.yearBuilt,
        };
      });
      
      // Store in batches to avoid potential issues with large datasets
      const batchSize = 10; // Reduced batch size to prevent transaction timeouts
      let successCount = 0;
      
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);

        
        try {
          // Process each record individually instead of using a transaction
          // This is more reliable for large datasets
          for (const record of batch) {
            const startDate = new Date(record.start_date);
            await this.prisma.utility_data.upsert({
              where: {
                project_id_pm_id_meter_id_start_date: {
                  project_id: record.project_id,
                  pm_id: record.pm_id,
                  meter_id: record.meter_id,
                  start_date: record.start_date
                }
              },
              update: {
                ...record,
                month: startDate.getMonth() + 1,
                year: startDate.getFullYear()
              },
              create: {
                ...record,
                month: startDate.getMonth() + 1,
                year: startDate.getFullYear()
              }
            });
          }
          
          successCount += batch.length;

        } catch (error) {
 
        }
      }
      

      return {
        success: successCount > 0,
        message: `Successfully stored ${successCount} of ${utilityData.length} raw utility data records`,
        count: successCount
      };
    } catch (error) {

      return {
        success: false,
        message: `Error storing raw utility data: ${error.message}`,
        count: 0
      };
    }
  }

  /**
   * Fetch utility data for a project
   * @param projectId - The project ID
   * @returns Array of utility data records
   */
  async getUtilityDataForProject(projectId: string) {
    try {

      
      const utilityData = await this.prisma.utility_data.findMany({
        where: {
          project_id: projectId
        },
        orderBy: {
          start_date: 'desc'
        }
      });
      
      return {
        success: true,
        data: utilityData,
        count: utilityData.length
      };
    } catch (error) {

      return {
        success: false,
        error: `Failed to fetch utility data: ${error.message}`,
        data: [],
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
      case 'Water':
        return 'kgal';
      default:

        return '';
    }
  }

  /**
   * Fetch meters from Portfolio Manager API
   * @param propertyId - The Portfolio Manager property ID
   * @returns Array of meters
   */
  async fetchMeters(propertyId: string) {
    try {
      // We'll use these variables when implementing the API integration
      if (!propertyId) {
        throw new Error('Property ID is required');
      }
      
      // Throw error until API integration is implemented
      throw new Error('Portfolio Manager API integration not yet implemented');
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch meters: ${error.message}`,
        data: [],
        count: 0
      };
    }
  }

  /**
   * Fetch utility data for a specific time period
   * @param propertyId - The Portfolio Manager property ID
   * @param startDate - Start date for utility data (YYYY-MM-DD)
   * @param endDate - End date for utility data (YYYY-MM-DD)
   * @returns Array of utility data records
   */
  async fetchUtilityData(propertyId: string, startDate: string, endDate: string) {
    try {
      // Validate required parameters
      if (!propertyId || !startDate || !endDate) {
        throw new Error('Property ID, start date, and end date are required');
      }

      // Validate date format and range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      
      if (end < start) {
        throw new Error('End date must be after start date');
      }

      // First, fetch property details to include with utility data
      const propertyResult = await this.propertyDataService.fetchPropertyFromApi(propertyId);
      if (!propertyResult) {
        throw new Error(`Failed to fetch property data for property ID: ${propertyId}`);
      }
      
      // Next, fetch meters
      const metersResult = await this.fetchMeters(propertyId);
      if (!metersResult.success || !metersResult.data || metersResult.data.length === 0) {
        throw new Error(`Failed to fetch meters for property ID: ${propertyId}`);
      }

      // Throw error until API integration is implemented
      throw new Error('Portfolio Manager API integration not yet implemented');
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch utility data: ${error.message}`,
        data: [],
        property: null,
        count: 0
      };
    }
  }

  /**
   * Fetch and store utility data for a project
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param startDate - Start date for utility data (YYYY-MM-DD)
   * @param endDate - End date for utility data (YYYY-MM-DD)
   * @returns Result of the operation
   */
  async fetchAndStoreUtilityData(projectId: string, propertyId: string, startDate: string, endDate: string) {
    try {

      
      // Fetch utility data
      const utilityDataResult = await this.fetchUtilityData(propertyId, startDate, endDate);
      
      if (!utilityDataResult.success || !utilityDataResult.data || utilityDataResult.data.length === 0) {
        return {
          success: false,
          message: utilityDataResult.error || 'Failed to fetch utility data',
          count: 0
        };
      }
      
      // Store utility data
      const storeResult = await this.storeRawUtilityData(
        projectId,
        propertyId,
        utilityDataResult.data,
        utilityDataResult.property
      );
      
      return storeResult;
    } catch (error) {

      return {
        success: false,
        message: `Error fetching and storing utility data: ${error.message}`,
        count: 0
      };
    }
  }

  // Portfolio Manager API request method removed as it's not currently used
  // Will be implemented when direct API integration is needed
}

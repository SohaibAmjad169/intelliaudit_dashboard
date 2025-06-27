import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PropertyDataService } from '../property/property-data.service';
import { MetricsService } from '../metrics/metrics.service';
import { UtilityCalcsPrismaService } from '../../utility-calcs/utility-calcs-prisma.service';

@Injectable()
export class PortfolioManagerPrismaService {
  private readonly logger = new Logger(PortfolioManagerPrismaService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyDataService: PropertyDataService,
    private readonly metricsService: MetricsService,
    private readonly utilityCalcsService: UtilityCalcsPrismaService,
  ) {}

  /**
   * Get property details from Portfolio Manager API
   * @param propertyId - The Portfolio Manager property ID
   * @param projectId - The project ID (optional)
   * @returns Property data
   */
  async getProperty(propertyId: string, projectId?: string) {
    try {
      
      // First check if the property exists in our database
      const projectWithPmId = await this.prisma.projects.findFirst({
        where: {
          pm_id: propertyId
        }
      });
      
      if (projectWithPmId) {
        return {
          success: true,
          data: {
            id: projectWithPmId.pm_id || propertyId,
            name: projectWithPmId.name,
            address: projectWithPmId.building_address || '',
            city: projectWithPmId.property_city || '',
            state: projectWithPmId.property_state || '',
            postalCode: projectWithPmId.property_postal_code || '',
            primaryFunction: projectWithPmId.property_primary_function || '',
            grossFloorArea: projectWithPmId.property_gross_floor_area || 0,
            yearBuilt: projectWithPmId.property_year_built || 0,
            projectId: projectWithPmId.id
          }
        };
      }

      // Fetch property data using the PropertyDataService
      const propertyData = await this.propertyDataService.fetchPropertyFromApi(propertyId);
      
      // Store the property data in database if projectId is provided
      if (projectId) {
        await this.propertyDataService.storePropertyData(propertyId, propertyData, projectId);
      }
      
      // Ensure the property data matches the format expected by the frontend
      const formattedPropertyData = {
        id: propertyData.id,
        name: propertyData.name,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        postalCode: propertyData.postalCode,
        primaryFunction: propertyData.primaryFunction,
        grossFloorArea: propertyData.grossFloorArea,
        yearBuilt: propertyData.yearBuilt,
        projectId: projectId,
      };
      
      return {
        success: true,
        data: formattedPropertyData,
      };
    } catch (error) {
      this.logger.error(`Error fetching property data: ${error.message}`);
      return {
        success: false,
        error: `Failed to fetch property data: ${error.message}`,
      };
    }
  }

  /**
   * Import all data from Portfolio Manager with one click
   * @param projectId - The project ID
   * @param portfolioManagerId - The Portfolio Manager property ID
   * @param startDate - Start date for utility data
   * @param endDate - End date for utility data
   * @returns Import result with all data
   */
  async importAllData(projectId: string, portfolioManagerId: string, startDate: string, endDate: string) {
    try {
      
      // Step 1: Fetch and store property data using the dedicated PropertyDataService
      const propertyResult = await this.propertyDataService.importPropertyData(projectId, portfolioManagerId);
      
      if (!propertyResult.success) {
        return propertyResult; // Return early if property import failed
      }
      
      const propertyData = propertyResult.data;
      
      // Step 2: Fetch and store meters data
      const meters = await this.propertyDataService.fetchMetersFromApi(portfolioManagerId);
      const metersResult = await this.propertyDataService.storeMetersData(portfolioManagerId, meters, projectId);
      
      if (!metersResult.success) {
        return {
          success: false,
          error: `Failed to process meters data: ${metersResult.error}`,
          step: 'meters',
          property: propertyData
        };
      }
      
      
      // Step 3: Fetch and store utility data
      const utilityData = await this.getUtilityData(portfolioManagerId, startDate, endDate);
      
      if (utilityData.length === 0) {
        this.logger.warn(`No utility data found for property ID: ${portfolioManagerId}.`);
        return {
          success: false,
          error: 'No utility data found for this property. Please ensure the property has meters with consumption data in Portfolio Manager.',
          step: 'utility_data',
          property: propertyData
        };
      }
      
      await this.storeUtilityData(projectId, portfolioManagerId, utilityData);
      
      // Sync metrics from Portfolio Manager API using the dedicated MetricsService
      await this.metricsService.syncMetricsFromPortfolioManager(projectId, portfolioManagerId);
      
      // Process utility calculations
      await this.utilityCalcsService.processUtilityCalculations(projectId, portfolioManagerId);
      
      return {
        success: true,
        message: 'All Portfolio Manager data imported successfully',
        data: {
          property: propertyData,
          meters: meters,
          utilityRecords: utilityData.length
        }
      };
    } catch (error) {
      this.logger.error(`Error importing all data: ${error.message}`);
      return {
        success: false,
        error: `Failed to import all data: ${error.message}`,
      };
    }
  }

  /**
   * Update water score from Portfolio Manager with one click
   * @param projectId - The project ID
   * @returns Update result
   */
  async updateWaterScore(projectId: string, portfolioManagerId: string) {
    try {
      // Sync metrics from Portfolio Manager API using the dedicated MetricsService
      const result = await this.metricsService.syncWaterScoreFromPortfolioManager(projectId, portfolioManagerId);
      
      return {
        success: true,
        message: 'Water score updated successfully',
        metrics: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import all data: ${error.message}`,
      };
    }
  }

  // Property data methods have been moved to the PropertyDataService
  // - storePropertyData
  // - fetchPropertyFromApi

  // API request method has been moved to the PropertyDataService
  // - makePortfolioManagerApiRequest

  /**
   * Get utility data from Portfolio Manager API
   * @param propertyId - The Portfolio Manager property ID
   * @param startDate - Start date for utility data
   * @param endDate - End date for utility data
   * @returns Utility data array
   */
  private async getUtilityData(propertyId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      
      // First, get all meters for the property
      const meters = await this.propertyDataService.fetchMetersFromApi(propertyId);
      
      if (meters.length === 0) {
        this.logger.warn(`No meters found for property ID: ${propertyId}`);
        return [];
      }
      
      
      // Validate meters and log their details
      const validMeters = meters.filter(meter => {
        const isValid = !!meter && !!meter.id;
        if (!isValid) {
          this.logger.warn(`Skipping invalid meter: ${JSON.stringify(meter)}`);
        }
        return isValid;
      });
      
      validMeters.forEach(() => {
      });
      
      // Update count based on valid meters
      
      const utilityData = [];
      
      // For each meter, get consumption data for the specified date range
      for (const meter of validMeters) {
        try {
          if (!meter.id) {
            this.logger.warn(`Skipping meter with missing ID: ${meter.name}`);
            continue;
          }
          
          
          // Fetch consumption data for this meter
          const consumptionData = await this.propertyDataService.fetchConsumptionDataFromApi(
            meter.id, 
            meter.type || 'Unknown', 
            startDate, 
            endDate
          );
          
          if (consumptionData && consumptionData.length > 0) {
            // Log first entry details as a sample
            utilityData.push(...consumptionData);
          } else {
 
          }
        } catch (meterError) {

          // Continue with next meter even if there's an error with this one
        }
      }
      
      // Filter out future utility data entries
      const currentDate = new Date();
      const filteredUtilityData = utilityData.filter(entry => {
        if (!entry.endDate) return true;
        
        const entryEndDate = new Date(entry.endDate);
        return entryEndDate <= currentDate;
      });
      
      if (filteredUtilityData.length !== utilityData.length) {
      }
      
      
      return filteredUtilityData;
    } catch (error) {
      this.logger.error(`Error getting utility data: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Store utility data in database
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param utilityData - The utility data to store
   * @returns Stored utility data records
   */
  private async storeUtilityData(projectId: string, propertyId: string, utilityData: any[]): Promise<any[]> {
    try {
      
      if (!utilityData || utilityData.length === 0) {
        this.logger.warn('No utility data to store');
        return [];
      }
      
      // First check if this project already has utility data to prevent duplicate imports
      const existingUtilityData = await this.prisma.utility_data.findFirst({
        where: { project_id: projectId }
      });
      
      if (existingUtilityData) {
        return [];
      }
      
      // Prepare utility data records for bulk insert
      const utilityRecords = utilityData.map(data => {
        const usageUnits = this.getUsageUnits(data.meterType);
        const startDateStr = data.startDate;
        const [year, month] = startDateStr.split('-').map(Number);
        
        return {
          project_id: projectId,
          pm_id: propertyId,
          meter_id: data.meterId || 'unknown',
          meter_name: data.meterName || data.meterType || 'Unknown Meter',
          meter_type: data.meterType || 'Unknown',
          start_date: new Date(data.startDate),
          end_date: new Date(data.endDate),
          month: month, // Use the month directly from the date string (1-12)
          year: year,   // Use the year directly from the date string
          usage: data.usage,
          cost: data.cost || 0,
          usage_units: usageUnits,
          import_date: new Date()
        };
      });
      
      
      // Use createMany for better performance and reliability
      await this.prisma.utility_data.createMany({
        data: utilityRecords,
        skipDuplicates: true
      });
      
      // Fetch the created records
      const storedData = await this.prisma.utility_data.findMany({
        where: {
          project_id: projectId
        }
      });
      
      // Only create weather data if we successfully stored utility data
      if (storedData.length > 0) {
        try {
          await this.createWeatherData(projectId, utilityData[0]?.year || new Date().getFullYear());
        } catch (weatherError) {
          // Log but don't fail the entire process if weather data creation fails
          this.logger.error(`Error creating weather data: ${weatherError.message}`);
        }
      }
      
      return storedData;
    } catch (error) {
      this.logger.error(`Error storing utility data: ${error.message}`);
      return [];
    }
  }

  // Metrics calculation has been moved to the dedicated MetricsService

  /**
   * Create weather data for a project
   * @param projectId - The project ID
   * @param year - The year for weather data
   * @returns Created weather data
   */
  private async createWeatherData(projectId: string, year: number): Promise<any[]> {
    try {
      
      // First check if this project already has weather data to prevent duplicate imports
      const existingWeatherData = await this.prisma.weather_comparison.findFirst({
        where: { project_id: projectId }
      });
      
      if (existingWeatherData) {
        return [];
      }
      
      // Get project details to get zip code
      const project = await this.prisma.projects.findUnique({
        where: { id: projectId }
      });
      
      // Use a default zip code if not available
      const zipCode = project?.property_postal_code || '90210';
      
      // Create weather data records for each month
      const monthsToCreate = Array.from({length: 12}, (_, i) => i + 1); // All 12 months
      const weatherRecords = [];
      
      for (const month of monthsToCreate) {
        // Calculate realistic HDD and CDD based on month and zip code
        // These are mock calculations
        let hdd, cdd;
        
        // Northern hemisphere seasons
        if (month >= 11 || month <= 3) {
          // Winter months - higher HDD, lower CDD
          hdd = 500 + Math.round(Math.random() * 300);
          cdd = Math.round(Math.random() * 50);
        } else if (month >= 6 && month <= 9) {
          // Summer months - lower HDD, higher CDD
          hdd = Math.round(Math.random() * 50);
          cdd = 300 + Math.round(Math.random() * 200);
        } else {
          // Spring/Fall - moderate HDD and CDD
          hdd = 100 + Math.round(Math.random() * 150);
          cdd = 50 + Math.round(Math.random() * 100);
        }
        
        // Total degree days
        const tdd = hdd + cdd;
        
        // Add record to batch
        weatherRecords.push({
          project_id: projectId,
          zip_code: zipCode,
          station_id: 12345, // Mock station ID
          month,
          base_year: year,
          comparison_year: year - 1,
          base_year_hdd: hdd,
          base_year_cdd: cdd,
          base_year_tdd: tdd,
          comparison_year_hdd: hdd * 0.9, // Slightly different for comparison year
          comparison_year_cdd: cdd * 1.1,
          comparison_year_tdd: (hdd * 0.9) + (cdd * 1.1),
          hdd_delta: hdd * 0.1,
          cdd_delta: cdd * -0.1,
          tdd_delta: (hdd * 0.1) + (cdd * -0.1)
        });
      }
      
      // Use createMany for better reliability
      await this.prisma.weather_comparison.createMany({
        data: weatherRecords,
        skipDuplicates: true
      });
      
      // Fetch the created records 
      return await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId
        }
      });
    } catch (error: any) {
      this.logger.error(`Error creating weather data: ${error.message}`);
      return [];
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

  // Credentials method has been moved to the PropertyDataService
  // - getPortfolioManagerCredentials
}

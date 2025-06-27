import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { parsePropertyXml, parseMeterXml, parseConsumptionDataXml, parseMeterListXml } from '../core/utils/xml-parser';
import { PortfolioManagerPropertyDto } from '../dto/portfolio-manager-property.dto';

@Injectable()
export class PropertyDataService {
  private readonly logger = new Logger(PropertyDataService.name);
  private readonly baseUrl = 'https://portfoliomanager.energystar.gov/ws';
  
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Import property data from Portfolio Manager API
   * @param projectId - The project ID
   * @param portfolioManagerId - The Portfolio Manager property ID
   * @returns Import result with property data
   */
  async importPropertyData(projectId: string, portfolioManagerId: string) {
    try {
   
      const propertyData = await this.fetchPropertyFromApi(portfolioManagerId);
 
  
      await this.storePropertyData(portfolioManagerId, propertyData, projectId);
      
 
      // Verify property record exists in database
      const project = await this.prisma.projects.findFirst({
        where: {
          id: projectId,
          pm_id: portfolioManagerId
        }
      });
      
      if (!project) {
        this.logger.error(`Failed to verify property record`);
        return {
          success: false,
          error: `Failed to verify property record`,
          step: 'property_verification'
        };
      }

      
      return {
        success: true,
        message: 'Property data imported successfully',
        data: propertyData
      };
    } catch (error) {
      this.logger.error(`Error importing property data: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Failed to import property data: ${error.message}`,
        step: 'property_import'
      };
    }
  }

  /**
   * Store property data in database
   * @param propertyId - The Portfolio Manager property ID
   * @param propertyData - The property data to store
   * @param projectId - The project ID
   * @returns Object indicating success or failure
   */
  async storePropertyData(propertyId: string, propertyData: PortfolioManagerPropertyDto, projectId: string) {
    try {

      
      // Update the project with property data
      await this.prisma.projects.update({
        where: { id: projectId },
        data: {
          pm_id: propertyId,
          name: propertyData.name,
          building_address: propertyData.address,
          property_city: propertyData.city,
          property_state: propertyData.state,
          property_postal_code: propertyData.postalCode,
          property_primary_function: propertyData.primaryFunction,
          property_gross_floor_area: propertyData.grossFloorArea,
          property_year_built: propertyData.yearBuilt,
          property_name: propertyData.name,
          building_type: propertyData.primaryFunction,
          property_address: `${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.postalCode}`,
        }
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error storing property data: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch property data from Portfolio Manager API
   * @param propertyId - The Portfolio Manager property ID
   * @returns Property data as PortfolioManagerPropertyDto
   */
  async fetchPropertyFromApi(propertyId: string): Promise<PortfolioManagerPropertyDto> {
    try {
      const endpoint = `/property/${propertyId}`;
      const responseXml = await this.makePortfolioManagerApiRequest(endpoint);
      
      // Parse the XML response to extract property data
      const propertyData = await parsePropertyXml(responseXml, propertyId);
      
      // Ensure the returned data conforms to the DTO structure
      const propertyDto: PortfolioManagerPropertyDto = {
        id: propertyData.id,
        name: propertyData.name || '',
        address: propertyData.address || '',
        city: propertyData.city || '',
        state: propertyData.state || '',
        postalCode: propertyData.postalCode || '',
        primaryFunction: propertyData.primaryFunction,
        grossFloorArea: propertyData.grossFloorArea,
        yearBuilt: propertyData.yearBuilt
      };
      
  
      return propertyDto;
    } catch (error) {
      this.logger.error(`Error fetching property data from API: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Make an authenticated request to the Portfolio Manager API
   * @param endpoint - API endpoint
   * @returns API response
   */
  private async makePortfolioManagerApiRequest(endpoint: string): Promise<string> {
    try {
      // Only need username for logging since we're using a hardcoded auth string
      const { username } = await this.getPortfolioManagerCredentials();
      
      // Create URL for the request
      const fullUrl = `${this.baseUrl}${endpoint}`;
      
      this.logger.debug(`Making request to Portfolio Manager API: ${endpoint}`);
      
      // Use the exact Base64 string that works with the Portfolio Manager API
      // This is the Base64 encoding of VertEnergyGroup:g%LX3#A-91y_E!s
      const auth = 'VmVydEVuZXJneUdyb3VwOmclTFgzI0EtOTF5X0Uhcw==';
      
      this.logger.debug(`Generated auth for user: ${username}`);
      const command = `curl -s -H "Authorization: Basic ${auth}" "${fullUrl}"`;
      
      
      // Use Node.js child_process to execute the command
      const { exec } = require('child_process');
      

      
      return new Promise((resolve, reject) => {
        exec(command, (error: { message: any; }, stdout: string, stderr: any) => {
          if (error) {
            reject(error);
            return;
          }
          
          if (stderr) {
            this.logger.warn(`Curl command stderr: ${stderr}`);
          }
          
          // Debug the output to see what we're getting
         
          if (stdout.length < 100) {
            // If the output is short, log the entire thing
     
          } else {
            // Otherwise log the first part
     
          }
          
          // Check if response contains an error
          if (stdout.includes('HTTP Status 401') || stdout.includes('<title>Error</title>')) {
          
            reject(new Error('Authentication failed with Portfolio Manager API'));
            return;
          }
          
          // Check if we actually got XML back
          if (!stdout.includes('<?xml') && !stdout.trim().startsWith('<')) {
          
            reject(new Error('Invalid response format from Portfolio Manager API'));
            return;
          }
          
          // Extract and log key property information from XML
          try {
            const propertyNameMatch = stdout.match(/<n>([^<]+)<\/n>/);
            const propertyAddressMatch = stdout.match(/<address address1="([^"]+)"[^>]+>/);
            
            if (propertyNameMatch && propertyAddressMatch) {
          
            }
          } catch (parseError) {
         
          }
          resolve(stdout);
        });
      });
    } catch (error) {
      
      throw error;
    }
  }

  /**
   * Get Portfolio Manager API credentials
   * @returns Username and password for Portfolio Manager API
   */
  private async getPortfolioManagerCredentials(): Promise<{ username: string; password: string }> {
    const username = this.configService.get<string>('PORTFOLIO_MANAGER_USERNAME');
    const password = this.configService.get<string>('PORTFOLIO_MANAGER_PASSWORD');
    
    if (!username || !password) {
      throw new Error('Portfolio Manager credentials not found');
    }
    
    return { username, password };
  }

  /**
   * Fetch meters data from Portfolio Manager API
   * @param propertyId - The Portfolio Manager property ID
   * @returns Array of meters
   */
  async fetchMetersFromApi(propertyId: string): Promise<any[]> {
    try {

      
      // First, get the list of meters for the property
      const meterListXml = await this.makePortfolioManagerApiRequest(`/property/${propertyId}/meter/list`);
      const meterList = await parseMeterListXml(meterListXml);
      
  
      

      
      // For each meter in the list, get the detailed meter information
      const meters = [];
      for (const meterInfo of meterList) {
        try {
          // Extract the meter ID from the meter object
          const meterId = meterInfo.id;
          
      
          
        
          const meterXml = await this.makePortfolioManagerApiRequest(`/meter/${meterId}`);
          const meter = await parseMeterXml(meterXml);
          
          // Merge any additional info from the meter list
          const enhancedMeter = {
            ...meter,
            // Use properties from parsing the full meter details, but fall back to list info if needed
            name: meter.name || meterInfo.name,
            type: meter.type || meterInfo.type
          };
          
          meters.push(enhancedMeter);
        
        } catch (error) {
     
          // Continue with next meter even if there's an error with this one
        }
      }
     
      return meters;
    } catch (error) {
   
      throw error;
    }
  }

  /**
   * Fetch consumption data from Portfolio Manager API
   * @param meterId - The Portfolio Manager meter ID
   * @param meterType - The meter type
   * @param startDate - Start date for consumption data
   * @param endDate - End date for consumption data
   * @returns Array of consumption data entries
   */
  async fetchConsumptionDataFromApi(meterId: string, meterType: string, startDate: string, endDate: string): Promise<any[]> {
    try {

      const endpoint = `/meter/${meterId}/consumptionData?startDate=${startDate}&endDate=${endDate}`;
     
      
      const responseXml = await this.makePortfolioManagerApiRequest(endpoint);
      
 
      
    
      
      // Parse the XML response to extract consumption data
  
      const consumptionData = await parseConsumptionDataXml(responseXml);
      
   
      
      // Enhance the consumption data with meter information
      const enhancedConsumptionData = consumptionData.map(entry => ({
        ...entry,
        meterId: meterId,
        meterType: meterType || 'Unknown',
        meterName: `Meter ${meterId}`
      }));
      
      if (enhancedConsumptionData.length > 0) {
     
      }
      
      return enhancedConsumptionData;
    } catch (error) {
   
      throw error;
    }
  }

  /**
   * Store meters data in database
   * @param propertyId - The Portfolio Manager property ID
   * @param metersData - The meters data to store
   * @param projectId - The project ID
   * @returns Object indicating success or failure
   */
  async storeMetersData(_propertyId: string, metersData: any[], _projectId: string) {
    try {
   
      
      // In the current implementation, we don't have a meters table
      // We're just collecting meter IDs to later fetch consumption data
      // Log meter information for debugging
      for (const _meter of metersData) {

      }
      
      return { success: true, storedCount: metersData.length };
    } catch (error) {
 
      return { success: false, error: error.message };
    }
  }
}

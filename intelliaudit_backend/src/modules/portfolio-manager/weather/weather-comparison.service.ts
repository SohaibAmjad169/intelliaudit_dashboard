import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { PropertyDataService } from '../property/property-data.service';

@Injectable()
export class WeatherComparisonPrismaService {
  private readonly WEATHER_API_BASE_URL: string;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly propertyDataService: PropertyDataService,
  ) {
    this.WEATHER_API_BASE_URL = this.configService.get('WEATHER_DATA_DEPOT_API_URL') || 'https://api.weatherdatadepot.com';
  }

  async fetchWeatherData(zipCode: string, baseYear: number = 2024, comparisonYear: number = 2023) {
    try {
      const stationUrl = `https://api.weatherdatadepot.com/api/locations/GetWeatherStation?locale=${zipCode}`;
      
      let stationResponse;
      try {
        stationResponse = await this.makeWeatherApiRequest(stationUrl);
      } catch (error) {
        throw new Error(`Failed to fetch station data: ${error.message}`);
      }
      
      if (!stationResponse || !stationResponse.stationID) {
        throw new Error('Invalid station response format: missing station ID');
      }
      
      const stationId = stationResponse.stationID;
      
      if (!stationId) {
        throw new Error('Failed to retrieve valid station ID');
      }
      
      const comparisonUrl = `https://api.weatherdatadepot.com/api/charts/ReportYearComparison?station_id=${stationId}&balancePoint=65&unit=f&baseYear=${baseYear}&compYear=${comparisonYear}`;
      
      let comparisonResponse;
      try {
        comparisonResponse = await this.makeWeatherApiRequest(comparisonUrl);
      } catch (error) {
        throw new Error(`Failed to fetch comparison data: ${error.message}`);
      }
      
      if (!comparisonResponse) {
        throw new Error('Invalid comparison response: data is undefined');
      }
      
      if (!Array.isArray(comparisonResponse.data)) {
        throw new Error('Invalid comparison response: data is not an array');
      }
      
      const weatherData = [];
      
      for (const item of comparisonResponse.data) {
        if (item.month && item.month !== 'Annual') {
          const monthNum = this.getMonthNumber(item.month);
          
          weatherData.push({
            zipCode,
            stationId,
            month: monthNum,
            baseYear: parseInt(item.baseYear),
            comparisonYear: item.comparisonYear ? parseInt(item.comparisonYear) : null,
            baseYearHdd: parseFloat(item.byhdd) || 0,
            baseYearCdd: parseFloat(item.bycdd) || 0,
            baseYearTdd: parseFloat(item.bytdd) || 0,
            comparisonYearHdd: parseFloat(item.cyhdd) || 0,
            comparisonYearCdd: parseFloat(item.cycdd) || 0,
            comparisonYearTdd: parseFloat(item.cytdd) || 0,
            hddDelta: item.hddDelta ? parseFloat(item.hddDelta) : null,
            cddDelta: item.cddDelta ? parseFloat(item.cddDelta) : null,
            tddDelta: item.tddDelta ? parseFloat(item.tddDelta) : null
          });
        }
      }
      
      return {
        success: true,
        data: weatherData,
        count: weatherData.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Error fetching weather data: ${error.message}`,
        count: 0
      };
    }
  }
  
  /**
   * Convert month name to month number
   */
  private getMonthNumber(monthName: string): number {
    const months: Record<string, number> = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
      'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    
    return months[monthName] || 0;
  }

  /**
   * Store weather data in the database
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param weatherData - The weather data to store
   * @returns Result of the storage operation
   */
  async storeWeatherData(projectId: string, zipCode: string, weatherData: any[]) {
    try {
      if (!weatherData || weatherData.length === 0) {
        return {
          success: false,
          message: 'No weather data to store',
          count: 0
        };
      }
      
      // Format data for storage based on actual schema
      const formattedData = weatherData.map(data => ({
        project_id: projectId,
        zip_code: zipCode,
        station_id: data.stationId || 0,
        month: data.month,
        base_year: data.baseYear,
        comparison_year: data.comparisonYear,
        base_year_hdd: data.baseYearHdd,
        base_year_cdd: data.baseYearCdd,
        base_year_tdd: data.baseYearTdd,
        comparison_year_hdd: data.comparisonYearHdd,
        comparison_year_cdd: data.comparisonYearCdd,
        comparison_year_tdd: data.comparisonYearTdd,
        hdd_delta: data.hddDelta,
        cdd_delta: data.cddDelta,
        tdd_delta: data.tddDelta
      }));
      
      // Store in batches to avoid potential issues with large datasets
      const batchSize = 10; // Reduced batch size to prevent transaction timeouts
      let successCount = 0;
      
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        
        try {
          // Process each record individually instead of using a transaction
          // This is more reliable for large datasets
          for (const record of batch) {
            // Check if record already exists
            const existingRecord = await this.prisma.weather_comparison.findFirst({
              where: {
                project_id: record.project_id,
                zip_code: record.zip_code,
                month: record.month
              }
            });
            
            if (existingRecord) {
              // Update existing record
              await this.prisma.weather_comparison.update({
                where: { id: existingRecord.id },
                data: record
              });
            } else {
              // Create new record
              await this.prisma.weather_comparison.create({
                data: record
              });
            }
          }
          
          successCount += batch.length;
        } catch (error) {
          throw new Error(`Error storing batch: ${error.message}`);
        }
      }
      
      return {
        success: successCount > 0,
        message: `Successfully stored ${successCount} of ${formattedData.length} weather data records`,
        count: successCount
      };
    } catch (error) {
      throw new Error(`Error storing weather data: ${error.message}`);
    }
  }

  /**
   * Fetch and store weather data for a project
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param years - Array of years for which to fetch weather data
   * @returns Result of the operation
   */
  async fetchAndStoreWeatherData(projectId: string, propertyId: string, years: number[]) {
    try {
      // Get the project data to find the ZIP code
      const projectData = await this.prisma.projects.findUnique({
        where: { id: projectId }
      });
      
      if (!projectData) {
        return {
          success: false,
          message: 'Project not found',
          count: 0
        };
      }
      
      const zipCode = projectData.property_postal_code;
      
      if (!zipCode) {
        // Try to fetch property data if ZIP code is not available in the project
        try {
          const propertyResult = await this.propertyDataService.importPropertyData(projectId, propertyId);
          
          if (propertyResult.success && propertyResult.data && propertyResult.data.postalCode) {
            // Use the postal code from the property data
            const fetchedZipCode = propertyResult.data.postalCode;
            
            // Fetch and store weather data with the fetched ZIP code
            return await this.processWeatherDataForYears(projectId, fetchedZipCode, years);
          } else {
            return {
              success: false,
              message: 'Property does not have a ZIP code',
              count: 0
            };
          }
        } catch (propertyError) {
          throw new Error(`Error fetching property data: ${propertyError.message}`);
        }
      }
      
      // Process weather data for all years with the available ZIP code
      return await this.processWeatherDataForYears(projectId, zipCode, years);
    } catch (error) {
      throw new Error(`Error fetching and storing weather data: ${error.message}`);
    }
  }
  
  /**
   * Process weather data for multiple years
   * @param projectId - The project ID
   * @param zipCode - The ZIP code for the location
   * @param years - Array of years for which to fetch weather data
   * @returns Result of the operation
   */
  private async processWeatherDataForYears(projectId: string, zipCode: string, years: number[]) {
    // If we have at least two years, use the first as base year and second as comparison year
    if (years.length >= 2) {
      const baseYear = years[0];
      const comparisonYear = years[1];
      
      // Fetch both years at once using the original API approach
      const weatherResult = await this.fetchWeatherData(zipCode, baseYear, comparisonYear);
      
      if (weatherResult.success && weatherResult.data && weatherResult.data.length > 0) {
        // Store the data
        const storeResult = await this.storeWeatherData(projectId, zipCode, weatherResult.data);
        return storeResult;
      } else {
        throw new Error(`Failed to fetch weather comparison data for years ${baseYear}-${comparisonYear}`);
      }
    } 
    // If we only have one year, we can't do a comparison, but we can still fetch the data
    else if (years.length === 1) {
      const baseYear = years[0];
      // Use the previous year as comparison
      const comparisonYear = baseYear - 1;
      
      // Fetch both years
      const weatherResult = await this.fetchWeatherData(zipCode, baseYear, comparisonYear);
      
      if (weatherResult.success && weatherResult.data && weatherResult.data.length > 0) {
        // Store the data
        const storeResult = await this.storeWeatherData(projectId, zipCode, weatherResult.data);
        return storeResult;
      } else {
        throw new Error(`Failed to fetch weather data for year ${baseYear}`);
      }
    } else {
      throw new Error('No years provided for weather data fetching');
    }
  }

  /**
   * Compare weather data between two years
   * @param projectId - The project ID
   * @param zipCode - The ZIP code for the location
   * @param year1 - First year for comparison (base year)
   * @param year2 - Second year for comparison (comparison year)
   * @returns Comparison of weather data between the two years
   */
  async compareWeatherData(projectId: string, zipCode: string, year1: number, year2: number) {
    try {
      // Check if we already have comparison data in the database
      let comparisonData = await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId,
          zip_code: zipCode,
          base_year: year1,
          comparison_year: year2
        },
        orderBy: [{ month: 'asc' }]
      });
      
      // If we don't have the comparison data, fetch it
      if (!comparisonData || comparisonData.length === 0) {
        // Fetch both years at once
        const result = await this.processWeatherDataForYears(projectId, zipCode, [year1, year2]);
        
        if (!result.success) {
          return {
            success: false,
            message: `Failed to fetch weather comparison data: ${result.message}`,
            data: null
          };
        }
        
        // Check again after fetching
        comparisonData = await this.prisma.weather_comparison.findMany({
          where: {
            project_id: projectId,
            zip_code: zipCode,
            base_year: year1,
            comparison_year: year2
          },
          orderBy: [{ month: 'asc' }]
        });
        
        if (!comparisonData || comparisonData.length === 0) {
          return {
            success: false,
            message: `Still could not find comparison data for years ${year1}-${year2} after fetching`,
            data: null
          };
        }
      }
      
      // Define the type for monthly comparison items
      type MonthlyComparison = {
        month: number;
        heatingDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
        coolingDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
        totalDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
      };
      
      // Now we have the comparison data, create the comparison object
      const comparison = {
        year1,
        year2,
        monthlyComparison: [] as MonthlyComparison[],
        annualComparison: {
          heatingDegreeDays: {
            year1: 0,
            year2: 0,
            difference: 0,
            percentChange: 0
          },
          coolingDegreeDays: {
            year1: 0,
            year2: 0,
            difference: 0,
            percentChange: 0
          },
          totalDegreeDays: {
            year1: 0,
            year2: 0,
            difference: 0,
            percentChange: 0
          }
        }
      };
      
      // Create monthly comparisons
      for (let month = 1; month <= 12; month++) {
        const monthData = comparisonData.find(item => item.month === month);
        
        if (monthData) {
          const hdd1 = Number(monthData.base_year_hdd);
          const hdd2 = Number(monthData.comparison_year_hdd);
          const hddDiff = Number(monthData.hdd_delta);
          const hddPercent = hdd1 !== 0 ? (hddDiff / hdd1) * 100 : 0;
          
          const cdd1 = Number(monthData.base_year_cdd);
          const cdd2 = Number(monthData.comparison_year_cdd);
          const cddDiff = Number(monthData.cdd_delta);
          const cddPercent = cdd1 !== 0 ? (cddDiff / cdd1) * 100 : 0;
          
          const tdd1 = Number(monthData.base_year_tdd);
          const tdd2 = Number(monthData.comparison_year_tdd);
          const tddDiff = Number(monthData.tdd_delta);
          const tddPercent = tdd1 !== 0 ? (tddDiff / tdd1) * 100 : 0;
          
          comparison.monthlyComparison.push({
            month,
            heatingDegreeDays: {
              year1: hdd1,
              year2: hdd2,
              difference: hddDiff,
              percentChange: hddPercent
            },
            coolingDegreeDays: {
              year1: cdd1,
              year2: cdd2,
              difference: cddDiff,
              percentChange: cddPercent
            },
            totalDegreeDays: {
              year1: tdd1,
              year2: tdd2,
              difference: tddDiff,
              percentChange: tddPercent
            }
          });
        }
      }
      
      // Calculate annual totals
      const calculateAnnualTotal = (field: string): number => {
        return comparisonData.reduce((total: number, item: any) => total + Number(item[field] || 0), 0);
      };
      
      const hdd1 = calculateAnnualTotal('base_year_hdd');
      const hdd2 = calculateAnnualTotal('comparison_year_hdd');
      const hddDiff = calculateAnnualTotal('hdd_delta');
      const hddPercent = hdd1 !== 0 ? (hddDiff / hdd1) * 100 : 0;
      
      const cdd1 = calculateAnnualTotal('base_year_cdd');
      const cdd2 = calculateAnnualTotal('comparison_year_cdd');
      const cddDiff = calculateAnnualTotal('cdd_delta');
      const cddPercent = cdd1 !== 0 ? (cddDiff / cdd1) * 100 : 0;
      
      const tdd1 = calculateAnnualTotal('base_year_tdd');
      const tdd2 = calculateAnnualTotal('comparison_year_tdd');
      const tddDiff = calculateAnnualTotal('tdd_delta');
      const tddPercent = tdd1 !== 0 ? (tddDiff / tdd1) * 100 : 0;
      
      comparison.annualComparison = {
        heatingDegreeDays: {
          year1: hdd1,
          year2: hdd2,
          difference: hddDiff,
          percentChange: hddPercent
        },
        coolingDegreeDays: {
          year1: cdd1,
          year2: cdd2,
          difference: cddDiff,
          percentChange: cddPercent
        },
        totalDegreeDays: {
          year1: tdd1,
          year2: tdd2,
          difference: tddDiff,
          percentChange: tddPercent
        }
      };
      
      // Store the summary in a JSON field in the database for future reference
      await this.storeComparisonSummary(projectId, zipCode, year1, year2, comparison);
      
      return {
        success: true,
        message: 'Successfully compared weather data',
        data: comparison
      };
    } catch (error) {
      return {
        success: false,
        message: `Error comparing weather data: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Store a summary of the comparison data in the database
   * @param projectId - The project ID
   * @param zipCode - The ZIP code for the location
   * @param year1 - First year for comparison
   * @param year2 - Second year for comparison
   * @param comparisonData - The comparison data to store (not currently used but kept for future enhancements)
   * @returns Result of the storage operation
   */
  async storeComparisonSummary(projectId: string, zipCode: string, year1: number, year2: number, _comparisonData: any) {
    try {
      // Create a summary record in the database
      // Since our schema doesn't have a JSON field for storing the full comparison,
      // we'll store the key metrics in the appropriate fields
      
      // Find all records for the base year and update them with comparison data
      const baseYearRecords = await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId,
          zip_code: zipCode,
          base_year: year1
        }
      });
      
      // Update each record with the comparison year
      for (const record of baseYearRecords) {
        await this.prisma.weather_comparison.update({
          where: { id: record.id },
          data: {
            comparison_year: year2
          }
        });
      }
      
      return {
        success: true,
        message: 'Successfully stored weather comparison summary'
      };
    } catch (error) {
      throw new Error(`Error storing weather comparison summary: ${error.message}`);
    }
  }

  /**
   * Get weather comparison data from the database
   * @param projectId - The project ID
   * @param propertyId - The Portfolio Manager property ID
   * @param year1 - First year for comparison
   * @param year2 - Second year for comparison
   * @returns Weather comparison data
   */
  async getWeatherComparison(projectId: string, zipCode: string, year1: number, year2: number) {
    try {
      // First check if we have the comparison data
      const comparisonData = await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId,
          zip_code: zipCode,
          base_year: year1,
          comparison_year: year2
        },
        orderBy: [{ month: 'asc' }]
      });
      
      if (!comparisonData || comparisonData.length === 0) {
        // If no comparison exists, try to create one
        const comparisonResult = await this.compareWeatherData(projectId, zipCode, year1, year2);
        return comparisonResult;
      }
      
      // Reconstruct the comparison object from the database records
      const comparison = {
        year1,
        year2,
        monthlyComparison: [] as Array<{
          month: number;
          heatingDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
          coolingDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
          totalDegreeDays: { year1: number; year2: number; difference: number; percentChange: number };
        }>,
        annualComparison: {
          heatingDegreeDays: { year1: 0, year2: 0, difference: 0, percentChange: 0 },
          coolingDegreeDays: { year1: 0, year2: 0, difference: 0, percentChange: 0 },
          totalDegreeDays: { year1: 0, year2: 0, difference: 0, percentChange: 0 }
        }
      };
      
      // Calculate monthly comparisons from the database records
      let totalHdd1 = 0, totalHdd2 = 0;
      let totalCdd1 = 0, totalCdd2 = 0;
      let totalTdd1 = 0, totalTdd2 = 0;
      
      for (const record of comparisonData) {
        const hdd1 = Number(record.base_year_hdd);
        const hdd2 = Number(record.comparison_year_hdd);
        const hddDiff = Number(record.hdd_delta || (hdd2 - hdd1));
        const hddPercent = hdd1 !== 0 ? (hddDiff / hdd1) * 100 : 0;
        
        const cdd1 = Number(record.base_year_cdd);
        const cdd2 = Number(record.comparison_year_cdd);
        const cddDiff = Number(record.cdd_delta || (cdd2 - cdd1));
        const cddPercent = cdd1 !== 0 ? (cddDiff / cdd1) * 100 : 0;
        
        const tdd1 = Number(record.base_year_tdd);
        const tdd2 = Number(record.comparison_year_tdd);
        const tddDiff = Number(record.tdd_delta || (tdd2 - tdd1));
        const tddPercent = tdd1 !== 0 ? (tddDiff / tdd1) * 100 : 0;
        
        // Add to monthly comparison
        comparison.monthlyComparison.push({
          month: record.month,
          heatingDegreeDays: {
            year1: hdd1,
            year2: hdd2,
            difference: hddDiff,
            percentChange: hddPercent
          },
          coolingDegreeDays: {
            year1: cdd1,
            year2: cdd2,
            difference: cddDiff,
            percentChange: cddPercent
          },
          totalDegreeDays: {
            year1: tdd1,
            year2: tdd2,
            difference: tddDiff,
            percentChange: tddPercent
          }
        });
        
        // Add to annual totals
        totalHdd1 += hdd1;
        totalHdd2 += hdd2;
        totalCdd1 += cdd1;
        totalCdd2 += cdd2;
        totalTdd1 += tdd1;
        totalTdd2 += tdd2;
      }
      
      // Calculate annual comparison
      const hddDiff = totalHdd2 - totalHdd1;
      const hddPercent = totalHdd1 !== 0 ? (hddDiff / totalHdd1) * 100 : 0;
      
      const cddDiff = totalCdd2 - totalCdd1;
      const cddPercent = totalCdd1 !== 0 ? (cddDiff / totalCdd1) * 100 : 0;
      
      const tddDiff = totalTdd2 - totalTdd1;
      const tddPercent = totalTdd1 !== 0 ? (tddDiff / totalTdd1) * 100 : 0;
      
      comparison.annualComparison = {
        heatingDegreeDays: {
          year1: totalHdd1,
          year2: totalHdd2,
          difference: hddDiff,
          percentChange: hddPercent
        },
        coolingDegreeDays: {
          year1: totalCdd1,
          year2: totalCdd2,
          difference: cddDiff,
          percentChange: cddPercent
        },
        totalDegreeDays: {
          year1: totalTdd1,
          year2: totalTdd2,
          difference: tddDiff,
          percentChange: tddPercent
        }
      };
      
      return {
        success: true,
        message: 'Successfully retrieved weather comparison',
        data: comparison
      };
    } catch (error) {
      return {
        success: false,
        message: `Error getting weather comparison: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Make a request to the Weather Data Depot API
   * @param endpoint - The API endpoint
   * @returns Response data
   */
  private async makeWeatherApiRequest(endpoint: string) {
    try {
      const url = `${this.WEATHER_API_BASE_URL}${endpoint}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        })
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

interface WeatherStationResponse {
  id: number;
  city: string;
  state: string;
  stationname: string;
  code: string;
  postal: string;
  latitude: string;
  longitude: string;
  climostation: string;
  citystate: string;
  stationID: number;
  minDate: string;
}

interface WeatherComparisonResponse {
  data: Array<{
    showthis: string;
    byhdd: string;
    bycdd: string;
    bytdd: string;
    cyhdd: string;
    cycdd: string;
    cytdd: string;
    hddDelta: string | null;
    cddDelta: string | null;
    tddDelta: string | null;
    month: string;
    baseYear: string;
    comparisonYear: string | null;
  }> | {
    // Alternative format that might be returned
    [key: string]: any;
  };
}

interface WeatherComparisonData {
  project_id: string;
  zip_code: string;
  station_id: number;
  month: number;
  base_year: number;
  comparison_year: number | null;
  base_year_hdd: number;
  base_year_cdd: number;
  base_year_tdd: number;
  comparison_year_hdd: number;
  comparison_year_cdd: number;
  comparison_year_tdd: number;
  hdd_delta: number | null;
  cdd_delta: number | null;
  tdd_delta: number | null;
}

@Injectable()
export class WeatherPrismaService {
  private readonly logger = new Logger(WeatherPrismaService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async getWeatherComparison(projectId: string, zipCode: string) {
    try {
     
      
      // First request to get station ID
      const stationUrl = `https://api.weatherdatadepot.com/api/locations/GetWeatherStation?locale=${zipCode}`;
      
      const stationResponse: AxiosResponse<WeatherStationResponse> = await firstValueFrom(
        this.httpService.get(stationUrl, {
          headers: {
            accept: 'application/json, text/plain, */*',
          },
        }),
      );

      // Log the full station response for debugging
   

      // Validate and extract station ID
      if (!stationResponse.data || !stationResponse.data.stationID) {
        this.logger.error('Invalid station response format:', stationResponse.data);
        throw new Error('Invalid station response format: missing station ID');
      }

      const stationId = stationResponse.data.stationID;

      if (!stationId) {
        this.logger.error('Station ID is undefined or empty');
        throw new Error('Failed to retrieve valid station ID');
      }

      // Second request using the stationId
      const comparisonUrl = `https://api.weatherdatadepot.com/api/charts/ReportYearComparison?station_id=${stationId}&balancePoint=65&unit=f&baseYear=2024&compYear=2023`;
      
      const comparisonResponse: AxiosResponse<WeatherComparisonResponse> = await firstValueFrom(
        this.httpService.get(comparisonUrl, {
          headers: {
            accept: 'application/json, text/plain, */*',
          },
        }),
      );

      // Log the full comparison response for debugging
    
      // Validate the comparison response - handle both potential formats
      // Format 1: Array directly
      // Format 2: Object with data property containing array
      let weatherData;
      
      if (Array.isArray(comparisonResponse.data)) {
        // The API returned an array directly
        weatherData = comparisonResponse.data;
      } else if (comparisonResponse.data && Array.isArray(comparisonResponse.data.data)) {
        // The API returned an object with a data property containing an array
        weatherData = comparisonResponse.data.data;
      } else {
        this.logger.error('Invalid comparison response format');
        throw new Error('Invalid comparison response format');
      }

      // Delete existing records
      try {
        await this.prisma.weather_comparison.deleteMany({
          where: {
            project_id: projectId,
            zip_code: zipCode
          }
        });
      } catch (error) {
        throw new Error(`Failed to delete existing weather records: ${error.message}`);
      }

      // Prepare data for database insertion
      const weatherComparisons: WeatherComparisonData[] = weatherData.map(item => {
        // If the item has a month property that is a number string (1-12), use that directly
        // Otherwise, use the month name mapping
        let month: number;
        
        if (item.month && !isNaN(parseInt(item.month, 10)) && parseInt(item.month, 10) >= 1 && parseInt(item.month, 10) <= 14) {
          month = parseInt(item.month, 10);
          // Use 14 for annual summary if month is 13
          if (month === 13) month = 14;
        } else {
          // Parse month from string (e.g., "Jan" -> 1)
          const monthMap: { [key: string]: number } = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
            'Annual': 14 // Use 14 for annual summary
          };
          month = monthMap[item.month] || 0;
        }
        
        // Parse years - ensure they are valid numbers
        let baseYear = parseInt(item.baseYear, 10);
        // If baseYear is NaN (for month 14/Annual), use current year as fallback
        if (isNaN(baseYear)) {
          baseYear = new Date().getFullYear();
        }
        
        let comparisonYear = item.comparisonYear ? parseInt(item.comparisonYear, 10) : null;
        // If comparisonYear is NaN but not null, use baseYear - 1 as fallback
        if (comparisonYear !== null && isNaN(comparisonYear)) {
          comparisonYear = baseYear - 1;
        }
        
        // Parse numeric values, handling empty strings
        const parseNumeric = (value: string | null): number => {
          if (!value || value === '') return 0;
          return parseFloat(value);
        };
        
        // Calculate deltas if both values are available
        const calculateDelta = (base: number, comparison: number): number | null => {
          if (base === 0 || comparison === 0) return null;
          return base - comparison;
        };
        
        // Parse HDD, CDD, TDD values
        const baseHdd = parseNumeric(item.byhdd);
        const baseCdd = parseNumeric(item.bycdd);
        const baseTdd = parseNumeric(item.bytdd);
        const compHdd = parseNumeric(item.cyhdd);
        const compCdd = parseNumeric(item.cycdd);
        const compTdd = parseNumeric(item.cytdd);
        
        // Calculate deltas
        const hddDelta = item.hddDelta ? parseNumeric(item.hddDelta) : calculateDelta(baseHdd, compHdd);
        const cddDelta = item.cddDelta ? parseNumeric(item.cddDelta) : calculateDelta(baseCdd, compCdd);
        const tddDelta = item.tddDelta ? parseNumeric(item.tddDelta) : calculateDelta(baseTdd, compTdd);
        
        return {
          project_id: projectId,
          zip_code: zipCode,
          station_id: stationId,
          month,
          base_year: baseYear,
          comparison_year: comparisonYear,
          base_year_hdd: baseHdd,
          base_year_cdd: baseCdd,
          base_year_tdd: baseTdd,
          comparison_year_hdd: compHdd,
          comparison_year_cdd: compCdd,
          comparison_year_tdd: compTdd,
          hdd_delta: hddDelta,
          cdd_delta: cddDelta,
          tdd_delta: tddDelta
        };
      });

      // Create new records
      try {
        await this.prisma.weather_comparison.createMany({
          data: weatherComparisons,
          skipDuplicates: true
        });
        return {
          success: true,
          message: 'Successfully stored weather data',
          count: weatherComparisons.length
        };
      } catch (error) {
        throw new Error(`Failed to store weather data: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorDetails = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        };
        
        this.logger.error(
          `Weather API Error: ${error.message}`,
          JSON.stringify(errorDetails, null, 2),
          'WeatherPrismaService.getWeatherComparison',
        );
        
        throw new Error(
          `Weather API Error (${error.response?.status}): ${error.response?.statusText || error.message}. ` +
          `URL: ${error.config?.url}`
        );
      }
      
      this.logger.error(
        `Unexpected error in weather service: ${error.message}`,
        'WeatherPrismaService.getWeatherComparison',
      );
      
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  async getWeatherByProject(projectId: string) {
    try {
      
      // Fetch weather data using Prisma
      const weatherData = await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId
        },
        orderBy: {
          month: 'asc'
        }
      });

   

      if (!weatherData || weatherData.length === 0) {
        this.logger.warn(`No weather data found for project ${projectId}`);
        return [];
      }

      
      // Group data by zip code
      interface WeatherByZipData {
        zip_code: string;
        station_id: number;
        monthly_data: any[];
        summary: any;
      }
      
      const weatherByZip = weatherData.reduce<{ [zipCode: string]: WeatherByZipData }>((acc, curr) => {
        const zipCode = curr.zip_code;
        if (!acc[zipCode]) {
          acc[zipCode] = {
            zip_code: zipCode,
            station_id: curr.station_id,
            monthly_data: [],
            summary: null
          };
        }

        if (curr.month === 14) {
          acc[zipCode].summary = curr;
        } else {
          acc[zipCode].monthly_data.push(curr);
        }

        return acc;
      }, {});

      const result = Object.values(weatherByZip);
   
      
      return result;
    } catch (error) {
     
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }
}

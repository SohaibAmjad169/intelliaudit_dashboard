import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { PortfolioManagerMetricsInput } from '../core/portfolio-manager-metrics.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Sync metrics from Portfolio Manager API and save to database
   * @param projectId - The project ID
   * @param portfolioManagerPropertyId - The Portfolio Manager property ID
   * @returns Synced metrics
   */
  async syncMetricsFromPortfolioManager(projectId: string, portfolioManagerPropertyId: string): Promise<any> {

    // Always use January 2025, regardless of any input parameters
    const fixedYear = 2025;
    const fixedMonth = 1;

    try {
      // Make sure portfolioManagerPropertyId is a valid number
      const propertyId = parseInt(portfolioManagerPropertyId, 10);
      if (isNaN(propertyId)) {
        this.logger.error(`Invalid Portfolio Manager property ID: ${portfolioManagerPropertyId}`);
        throw new Error(`Invalid Portfolio Manager property ID: ${portfolioManagerPropertyId}`);
      }

      // Get Portfolio Manager API credentials
      const username = this.configService.get<string>('PORTFOLIO_MANAGER_USERNAME');
      const password = this.configService.get<string>('PORTFOLIO_MANAGER_PASSWORD');

      if (!username || !password) {
        throw new Error('Portfolio Manager credentials not found');
      }

      // Make request to Portfolio Manager API
      const response = await fetch(
        `https://portfoliomanager.energystar.gov/ws/property/${propertyId}/metrics?year=${fixedYear}&month=${fixedMonth}&measurementSystem=EPA`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic VmVydEVuZXJneUdyb3VwOmclTFgzI0EtOTF5X0Uhcw==`,
            'Content-Type': 'application/json',
            'PM-Metrics': 'score, siteTotal, sourceTotal, siteIntensity, sourceIntensity, directGHGEmissions, waterScore'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Portfolio Manager API request failed: Status ${response.status} - ${response.statusText}`);
        this.logger.error(`Error details: ${errorText}`);
        throw new Error(`Portfolio Manager API request failed: Status ${response.status} - ${response.statusText}`);
      }

      // The response is XML, so we need to parse it
      const responseText = await response.text();

      // Extract metrics from XML response
      const energy_star_score = this.extractValueFromXml(responseText, 'score');
      const site_total_energy = this.extractValueFromXml(responseText, 'siteTotal');
      const source_total_energy = this.extractValueFromXml(responseText, 'sourceTotal');
      const site_intensity = this.extractValueFromXml(responseText, 'siteIntensity');
      const source_intensity = this.extractValueFromXml(responseText, 'sourceIntensity');
      const direct_ghg_emissions = this.extractValueFromXml(responseText, 'directGHGEmissions');
      const water_score = this.extractValueFromXml(responseText, 'waterScore');

      // Create metrics input object
      const metricsInput: PortfolioManagerMetricsInput = {
        project_id: projectId,
        year: fixedYear,
        month: fixedMonth,
        energy_star_score: energy_star_score ? parseInt(energy_star_score, 10) : undefined,
        site_total_energy: site_total_energy ? parseFloat(site_total_energy) : undefined,
        source_total_energy: source_total_energy ? parseFloat(source_total_energy) : undefined,
        site_intensity: site_intensity ? parseFloat(site_intensity) : undefined,
        source_intensity: source_intensity ? parseFloat(source_intensity) : undefined,
        direct_ghg_emissions: direct_ghg_emissions ? parseFloat(direct_ghg_emissions) : undefined,
        water_score: water_score ? parseFloat(water_score) : undefined
      };

      // Update the project with the metrics
      await this.prisma.projects.update({
        where: { id: projectId },
        data: {
          energy_star_score: metricsInput.energy_star_score || null,
          site_total_energy: metricsInput.site_total_energy || null,
          source_total_energy: metricsInput.source_total_energy || null,
          site_intensity: metricsInput.site_intensity || null,
          source_intensity: metricsInput.source_intensity || null,
          direct_ghg_emissions: metricsInput.direct_ghg_emissions || null,
          water_score: metricsInput.water_score || null,
          energy_metrics_last_updated: new Date(),
          energy_metrics_year: fixedYear,
          energy_metrics_month: fixedMonth,
          energy_metrics_source: 'portfolio-manager-api'
        }
      });

      return metricsInput;
    } catch (error) {
      this.logger.error(`Error syncing metrics from Portfolio Manager: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync metrics from Portfolio Manager API and save to database
   * @param projectId - The project ID
   * @param portfolioManagerPropertyId - The Portfolio Manager property ID
   * @returns Synced metrics
   */
  async syncWaterScoreFromPortfolioManager(projectId: string, portfolioManagerPropertyId: string): Promise<any> {

    // Always use January 2025, regardless of any input parameters
    let fixedYear = 2025;
    let fixedMonth = 1;

    fixedMonth = new Date().getMonth();
    if (fixedMonth === 0) {
      fixedYear = fixedYear - 1;
      fixedMonth = 12;
    }

    try {
      // Make sure portfolioManagerPropertyId is a valid number
      const propertyId = parseInt(portfolioManagerPropertyId, 10);
      if (isNaN(propertyId)) {
        this.logger.error(`Invalid Portfolio Manager property ID: ${portfolioManagerPropertyId}`);
        throw new Error(`Invalid Portfolio Manager property ID: ${portfolioManagerPropertyId}`);
      }

      // Get Portfolio Manager API credentials
      const username = this.configService.get<string>('PORTFOLIO_MANAGER_USERNAME');
      const password = this.configService.get<string>('PORTFOLIO_MANAGER_PASSWORD');

      if (!username || !password) {
        throw new Error('Portfolio Manager credentials not found');
      }

      // Make request to Portfolio Manager API
      const response = await fetch(
        `https://portfoliomanager.energystar.gov/ws/property/${propertyId}/metrics?year=${fixedYear}&month=${fixedMonth}&measurementSystem=EPA`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic VmVydEVuZXJneUdyb3VwOmclTFgzI0EtOTF5X0Uhcw==`,
            'Content-Type': 'application/json',
            'PM-Metrics': 'waterScore'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Portfolio Manager API request failed: Status ${response.status} - ${response.statusText}`);
      }

      // The response is XML, so we need to parse it
      const responseText = await response.text();

      // Extract metrics from XML response
      const water_score = this.extractValueFromXml(responseText, 'waterScore');

      // Create metrics input object
      const metricsInput: PortfolioManagerMetricsInput = {
        project_id: projectId,
        year: fixedYear,
        month: fixedMonth,
        water_score: water_score ? parseFloat(water_score) : undefined
      };

      // Update the project with the metrics
      await this.prisma.projects.update({
        where: { id: projectId },
        data: {
          water_score: metricsInput.water_score || null,
        }
      });

      return metricsInput;
    } catch (error) {
      this.logger.error(`Error syncing metrics from Portfolio Manager: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper method to extract values from XML response
   * @param xml - The XML response
   * @param metricName - The metric name to extract (e.g., 'score', 'siteTotal')
   * @returns The extracted value or null
   */
  private extractValueFromXml(xml: string, metricName: string): string | null {
    try {
      // The Portfolio Manager API returns metrics in this format:
      // <metric name="score" dataType="numeric"><value>73</value></metric>
      const regex = new RegExp(`<metric name="${metricName}"[^>]*><value>(.*?)</value></metric>`, 'i');
      const match = xml.match(regex);

      if (match && match[1]) {
        return match[1];
      }

      this.logger.warn(`Could not extract ${metricName} from XML response`);
      return null;
    } catch (error) {
      this.logger.error(`Error extracting ${metricName} from XML: ${error.message}`);
      return null;
    }
  }
}
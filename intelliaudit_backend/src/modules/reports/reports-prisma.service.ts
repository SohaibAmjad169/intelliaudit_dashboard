import { Injectable, Logger, Inject } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ProjectService } from '../projects/project.service';
// EnergyAuditPrismaService removed as part of code cleanup
import { UtilityCalcsPrismaService } from '../utility-calcs/utility-calcs-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
// Removed import for V2EquipmentService as it doesn't exist in the Prisma schema
import { TableOfContentsComponent } from './components/table-of-contents.component';
import { CoverPageComponent } from './components/cover-page.component';
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { EnergyAuditComponent } from './components/energy-audit.component';
import { WaterAuditComponent } from './components/water-audit.component';
import { RetroCommissioningComponent } from './components/retro-commissioning.component';
import { FULL_REPORT_STRUCTURE } from './utils/report-structure';
import { StorageService } from '../../storage/storage.service';
import * as path from 'path';
import { MeasuresPrismaService } from '../equipment/measures/measures-prisma.service';
import { AppendicesReportComponent } from './components/appendices-report.component';
import * as fs from 'fs';
import { ReportDataDto, EnergyAuditDataDto, WaterAuditDataDto, RetroCommissioningDataDto } from './dto/report-data.dto'; // Import DTOs

interface Measure {
  id: string;
  title: string;
  existingCondition: string;
  recommendation: string;
  benefits: string[];
  estimatedSavings: {
    energy?: number;
    water?: number;
    cost?: number;
    paybackPeriod?: number;
  };
  implementationCost?: number | any; // Accept both number and Prisma Decimal
  incentives?: number | any; // Accept both number and Prisma Decimal
}

interface Measures {
  eems?: Measure[];
  wems?: Measure[];
  rcms?: Measure[];
}

@Injectable()
export class ReportsPrismaService {
  private readonly logger = new Logger(ReportsPrismaService.name);

  constructor(
    private readonly projectService: ProjectService,
    // EnergyAuditPrismaService removed as part of code cleanup
    // Renamed from _utilityCalcsService since we'll use it
    private readonly utilityCalcsService: UtilityCalcsPrismaService,
    private readonly prisma: PrismaService,
    // Removed v2EquipmentService as it doesn't exist in the Prisma schema
    private readonly tableOfContentsComponent: TableOfContentsComponent,
    private readonly coverPageComponent: CoverPageComponent,
    private readonly executiveSummaryComponent: ExecutiveSummaryComponent,
    private readonly energyAuditComponent: EnergyAuditComponent,
    private readonly waterAuditComponent: WaterAuditComponent,
    private readonly retroCommissioningComponent: RetroCommissioningComponent,
    private readonly storageService: StorageService,
    @Inject('AXIOS') private readonly axios: any, // Inject axios for HTTP requests
    private readonly measuresService: MeasuresPrismaService,
    private readonly appendicesReportComponent: AppendicesReportComponent
  ) { }

  async generateProjectReportPdf(projectId: string): Promise<Buffer> {

    // Return a promise that encapsulates the entire PDF generation process
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];

      // Handle stream events
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('error', (err) => {
        this.logger.error(`PDF generation stream error: ${err.message}`, err.stack);
        reject(err); // Reject the main promise on stream error
      });
      // 'end' event signifies content generation is done, but we add headers/footers after

      try {
        // --- Get Data ---
        const project = await this.projectService.getProjectById(projectId);
        const reportData: ReportDataDto = await this.getReportData(projectId);
        const measures = await this.measuresService.getMeasuresFromDatabase(projectId) as Measures;
        console.log("projectId", projectId);
        console.log("reportData", reportData);
        console.log("measures", measures); ``
        console.log("project", project);

        // --- Render Main Content ---
        await this.coverPageComponent.render(doc, project);
        await this.tableOfContentsComponent.render(doc, FULL_REPORT_STRUCTURE);
        await this.executiveSummaryComponent.render(doc, { project, ...reportData });
        await this.energyAuditComponent.render(doc, {
          endUseBreakdown: reportData.energyAudit.summary?.endUseBreakdown,
          totalUsage: reportData.energyAudit.totalUsage,
          monthlyData: reportData.energyAudit.monthlyData,
          measures: measures.eems,
          existingConditions: reportData.energyAudit.summary?.existingConditions
        });
        // if (reportData.waterAudit) {
        await this.waterAuditComponent.render(doc, reportData.waterAudit);
        // }
        // if (reportData.retroCommissioning) {
        await this.retroCommissioningComponent.render(doc, reportData.retroCommissioning);
        // }
        await this.appendicesReportComponent.render(doc, reportData.monthlyData);

        // --- Finalize and Add Headers/Footers ---
        doc.end(); // Signal end of content addition

        // Wait for the stream to finish processing the main content
        // This ensures bufferedPageRange is accurate after .end()
        await new Promise<void>(resolveEnd => doc.on('end', resolveEnd));

        const range = doc.bufferedPageRange();
        const totalPages = range.count;

        const logoPath = path.join(__dirname, '..', '..', 'assets', 'logo.png');
        const logoExists = fs.existsSync(logoPath);

        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          if (logoExists) {
            doc.image(logoPath, doc.page.margins.left, 36, { width: 120 });
          }
          doc.fontSize(10)
            .font('Helvetica').fillColor('#000000')
            .text(`Page ${i + 1} of ${totalPages}`,
              doc.page.margins.left,
              doc.page.height - doc.page.margins.bottom + 10,
              { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
            );
        }

        // Resolve the main promise with the final buffer
        resolve(Buffer.concat(chunks));

      } catch (error) {
        this.logger.error(`Error during PDF report generation process: ${error.message}`, error.stack);
        reject(error); // Reject the main promise on error
      }
    }); // End of main Promise constructor
  }

  /**
   * Get all data needed for report generation
   * @param projectId The ID of the project
   * @returns Complete report data for the specified project
   */
  async getReportData(projectId: string): Promise<ReportDataDto> {

    // Get project data
    const project = await this.projectService.getProjectById(projectId);
    if (!project) {
      this.logger.error(`Project not found when getting report data: ${projectId}`);
      throw new Error(`Project not found: ${projectId}`);
    }

    const propertyId = project.pm_id;
    if (!propertyId) {
      this.logger.warn(`Project ${projectId} has no Portfolio Manager ID. Energy data might be limited.`);
      // Decide if we should throw or continue with potentially missing data
      // throw new Error(`Project ${projectId} has no Portfolio Manager ID`);
    }

    // --- Fetch Energy Data ---
    let energySummary: any = null;
    let utilityDataTable: any = null;
    let fetchedTotalCost: any = null; // Store potentially complex cost object
    let totalUtilityUsage: any = null;
    let monthlyData: any = null;

    try {
      // EnergyAuditService has been removed as part of code cleanup
      // Set default empty values for energySummary and utilityDataTable
      energySummary = null;
      utilityDataTable = null;
      fetchedTotalCost = await this.utilityCalcsService.getTotalUtilityCost(projectId);
      totalUtilityUsage = await this.utilityCalcsService.getTotalUtilityUsage(projectId);
      monthlyData = await this.utilityCalcsService.getMonthlyDataByType(projectId, 'Electric'); // Example, might need more types
    } catch (err) {
      this.logger.error(`Error fetching energy data for report (projectId: ${projectId}): ${err.message}`, err.stack);
      // Decide how to handle partial data failure - perhaps return defaults or nulls?
    }

    // Extract the single number cost for the DTO
    // TODO: Verify the actual structure of fetchedTotalCost and extract correctly
    const totalCostNumber = typeof fetchedTotalCost?.total === 'number' ? fetchedTotalCost.total : null;

    const energyAuditData: EnergyAuditDataDto = {
      summary: energySummary, // Assign fetched data or null
      utilityData: utilityDataTable,
      totalCost: totalCostNumber, // Use the extracted number or null
      totalUsage: totalUtilityUsage,
      monthlyData: monthlyData,
    };

    // --- Fetch Water and RCx Data --- (Keep existing logic, maybe wrap in try/catch)
    const projectData = project as any;
    const buildingInfo = projectData.building_info || {};
    let waterAuditData: WaterAuditDataDto | null = buildingInfo.waterAudit || null;
    let retroCommissioningData: RetroCommissioningDataDto | null = buildingInfo.retroCommissioning || null;

    // TODO: Map fetched water/rcx data to their respective DTOs if they exist
    // Example (assuming structure matches DTO):
    // waterAuditData = buildingInfo.waterAudit ? { ...buildingInfo.waterAudit } : null;
    // retroCommissioningData = buildingInfo.retroCommissioning ? { ...buildingInfo.retroCommissioning } : null;

    // Get measures data
    const measures = await this.measuresService.getMeasuresFromDatabase(projectId) as Measures;

    // Calculate potential savings (20% of total cost as an estimate)
    const potentialSavings = totalCostNumber ? totalCostNumber * 0.2 : 0;

    // Get energy summary data
    const energySummaryData = await this.getEnergySummaryData(projectId);

    // Calculate totals for financial analysis
    const energySavings = measures.eems?.reduce((sum, measure) => sum + (measure.estimatedSavings?.cost || 0), 0) || 0;
    const energyImplementationCost = measures.eems?.reduce((sum, measure) => {
      // Calculate implementation cost from cost savings and payback period if not provided
      let cost = 0;
      if (measure.implementationCost) {
        cost = measure.implementationCost;
      } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
        cost = measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
      }
      return sum + cost;
    }, 0) || 0;
    const energyPayback = energySavings > 0 ? energyImplementationCost / energySavings : 0;

    const waterSavings = measures.wems?.reduce((sum, measure) => sum + (measure.estimatedSavings?.cost || 0), 0) || 0;
    const waterImplementationCost = measures.wems?.reduce((sum, measure) => {
      // Calculate implementation cost from cost savings and payback period if not provided
      let cost = 0;
      if (measure.implementationCost) {
        cost = measure.implementationCost;
      } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
        cost = measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
      }
      return sum + cost;
    }, 0) || 0;
    const waterPayback = waterSavings > 0 ? waterImplementationCost / waterSavings : 0;

    const rcxSavings = measures.rcms?.reduce((sum, measure) => sum + (measure.estimatedSavings?.cost || 0), 0) || 0;
    const rcxImplementationCost = measures.rcms?.reduce((sum, measure) => {
      // Calculate implementation cost from cost savings and payback period if not provided
      let cost = 0;
      if (measure.implementationCost) {
        cost = measure.implementationCost;
      } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
        cost = measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
      }
      return sum + cost;
    }, 0) || 0;
    const rcxPayback = rcxSavings > 0 ? rcxImplementationCost / rcxSavings : 0;

    const totalSavings = energySavings + waterSavings + rcxSavings;
    const totalImplementationCost = energyImplementationCost + waterImplementationCost + rcxImplementationCost;
    const totalPayback = totalSavings > 0 ? totalImplementationCost / totalSavings : 0;

    // Get the logo URL
    const logoUrl = 'https://ueatpdrgktpdcrrgeshi.supabase.co/storage/v1/object/public/assets/vert_logo/Vert-Energy-Group-Logo-Official-compress.png';

    // Get the report date
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Construct the main report data DTO
    const reportData: ReportDataDto = {
      project,
      energyAudit: energyAuditData,
      waterAudit: waterAuditData,
      retroCommissioning: retroCommissioningData,
      measures: measures.eems || [],
      waterMeasures: measures.wems || [],
      recommendations: measures.rcms || [],
      potentialSavings,
      energySummary: energySummaryData,
      totalCost: { totalCost: totalCostNumber || 0 },
      totalUsage: totalUtilityUsage || { totalEnergyUsage: 0, waterUsage: 0 },
      monthlyData: monthlyData || { electric: [], naturalGas: [], water: [] },
      energySavings,
      energyImplementationCost,
      energyPayback,
      waterSavings,
      waterImplementationCost,
      waterPayback,
      rcxSavings,
      rcxImplementationCost,
      rcxPayback,
      totalSavings,
      totalImplementationCost,
      totalPayback,
      logoUrl,
      reportDate
    };

    return reportData;
  }

  // Adds the table of contents to the report
  // @param doc PDFKit document
  // Note: This method is currently unused but kept for future reference
  // Marked with underscore to indicate it's unused
  // @ts-ignore - This method is kept for future use
  private _addTableOfContents(doc: typeof PDFDocument): void {
    doc.fontSize(16).font('Helvetica-Bold').text('Table of Contents', { align: 'center' });
    doc.moveDown(2);
  }

  // Fetches a Google Street View image for a project and stores it
  // @param projectId The ID of the project to fetch a Street View image for
  // @returns Object with success status and image URL
  async fetchAndStoreStreetViewImage(projectId: string): Promise<any> {
    try {
      // Get the project to get the address
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Get the address
      const streetAddress = project?.building_address || project?.property_address || '';
      if (!streetAddress) {
        throw new Error('No address found for the project');
      }

      // Encode the address
      const encodedAddress = encodeURIComponent(streetAddress);

      // Get Google API key
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error('Google API key not configured');
      }

      // Construct the Street View URL
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${encodedAddress}&key=${apiKey}`;

      // Fetch the image
      const response = await this.axios.get(streetViewUrl, { responseType: 'arraybuffer' });

      // Check if we got a valid image
      if (response.status === 200 && response.data && response.data.length > 1000) {
        // Store the image using StorageService
        const fileName = `street-view-${projectId}.jpg`;
        const filePath = await this.storageService.storeFile(
          'building-images',
          fileName,
          Buffer.from(response.data),
          'image/jpeg'
        );


        // Update the project with the street view image URL
        const publicUrl = `/api/storage/building-images/${fileName}`;
        // Use a type assertion to allow custom properties
        await this.projectService.updateProject(projectId, {
          // Cast to any to avoid TypeScript error with custom property
          street_view_image: publicUrl
        } as any);

        return {
          success: true,
          message: 'Street View image fetched and stored successfully',
          imageUrl: publicUrl,
          imagePath: filePath
        };
      } else {
        throw new Error('Received invalid or empty image from Google Street View API');
      }
    } catch (error) {
      this.logger.error(`Error fetching Street View image: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch Street View image: ${error.message}`);
    }
  }

  // Helper method to fetch and load image from URL
  // Marked with underscore to indicate it's unused
  // @ts-ignore - This method is kept for future use
  private async _fetchLogoImage(url: string): Promise<Buffer> {

    try {
      const axios = await import('axios');

      // Log request initiation

      const response = await axios.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout for more reliability
        headers: {
          'Accept': 'image/png,image/jpeg,image/jpg,image/*'
        }
      });

      // Log response information

      if (response.status !== 200) {
        throw new Error(`Failed to fetch logo: HTTP status ${response.status}`);
      }

      if (!response.data || response.data.length === 0) {
        throw new Error('Received empty response when fetching logo');
      }

      const buffer = Buffer.from(response.data);

      return buffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error fetching logo from ${url}: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  }

  // Helper method to reset the page layout to full width
  // Marked with underscore to indicate it's unused
  // @ts-ignore - This method is kept for future use
  private _resetPageLayout(doc: typeof PDFDocument) {
    doc.x = doc.page.margins.left;
    doc.y = Math.max(doc.y, doc.page.margins.top); // Keep current y if it's greater than the top margin
    return doc.page.width - doc.page.margins.left - doc.page.margins.right; // Return the full content width
  }

  /**
   * Get energy summary data for a project
   * @param projectId The ID of the project
   * @returns Energy summary data for the specified project
   */
  async getEnergySummaryData(projectId: string): Promise<any> {

    try {
      // Get project data
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const reportYear = 2024; // Fixed to 2024 to match report generation

      // Get monthly electricity data for 2024
      const electricData = await this.prisma.utility_calcs.findMany({
        where: {
          project_id: projectId,
          meter_type: 'Electric',
          year: reportYear
        },
        orderBy: [
          { month: 'asc' }
        ]
      });

      // Get monthly natural gas data for 2024
      const gasData = await this.prisma.utility_calcs.findMany({
        where: {
          project_id: projectId,
          meter_type: 'Natural Gas',
          year: reportYear
        },
        orderBy: [
          { month: 'asc' }
        ]
      });

      const waterData = await this.prisma.utility_calcs.findMany({
        where: {
          project_id: projectId,
          meter_type: 'Municipally Supplied Potable Water - Mixed Indoor/Outdoor',
          year: reportYear
        },
        orderBy: [
          { month: 'asc' }
        ]
      })

      // Get weather data from the weather_comparison table
      const weatherData = await this.prisma.weather_comparison.findMany({
        where: {
          project_id: projectId,
          base_year: reportYear
        },
        orderBy: [
          { month: 'asc' }
        ]
      });

      // Get total utility usage
      const totalUsage = await this.utilityCalcsService.getTotalUtilityUsage(projectId);

      // Constants for conversions
      const THERM_TO_MMBTU = 0.1; // 1 therm = 0.1 MMBtu
      const KWH_TO_MMBTU = 0.003412; // 1 kWh = 0.003412 MMBtu
      const HCF_TO_MMBTU = 0.103; // 1 hcf = 0.103 MMBtu

      // Process electric data
      const monthlyElectric = Array(12).fill(null).map((_, idx) => {
        const month = idx + 1;
        const data = electricData.find(d => d.month === month);
        const usage = data?.usage != null
          ? (typeof data.usage === 'object' ? parseFloat(data.usage.toString() || '0') : (data.usage || 0))
          : 0;
        const cost = data?.cost != null
          ? (typeof data.cost === 'object' ? parseFloat(data.cost.toString() || '0') : (data.cost || 0))
          : 0;
        return {
          month,
          usage,
          cost,
          mmbtu: usage * KWH_TO_MMBTU
        };
      });

      // Process gas data
      const monthlyGas = Array(12).fill(null).map((_, idx) => {
        const month = idx + 1;
        const data = gasData.find(d => d.month === month);
        const usage = data?.usage != null
          ? (typeof data.usage === 'object' ? parseFloat(data.usage.toString() || '0') : (data.usage || 0))
          : 0;
        const cost = data?.cost != null
          ? (typeof data.cost === 'object' ? parseFloat(data.cost.toString() || '0') : (data.cost || 0))
          : 0;
        return {
          month,
          usage,
          cost,
          mmbtu: usage * THERM_TO_MMBTU
        };
      });

      const monthlyWater = Array(12).fill(null).map((_, idx) => {
        const month = idx + 1;
        const data = waterData.find(d => d.month === month);
        const usage = data?.usage != null
          ? (typeof data.usage === 'object' ? parseFloat(data.usage.toString() || '0') : (data.usage || 0))
          : 0;
        const cost = data?.cost != null
          ? (typeof data.cost === 'object' ? parseFloat(data.cost.toString() || '0') : (data.cost || 0))
          : 0;
        return {
          month,
          usage,
          cost,
          mmbtu: usage * HCF_TO_MMBTU
        };
      })

      // Process weather data
      const monthlyWeather = Array(12).fill(null).map((_, idx) => {
        const month = idx + 1;
        const data = weatherData.find(d => d.month === month);
        return {
          month,
          hdd: data?.base_year_hdd || 0,
          cdd: data?.base_year_cdd || 0
        };
      });

      // Calculate totals
      const totalElectricUsage = monthlyElectric.reduce((sum, item) => sum + item.usage, 0);
      const totalElectricCost = monthlyElectric.reduce((sum, item) => sum + item.cost, 0);
      const totalElectricMMBtu = monthlyElectric.reduce((sum, item) => sum + item.mmbtu, 0);

      const totalGasUsage = monthlyGas.reduce((sum, item) => sum + item.usage, 0);
      const totalGasCost = monthlyGas.reduce((sum, item) => sum + item.cost, 0);
      const totalGasMMBtu = monthlyGas.reduce((sum, item) => sum + item.mmbtu, 0);

      const totalWaterUsage = monthlyWater.reduce((sum, item) => sum + item.usage, 0);
      const totalWaterCost = monthlyWater.reduce((sum, item) => sum + item.cost, 0);
      const totalWaterMMBtu = monthlyWater.reduce((sum, item) => sum + item.mmbtu, 0);

      // Calculate rates
      const avgElectricRate = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
      const avgGasRate = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
      const avgWaterRate = totalWaterUsage > 0 ? totalWaterCost / totalWaterUsage : 0;

      // Building metrics
      const buildingArea = project.property_gross_floor_area || 20000; // Default to 20,000 sqft
      const eui = (totalElectricMMBtu + totalGasMMBtu) / buildingArea * 1000; // kBtu/ft²
      const eci = (totalElectricCost + totalGasCost) / buildingArea; // $/ft²

      // Current year
      const currentYear = new Date().getFullYear();

      return {
        project,
        weatherData: monthlyWeather,
        monthlyElectric,
        monthlyGas,
        monthlyWater,
        totalUsage,
        summary: {
          year: currentYear,
          electricUsage: totalElectricUsage,
          electricCost: totalElectricCost,
          electricRate: avgElectricRate,
          electricMMBtu: totalElectricMMBtu,
          gasUsage: totalGasUsage,
          gasCost: totalGasCost,
          gasRate: avgGasRate,
          gasMMBtu: totalGasMMBtu,
          waterUsage: totalWaterUsage,
          waterCost: totalWaterCost,
          waterRate: avgWaterRate,
          waterMMBtu: totalWaterMMBtu,
          totalCost: totalElectricCost + totalGasCost,
          totalMMBtu: totalElectricMMBtu + totalGasMMBtu,
          buildingArea,
          eui,
          eci
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching energy summary data: ${error.message}`);
      throw error;
    }
  }
}

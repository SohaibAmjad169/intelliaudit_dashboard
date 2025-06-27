import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EquipmentItemDto } from '../dto/field-notes-response.dto';
import { EnergyBreakdownDto, EndUseComponentDto, SaveEnergyBreakdownDto } from '../dto/energy-breakdown.dto';
import { EnergyBreakdownRepository } from '../repositories/energy-breakdown.repository';
// We're now using direct standard percentages instead of these imports
// import { MULTIFAMILY_DEFAULT_BREAKDOWN, REVERSE_CATEGORY_MAPPING } from '../config/multifamily-breakdown.config';

/**
 * Energy consumption breakdown by end use
 */
export interface EnergyBreakdown {
  endUseComponents: EndUseComponent[];
  totalActualElectric: number;
  totalActualGas: number;
  totalActualSteam: number;
  totalActualOther: number;
}

/**
 * Component of energy breakdown (lighting, cooling, etc.)
 */
export interface EndUseComponent {
  name: string;
  electricPercent: number;
  gasPercent: number;
  steamPercent: number;
  otherPercent: number;
  electricKwh: number;
  gasTherms: number;
  steamMMBtu: number;
  otherMMBtu: number;
}

/**
 * Service to generate energy breakdowns from equipment data
 */
@Injectable()
export class EnergyBreakdownService {
  private readonly logger = new Logger(EnergyBreakdownService.name);
  private categoryMapping: Record<string, string> = {};
  private readonly openai: OpenAI;

  constructor(
    private readonly energyBreakdownRepository: EnergyBreakdownRepository,
    private readonly configService: ConfigService
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiKey) {
      this.logger.warn('OpenAI API key is missing. Some features may not work properly.');
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  /**
   * Generate energy breakdown from equipment list and utility data
   */
  generateEnergyBreakdown(
    equipment: EquipmentItemDto[],
    totalAnnualElectricKwh: number | null,
    totalAnnualGasTherms: number | null,
    totalAnnualSteamMMBtu: number | null = null,
    totalAnnualOtherMMBtu: number | null = null,
    buildingType: string = 'unknown'
  ): EnergyBreakdownDto {

    // Define end use categories - ensure all categories from the image are included
    const endUseCategories = [
      'Air Compressors',
      'Cooking',
      'Cooling',
      'Heating',
      'Lighting',
      'Miscellaneous',
      'Office Equipment',
      'Process',
      'Pool/Spa',
      'Motors/Pumps',
      'Elevator',
      'Refrigeration',
      'Ventilation',
      'Water Heating',
      'Laundry',
      // Make sure all these categories are included
      'HVAC', // Add HVAC as a fallback category
    ];

    // Ensure all categories are initialized, even if they have no equipment
    // This makes sure they all show up in the energy breakdown visualization

    // Log the categories we're using
    this.logger.debug(`Using end use categories: ${endUseCategories.join(', ')}`);

    // Create a mapping from equipment categories to end use categories - will be used in categorizeEquipment
    this.categoryMapping = {
      'HVAC': 'Cooling', // Default HVAC to Cooling if not specified
      'Lighting': 'Lighting',
      'Appliance': 'Other',
      'Water Heating': 'Water Heating',
      'Office Equipment': 'Office Equipment',
      'Other': 'Other',
      'Miscellaneous': 'Miscellaneous'
    };

    // Initialize end use components with zeros
    const components: EndUseComponentDto[] = endUseCategories.map(name => ({
      name,
      electricPercent: 0,
      gasPercent: 0,
      steamPercent: 0,
      otherPercent: 0,
      electricKwh: 0,
      gasTherms: 0,
      steamMMBtu: 0,
      otherMMBtu: 0,
    }));

    // Process equipment data if available
    if (equipment && equipment.length > 0) {
      // Collect energy usage by end-use category
      this.categorizeEquipment(equipment, components);

      // Calculate percentages based on the raw energy calculations
      this.calculatePercentages(components);
    }

    // Check if we have sufficient equipment data for a reasonable breakdown
    const hasElectricData = components.some(c => c.electricPercent > 0);
    const hasGasData = components.some(c => c.gasPercent > 0);

    // Check if we have actual utility data
    const hasActualElectricData = totalAnnualElectricKwh !== null && totalAnnualElectricKwh > 0;
    const hasActualGasData = totalAnnualGasTherms !== null && totalAnnualGasTherms > 0;

    // If we don't have actual utility data, we'll use the calculated values from equipment
    // and skip applying typical distributions
    if (!hasActualElectricData && !hasActualGasData) {
      // Calculate total energy from equipment data
      const calculatedElectricKwh = components.reduce((sum, c) => sum + c.electricKwh, 0);
      const calculatedGasTherms = components.reduce((sum, c) => sum + c.gasTherms, 0);

      // Set the totals to the calculated values
      totalAnnualElectricKwh = calculatedElectricKwh;
      totalAnnualGasTherms = calculatedGasTherms;

      // Add a warning flag that we're using calculated values
      this.logger.warn('No utility data available. Using calculated values from equipment data.');
    }
    // Apply typical distribution if we have utility data but insufficient equipment data
    else if ((!hasElectricData && hasActualElectricData) || (!hasGasData && hasActualGasData)) {
      // Apply typical breakdown based on building type
      const typicalComponents = this.applyTypicalBreakdown(buildingType);

      // If we don't have electric data but have actual electric usage, use typical distribution
      if (!hasElectricData && hasActualElectricData) {
        components.forEach(component => {
          const typicalComponent = typicalComponents.find(c => c.name === component.name);
          if (typicalComponent) {
            component.electricPercent = typicalComponent.electricPercent;
          }
        });
      }

      // If we don't have gas data but have actual gas usage, use typical distribution
      if (!hasGasData && hasActualGasData) {
        components.forEach(component => {
          const typicalComponent = typicalComponents.find(c => c.name === component.name);
          if (typicalComponent) {
            component.gasPercent = typicalComponent.gasPercent;
          }
        });
      }
    }

    // Reconcile with actual utility bills
    this.reconcileWithUtilityBills(
      components,
      totalAnnualElectricKwh,
      totalAnnualGasTherms,
      totalAnnualSteamMMBtu,
      totalAnnualOtherMMBtu
    );

    // Create the energy breakdown response
    const breakdownResult: EnergyBreakdownDto = {
      endUseComponents: components,
      totalActualElectric: totalAnnualElectricKwh || 0,
      totalActualGas: totalAnnualGasTherms || 0,
      totalActualSteam: totalAnnualSteamMMBtu || 0,
      totalActualOther: totalAnnualOtherMMBtu || 0,
      noUtilityDataAvailable: (totalAnnualElectricKwh === null || totalAnnualElectricKwh <= 0) &&
                                (totalAnnualGasTherms === null || totalAnnualGasTherms <= 0),
    };

    return breakdownResult;
  }

  /**
   * Generate and save energy breakdown for a project
   */
  async generateAndSaveEnergyBreakdown(
    projectId: string,
    equipment: EquipmentItemDto[],
    totalAnnualElectricKwh: number | null,
    totalAnnualGasTherms: number | null,
    modelUsed: string = 'default',
    totalAnnualSteamMMBtu: number | null = null,
    totalAnnualOtherMMBtu: number | null = null,
    buildingType: string = 'unknown'
  ): Promise<EnergyBreakdownDto> {
    // Log detailed input parameters for energy breakdown

    // Generate the energy breakdown
    const breakdownResult = this.generateEnergyBreakdown(
      equipment,
      totalAnnualElectricKwh,
      totalAnnualGasTherms,
      totalAnnualSteamMMBtu,
      totalAnnualOtherMMBtu,
      buildingType
    );

    // Log detailed breakdown results

    try {
      // Save the energy breakdown to the database
      const saveDto: SaveEnergyBreakdownDto = {
        projectId,
        breakdownData: JSON.stringify(breakdownResult),
        model: modelUsed,
        createdAt: new Date()
      };

      await this.energyBreakdownRepository.saveEnergyBreakdown(saveDto);
    } catch (error) {
      this.logger.error(`Error saving energy breakdown: ${error.message}`, error.stack);
      // Don't throw the error - we still want to return the breakdown even if saving fails
    }

    return breakdownResult;
  }

  /**
   * Retrieve saved energy breakdown for a project
   */
  async getEnergyBreakdown(projectId: string): Promise<EnergyBreakdownDto | null> {
    try {
      const result = await this.energyBreakdownRepository.getEnergyBreakdown(projectId);

      if (result) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting energy breakdown: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Generate energy breakdown directly from equipment analysis table
   * @param projectId Project ID
   * @returns Energy breakdown based on equipment analysis data
   */
  async generateEnergyBreakdownFromEquipment(projectId: string): Promise<EnergyBreakdownDto> {
    try {
      // Get equipment data from equipment_analysis table
      const equipment = await this.energyBreakdownRepository.getEquipmentAnalysis(projectId);

      // Get utility data if available
      const utilityData = await this.energyBreakdownRepository.getUtilityData(projectId);

      // Extract total annual electric and gas usage from utility data
      const totalAnnualElectricKwh = utilityData?.totalAnnualElectricKwh || null;
      const totalAnnualGasTherms = utilityData?.totalAnnualGasTherms || null;

      // Get building type if available
      const buildingInfo = await this.energyBreakdownRepository.getBuildingInfo(projectId);
      const buildingType = buildingInfo?.type || 'unknown';

      // Generate energy breakdown using equipment data and utility totals
      const breakdownResult = this.generateEnergyBreakdown(
        equipment,
        totalAnnualElectricKwh,
        totalAnnualGasTherms,
        null, // No steam data
        null, // No other data
        buildingType
      );

      this.logger.log(`Generated energy breakdown for project ${projectId} with ${equipment.length} equipment items`);

      return breakdownResult;
    } catch (error) {
      this.logger.error(`Error generating energy breakdown from equipment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a baseline energy breakdown with minimal deviations based on field notes
   * @param projectId Project ID
   * @returns Energy breakdown with minimal deviations from baseline
   */
  async generateBaselineEnergyBreakdown(projectId: string): Promise<EnergyBreakdownDto> {
    try {
      this.logger.log(`Generating baseline energy breakdown for project ${projectId}`);

      // Get project details including raw field notes
      const project = await this.energyBreakdownRepository.getProjectDetails(projectId);
      if (!project || !project.raw_notes) {
        throw new Error('No field notes available for this project');
      }

      // Get building info with type and total units
      const buildingInfo = await this.energyBreakdownRepository.getBuildingInfo(projectId);
      const buildingType = buildingInfo?.type || 'unknown';
      const totalUnits = buildingInfo?.total_units || 1;

      this.logger.log(`Building type detected: ${buildingType}, Total units: ${totalUnits}`);

      // Determine effective building type, handling various multifamily naming conventions
      let effectiveBuildingType = buildingType;

      // Check if it's any kind of multifamily building
      if (buildingType.toLowerCase() === 'unknown') {
        effectiveBuildingType = 'multifamily';
      } else if (
        buildingType.toLowerCase().includes('multifamily') ||
        buildingType.toLowerCase().includes('multi-family') ||
        buildingType.toLowerCase().includes('multi family') ||
        buildingType.toLowerCase().includes('apartment') ||
        buildingType.toLowerCase().includes('residential') ||
        buildingType.toLowerCase().includes('housing')
      ) {
        effectiveBuildingType = 'multifamily';
        this.logger.log(`Detected multifamily building type from: ${buildingType}`);
      }

      this.logger.log(`Using building type: ${effectiveBuildingType} for energy breakdown`);

      // Get utility data if available
      const utilityData = await this.energyBreakdownRepository.getUtilityData(projectId);
      const totalAnnualElectricKwh = utilityData?.totalAnnualElectricKwh || null;
      const totalAnnualGasTherms = utilityData?.totalAnnualGasTherms || null;

      // Create system message for OpenAI with modified instructions
      const systemMessage = `You are an expert energy auditor specializing in analyzing building energy usage patterns.
      Your task is to generate an energy breakdown for a building based on field notes.

      IMPORTANT: You MUST start with the standard baseline percentages for this building type and ONLY make MINOR adjustments when there is CLEAR evidence in the field notes.

      ## Standard Baseline Percentages for ${effectiveBuildingType}:
      ${this.getBaselinePercentagesText(effectiveBuildingType)}

      ## Instructions:
      1. Start with the EXACT baseline percentages above
      2. Read the field notes carefully
      3. For EACH category, ONLY adjust the percentage if there is CLEAR evidence in the field notes
      4. Any adjustment should be MINIMAL (±5% maximum) unless there is overwhelming evidence
      5. For EACH adjustment, provide a specific explanation referencing the field notes
      6. For apartment equipment, multiply by the total number of units (${totalUnits})
      7. Standard apartment equipment to account for:
         - Refrigerator: 1 per unit, ~600 kWh/year each
         - Stove/Oven: 1 per unit, ~500 kWh/year each
         - Dishwasher: 1 per unit, ~300 kWh/year each
         - Microwave: 1 per unit, ~100 kWh/year each
         - Lighting: ~500 kWh/year per unit
         - HVAC: Based on system type mentioned in field notes

      ## Project Information:
      Building Type: ${effectiveBuildingType}
      Total Units: ${totalUnits}
      Total Annual Electric Usage: ${totalAnnualElectricKwh ? `${totalAnnualElectricKwh} kWh` : 'Unknown'}
      Total Annual Gas Usage: ${totalAnnualGasTherms ? `${totalAnnualGasTherms} therms` : 'Unknown'}

      ## CRITICAL INSTRUCTIONS FOR MULTIFAMILY BUILDINGS:
      For multifamily buildings, you MUST ensure that the following categories have appropriate percentages that reflect standard apartment usage:

      1. Cooking: Each apartment has a stove/oven, microwave, and other kitchen appliances. This should be at least 8-10% of total usage.
      2. Refrigeration: Each apartment has at least one refrigerator running 24/7. This should be at least 5-7% of total usage.
      3. Laundry: Either in-unit or common laundry facilities serve all apartments. This should be at least 4-6% of total usage.
      4. Miscellaneous: Each apartment has TVs, computers, chargers, and other electronics. This should be at least 5-8% of total usage.

      Even if the field notes don't explicitly mention these items, they are standard in ALL apartment buildings and MUST be included with appropriate percentages.

      ## Response Format:
      Provide a JSON response with the following structure:
      {
        "endUseComponents": [
          {
            "name": "string", // Category name
            "electricPercent": number, // Percentage of electric usage
            "gasPercent": number, // Percentage of gas usage
            "electricKwh": number, // Annual kWh
            "gasTherms": number, // Annual therms
            "standardPercent": number, // The baseline percentage
            "deviationExplanation": "string" // REQUIRED: Explanation for ANY deviation from baseline
          }
        ]
      }

      IMPORTANT: For any category where you keep the baseline percentage, still include a brief explanation like "Maintained baseline percentage as field notes don't indicate any significant deviation."`;

      // Create user message with explicit instructions about apartment equipment
      const userMessage = `
      # Energy Breakdown Analysis Request

      Please analyze the following field notes and generate an energy breakdown that follows the standard baseline percentages with minimal deviations.

      ## Important Reminders:
      1. This is a ${effectiveBuildingType} building with ${totalUnits} units
      2. EVERY apartment has standard equipment that MUST be accounted for:
         - Refrigerator (one per unit)
         - Stove/oven (one per unit)
         - Microwave (one per unit)
         - Dishwasher (in most units)
         - Lighting fixtures
         - TVs, computers, and electronics
      3. The building likely has laundry facilities (either in-unit or common area)

      Even if these items are not explicitly mentioned in the field notes, they MUST be included in your analysis with appropriate percentages.

      ## Field Notes:
      ${project.raw_notes}
      `;

      // Call OpenAI to analyze the field notes and generate a baseline energy breakdown
      let breakdown: EnergyBreakdownDto;

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2, // Lower temperature for more conservative results
          response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // Parse the response
        breakdown = JSON.parse(content);

        // Ensure all components have the required fields
        this.validateAndNormalizeBreakdown(breakdown);

        // Add standard percentages and ensure deviation explanations
        this.addStandardPercentages(breakdown, effectiveBuildingType);

        // Check if it's any kind of multifamily building using a more flexible approach
        const isMultifamily = effectiveBuildingType.toLowerCase() === 'multifamily' ||
                           effectiveBuildingType.toLowerCase() === 'apartment' ||
                           effectiveBuildingType.toLowerCase().includes('multifamily') ||
                           effectiveBuildingType.toLowerCase().includes('multi-family') ||
                           effectiveBuildingType.toLowerCase().includes('multi family') ||
                           effectiveBuildingType.toLowerCase().includes('apartment') ||
                           effectiveBuildingType.toLowerCase().includes('residential') ||
                           effectiveBuildingType.toLowerCase().includes('housing');

        // For multifamily buildings, ensure minimum percentages for key categories
        if (isMultifamily) {
          this.logger.log(`Detected multifamily building, ensuring minimum percentages for ${totalUnits} units`);
          this.ensureMultifamilyMinimumPercentages(breakdown, totalUnits);
        }

        // Calculate actual energy usage based on percentages
        this.calculateEnergyUsage(breakdown, totalAnnualElectricKwh, totalAnnualGasTherms);

        // Save the energy breakdown to the database
        const saveDto: SaveEnergyBreakdownDto = {
          projectId,
          breakdownData: JSON.stringify(breakdown),
          model: 'baseline-with-field-notes',
          createdAt: new Date()
        };

        await this.energyBreakdownRepository.saveEnergyBreakdown(saveDto);

        this.logger.log(`Generated baseline energy breakdown for project ${projectId}`);

        return breakdown;
      } catch (error) {
        this.logger.error(`Error generating baseline energy breakdown: ${error.message}`, error.stack);
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error in generateBaselineEnergyBreakdown: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Ensure minimum percentages for key categories in multifamily buildings
   * @param breakdown Energy breakdown to modify
   * @param totalUnits Total number of apartment units
   */
  private ensureMultifamilyMinimumPercentages(breakdown: EnergyBreakdownDto, totalUnits: number): void {
    this.logger.log(`Ensuring minimum percentages for multifamily building with ${totalUnits} units`);

    // Define minimum percentages for key categories
    const minimumPercentages: Record<string, number> = {
      'Cooking': 8,
      'Refrigeration': 5,
      'Laundry': 4,
      'Miscellaneous': 5
    };

    // Calculate total adjustment needed
    let totalAdjustmentNeeded = 0;
    const adjustments: Record<string, number> = {};

    // First pass: identify all categories that need adjustment
    for (const [category, minPercent] of Object.entries(minimumPercentages)) {
      const component = breakdown.endUseComponents.find(c => c.name === category);

      if (component) {
        // If the percentage is below the minimum, calculate adjustment needed
        if (component.electricPercent < minPercent) {
          const difference = minPercent - component.electricPercent;
          adjustments[category] = difference;
          totalAdjustmentNeeded += difference;
          this.logger.log(`${category} needs adjustment from ${component.electricPercent}% to ${minPercent}% (diff: ${difference}%)`);
        }
      } else {
        // If the category doesn't exist, create it
        this.logger.log(`Category ${category} not found, creating with minimum ${minPercent}%`);
        const newComponent = {
          name: category,
          electricPercent: minPercent,
          gasPercent: 0,
          electricKwh: 0, // Will be calculated later
          gasTherms: 0,
          steamMMBtu: 0,
          steamPercent: 0,
          otherMMBtu: 0,
          otherPercent: 0,
          standardPercent: minPercent,
          deviationExplanation: `Added standard ${category} category for multifamily building with minimum ${minPercent}% allocation.`
        };
        breakdown.endUseComponents.push(newComponent);
        adjustments[category] = minPercent;
        totalAdjustmentNeeded += minPercent;
      }
    }

    // If no adjustments needed, we're done
    if (totalAdjustmentNeeded === 0) {
      this.logger.log('No minimum percentage adjustments needed for multifamily building');
      return;
    }

    // Second pass: find categories to reduce
    // Prioritize reducing from largest non-essential categories
    const categoriesToReduce = [...breakdown.endUseComponents]
      .filter(c => !Object.keys(minimumPercentages).includes(c.name))
      .sort((a, b) => b.electricPercent - a.electricPercent);

    this.logger.log(`Need to reduce ${totalAdjustmentNeeded}% from other categories to maintain 100% total`);
    this.logger.log(`Categories available for reduction: ${categoriesToReduce.map(c => `${c.name}: ${c.electricPercent}%`).join(', ')}`);

    // Distribute the reduction proportionally among the largest categories
    let remainingAdjustment = totalAdjustmentNeeded;
    let totalAvailablePercentage = categoriesToReduce.reduce((sum, c) => sum + c.electricPercent, 0);

    // Ensure we don't reduce below 1% for any category
    const safeToReduceCategories = categoriesToReduce.filter(c => c.electricPercent > 1);
    totalAvailablePercentage = safeToReduceCategories.reduce((sum, c) => sum + (c.electricPercent - 1), 0);

    if (totalAvailablePercentage < totalAdjustmentNeeded) {
      this.logger.warn(`Not enough percentage available to reduce (${totalAvailablePercentage}% < ${totalAdjustmentNeeded}%)`);
      this.logger.warn('Will reduce as much as possible and then normalize');
    }

    // Apply reductions
    for (const category of safeToReduceCategories) {
      if (remainingAdjustment <= 0) break;

      // Calculate proportional reduction
      const maxReduction = category.electricPercent - 1; // Don't go below 1%
      const reduction = Math.min(remainingAdjustment, maxReduction);

      this.logger.log(`Reducing ${category.name} by ${reduction}% (from ${category.electricPercent}% to ${category.electricPercent - reduction}%)`);

      // Apply reduction
      category.electricPercent -= reduction;
      remainingAdjustment -= reduction;

      // Add explanation
      category.deviationExplanation = category.deviationExplanation || '';
      if (!category.deviationExplanation.includes('adjusted to balance')) {
        category.deviationExplanation += ` Percentage adjusted to balance minimum requirements for apartment equipment.`;
      }
    }

    // Apply the adjustments to increase categories
    for (const [category, _] of Object.entries(adjustments)) {
      const component = breakdown.endUseComponents.find(c => c.name === category);
      if (component) {
        const oldValue = component.electricPercent;
        component.electricPercent = minimumPercentages[category];
        this.logger.log(`Adjusted ${category} from ${oldValue}% to ${component.electricPercent}%`);

        // Add explanation
        component.deviationExplanation = component.deviationExplanation || '';
        if (!component.deviationExplanation.includes('adjusted to minimum')) {
          component.deviationExplanation += ` Percentage adjusted to minimum ${minimumPercentages[category]}% to account for standard equipment in multifamily building.`;
        }
      }
    }

    // Final normalization to ensure total is exactly 100%
    const totalPercentage = breakdown.endUseComponents.reduce((sum, c) => sum + c.electricPercent, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      this.logger.log(`Final total is ${totalPercentage}%, normalizing to 100%`);

      // Normalize all percentages
      for (const component of breakdown.endUseComponents) {
        component.electricPercent = (component.electricPercent / totalPercentage) * 100;
      }
    }

    this.logger.log('Finished adjusting minimum percentages for multifamily building');
  }

  /**
   * Get baseline percentages text for a building type
   */
  private getBaselinePercentagesText(buildingType: string): string {
    // For multifamily buildings
    if (buildingType.toLowerCase() === 'multifamily' || buildingType.toLowerCase() === 'apartment') {
      return `
      - Heating: 15%
      - Cooling: 15%
      - Ventilation: 5%
      - Lighting: 15%
      - Cooking: 10%
      - Miscellaneous: 5%
      - Water Heating: 20%
      - Laundry: 5%
      - Refrigeration: 5%
      - Elevator: 3%
      - Pool/Spa: 2%`;
    }

    // For other building types, add their baseline percentages here
    // ...

    // Default percentages if building type is unknown
    return `
    - Heating: 20%
    - Cooling: 15%
    - Ventilation: 10%
    - Lighting: 20%
    - Miscellaneous: 15%
    - Water Heating: 10%
    - Office Equipment: 10%`;
  }

  /**
   * Validate and normalize the breakdown structure
   */
  private validateAndNormalizeBreakdown(breakdown: EnergyBreakdownDto): void {
    if (!breakdown.endUseComponents || !Array.isArray(breakdown.endUseComponents)) {
      breakdown.endUseComponents = [];
    }

    // Ensure all required categories are present
    const requiredCategories = [
      'Air Compressors', 'Cooking', 'Cooling', 'Heating', 'Lighting',
      'Miscellaneous', 'Office Equipment', 'Process', 'Pool/Spa',
      'Motors/Pumps', 'Elevator', 'Refrigeration', 'Ventilation',
      'Water Heating', 'Laundry'
    ];

    // Add any missing categories with minimal values
    for (const category of requiredCategories) {
      if (!breakdown.endUseComponents.some(c => c.name === category)) {
        breakdown.endUseComponents.push({
          name: category,
          electricPercent: 0.1,  // Minimal value to ensure visibility
          gasPercent: 0,
          electricKwh: 1,
          gasTherms: 0,
          steamMMBtu: 0,
          steamPercent: 0,
          otherMMBtu: 0,
          otherPercent: 0,
          standardPercent: 0,
          deviationExplanation: 'Category not present in baseline but added for completeness.'
        });
      }
    }

    // Ensure all components have the required fields
    breakdown.endUseComponents.forEach(component => {
      component.electricPercent = component.electricPercent || 0;
      component.gasPercent = component.gasPercent || 0;
      component.electricKwh = component.electricKwh || 0;
      component.gasTherms = component.gasTherms || 0;
      component.steamMMBtu = component.steamMMBtu || 0;
      component.steamPercent = component.steamPercent || 0;
      component.otherMMBtu = component.otherMMBtu || 0;
      component.otherPercent = component.otherPercent || 0;
    });
  }

  /**
   * Add standard percentages to components based on building type
   */
  private addStandardPercentages(breakdown: EnergyBreakdownDto, buildingType: string): void {
    // Define standard percentages based on building type
    const standardPercentages: Record<string, number> = {};

    // Check if it's any kind of multifamily building using a more flexible approach
    const isMultifamily = buildingType.toLowerCase() === 'multifamily' ||
                         buildingType.toLowerCase() === 'apartment' ||
                         buildingType.toLowerCase().includes('multifamily') ||
                         buildingType.toLowerCase().includes('multi-family') ||
                         buildingType.toLowerCase().includes('multi family') ||
                         buildingType.toLowerCase().includes('apartment') ||
                         buildingType.toLowerCase().includes('residential') ||
                         buildingType.toLowerCase().includes('housing');

    this.logger.log(`Building type: ${buildingType}, isMultifamily: ${isMultifamily}`);

    if (isMultifamily) {
      this.logger.log('Using multifamily standard percentages');
      standardPercentages['Heating'] = 15;
      standardPercentages['Cooling'] = 15;
      standardPercentages['Ventilation'] = 5;
      standardPercentages['Lighting'] = 15;
      standardPercentages['Cooking'] = 10;
      standardPercentages['Miscellaneous'] = 5;
      standardPercentages['Water Heating'] = 20;
      standardPercentages['Laundry'] = 5;
      standardPercentages['Refrigeration'] = 5;
      standardPercentages['Elevator'] = 3;
      standardPercentages['Pool/Spa'] = 2;
    } else {
      // Default percentages for other building types
      this.logger.log('Using default standard percentages');
      standardPercentages['Heating'] = 20;
      standardPercentages['Cooling'] = 15;
      standardPercentages['Ventilation'] = 10;
      standardPercentages['Lighting'] = 20;
      standardPercentages['Miscellaneous'] = 15;
      standardPercentages['Water Heating'] = 10;
      standardPercentages['Office Equipment'] = 10;
    }

    // Log the standard percentages for debugging
    this.logger.log('Standard percentages: ' + JSON.stringify(standardPercentages));

    // Add standard percentages to each component
    for (const component of breakdown.endUseComponents) {
      if (standardPercentages[component.name]) {
        component.standardPercent = standardPercentages[component.name];
        this.logger.log(`Setting standard percentage for ${component.name}: ${component.standardPercent}%`);

        // If no deviation explanation, add a default one
        if (!component.deviationExplanation) {
          component.deviationExplanation = 'Maintained baseline percentage as field notes don\'t indicate any significant deviation.';
        }
      } else {
        // For categories without standard percentages, add a small standard value
        component.standardPercent = 1; // 1% as default for categories not in the standard list
        this.logger.log(`Setting default standard percentage for ${component.name}: 1%`);
      }
    }

    // For multifamily buildings, ensure all standard categories exist
    if (isMultifamily) {
      for (const [category, percentage] of Object.entries(standardPercentages)) {
        if (!breakdown.endUseComponents.some(c => c.name === category)) {
          this.logger.log(`Adding missing standard category for multifamily: ${category} (${percentage}%)`);

          // Add the missing category with minimal values
          breakdown.endUseComponents.push({
            name: category,
            electricPercent: 0.1, // Will be adjusted by ensureMultifamilyMinimumPercentages
            gasPercent: 0,
            electricKwh: 0,
            gasTherms: 0,
            steamMMBtu: 0,
            steamPercent: 0,
            otherMMBtu: 0,
            otherPercent: 0,
            standardPercent: percentage,
            deviationExplanation: `Standard ${category} category for multifamily buildings.`
          });
        }
      }
    }
  }

  /**
   * Calculate actual energy usage based on percentages
   */
  private calculateEnergyUsage(breakdown: EnergyBreakdownDto, totalElectricKwh: number | null, totalGasTherms: number | null): void {
    // Normalize percentages to ensure they sum to 100%
    let totalElectricPercent = breakdown.endUseComponents.reduce((sum, comp) => sum + comp.electricPercent, 0);
    let totalGasPercent = breakdown.endUseComponents.reduce((sum, comp) => sum + comp.gasPercent, 0);

    if (totalElectricPercent > 0) {
      breakdown.endUseComponents.forEach(comp => {
        comp.electricPercent = (comp.electricPercent / totalElectricPercent) * 100;
      });
    }

    if (totalGasPercent > 0) {
      breakdown.endUseComponents.forEach(comp => {
        comp.gasPercent = (comp.gasPercent / totalGasPercent) * 100;
      });
    }

    // Calculate actual energy usage from percentages
    const actualElectricKwh = totalElectricKwh || 100000; // Default to 100,000 kWh if no data
    const actualGasTherms = totalGasTherms !== null ? totalGasTherms : 0; // Don't use default value if actual is 0

    breakdown.endUseComponents.forEach(comp => {
      comp.electricKwh = (comp.electricPercent / 100) * actualElectricKwh;
      comp.gasTherms = (comp.gasPercent / 100) * actualGasTherms;
    });

    // Update the breakdown totals
    breakdown.totalActualElectric = actualElectricKwh;
    breakdown.totalActualGas = actualGasTherms;
    breakdown.totalActualSteam = 0;
    breakdown.totalActualOther = 0;
    breakdown.noUtilityDataAvailable = !totalElectricKwh && !totalGasTherms;
  }

  /**
   * Generate a comprehensive energy breakdown from field notes using OpenAI
   * This method will analyze field notes, extract equipment, and generate a detailed energy breakdown
   * @param projectId Project ID
   * @returns Comprehensive energy breakdown with all categories filled in
   */
  async generateComprehensiveEnergyBreakdown(projectId: string): Promise<EnergyBreakdownDto> {
    try {
      this.logger.log(`Generating comprehensive energy breakdown for project ${projectId}`);

      // Get project details including raw field notes
      const project = await this.energyBreakdownRepository.getProjectDetails(projectId);
      if (!project || !project.raw_notes) {
        throw new Error('No field notes available for this project');
      }

      // Get building info with type and total units
      const buildingInfo = await this.energyBreakdownRepository.getBuildingInfo(projectId);
      const buildingType = buildingInfo?.type || 'unknown';
      const totalUnits = buildingInfo?.total_units || 1;

      this.logger.log(`Building type detected: ${buildingType}, Total units: ${totalUnits}`);

      // Force building type to multifamily for testing if it's not already set
      // This is temporary for debugging
      const effectiveBuildingType = buildingType.toLowerCase() === 'unknown' ? 'multifamily' : buildingType;
      this.logger.log(`Using building type: ${effectiveBuildingType} for energy breakdown`);

      // Get utility data if available
      const utilityData = await this.energyBreakdownRepository.getUtilityData(projectId);
      const totalAnnualElectricKwh = utilityData?.totalAnnualElectricKwh || null;
      const totalAnnualGasTherms = utilityData?.totalAnnualGasTherms || null;

      // Get existing equipment data
      const equipmentItems = await this.energyBreakdownRepository.getEquipmentAnalysis(projectId);

      // Create system message for OpenAI
      const systemMessage = `You are an expert energy auditor specializing in analyzing building equipment and energy usage patterns.
      Your task is to generate a comprehensive energy breakdown for a building based on field notes and equipment data.

      IMPORTANT: You MUST thoroughly analyze ALL equipment mentioned in the field notes AND make reasonable assumptions about equipment that would typically be present but might not be explicitly mentioned.

      For each piece of equipment mentioned in the field notes:
      1. Note its type, quantity, and capacity (kW, BTU, etc.)
      2. Estimate typical usage patterns (hours per day, days per week)
      3. Calculate annual energy consumption (kWh for electric, therms for gas)
      4. Categorize it into the appropriate end-use category

      For equipment NOT explicitly mentioned but likely present in a ${effectiveBuildingType} building with ${totalUnits} units:
      1. Make reasonable assumptions based on typical usage patterns
      2. Include these in your calculations with clear explanations
      3. For example, assume each unit has refrigerators, cooking equipment, TVs, computers, etc.

      Your analysis must be comprehensive and realistic - no building has zero cooking, refrigeration, or miscellaneous loads.

      For multifamily buildings, you MUST use the following standard breakdown as a starting point:

      | End Use                    | Standard % |
      |----------------------------|------------|
      | Heating                    | 15%        |
      | Cooling                    | 15%        |
      | Ventilation                | 5%         |
      | Interior Lighting          | 10%        |
      | Exterior Lighting          | 5%         |
      | Residential Appliances     | 10%        |
      | Miscellaneous Electronics  | 5%         |
      | Domestic Hot Water (DHW)   | 20%        |
      | Laundry Equipment          | 5%         |
      | Residential Refrigeration  | 5%         |
      | Vertical Transportation    | 3%         |
      | Pools & Recreational       | 2%         |

      IMPORTANT: Start with these exact percentages, but you MUST carefully analyze the field notes and equipment data to determine the actual energy usage.

      For EACH category, you should:
      1. Look for specific equipment mentioned in the field notes (e.g., heat pumps, lighting fixtures, etc.)
      2. Consider the quantity, capacity, and usage patterns of each piece of equipment
      3. Multiply equipment in individual units by the total number of units (${totalUnits})
      4. Adjust the standard percentages based on your analysis
      5. Include a 'deviationExplanation' field explaining WHY you adjusted the percentage

      Even if equipment is not explicitly mentioned, make reasonable assumptions based on the building type.
      For example, assume each apartment has a refrigerator, cooking equipment, and computers/electronics.

      For example, your response should include explanations like these:
      - For Cooling: "deviationExplanation": "Cooling increased from standard 15% to 25% because the building has central air conditioning in all units plus additional window units in some apartments."
      - For Laundry: "deviationExplanation": "Laundry decreased from standard 5% to 2% because there is only one small laundry room for the entire building."

      You MUST include the 'standardPercent' field for each component, and add 'deviationExplanation' whenever you deviate from that standard.

      Map these standard categories to our system categories as follows:
      - Heating → Heating
      - Cooling → Cooling
      - Ventilation → Ventilation
      - Interior Lighting + Exterior Lighting → Lighting
      - Residential Appliances → Cooking
      - Miscellaneous Electronics → Miscellaneous
      - Domestic Hot Water → Water Heating
      - Laundry Equipment → Laundry
      - Residential Refrigeration → Refrigeration
      - Vertical Transportation → Elevator
      - Pools & Recreational → Pool/Spa

      Pay special attention to:
      1. HVAC equipment (heat pumps, air conditioners, furnaces) - categorize as Cooling, Heating, or both
      2. Laundry equipment (washers, dryers) - categorize as Laundry
      3. Elevator equipment - categorize as Elevator
      4. Kitchen appliances - categorize as Cooking
      5. Office equipment (computers, printers) - categorize as Office Equipment
      6. Water heaters - categorize as Water Heating
      7. Pumps and motors - categorize as Motors/Pumps
      8. Ventilation equipment - categorize as Ventilation

      Even if usage seems minimal, assign a small but non-zero value to each category where equipment is present.`;

      // Create user message with all the details
      const userMessage = `
# Comprehensive Energy Distribution Analysis

## Project Information
Building Type: ${effectiveBuildingType}
Total Units: ${totalUnits}
Total Annual Electric Usage: ${totalAnnualElectricKwh ? `${totalAnnualElectricKwh} kWh` : 'Unknown'}
Total Annual Gas Usage: ${totalAnnualGasTherms ? `${totalAnnualGasTherms} therms` : 'Unknown'}

## Task
Analyze the field notes and equipment data to generate a comprehensive energy breakdown across all end-use categories. The breakdown should account for ALL equipment mentioned in the field notes, including equipment in individual units multiplied by the total number of units (${totalUnits}).

### Important Equipment to Identify
1. Heat pumps: Identify all heat pumps (e.g., "Roof mounted Heat pumps = 51") and calculate their energy usage for both heating and cooling.
2. Water heaters: Identify all water heaters (e.g., "Water heater in each unit (47)") and calculate their energy usage.
3. Lighting fixtures: Identify all lighting fixtures and calculate their energy usage.
4. Laundry equipment: Identify washers and dryers and calculate their energy usage.
5. Elevator equipment: Identify elevator equipment and calculate its energy usage.
6. Office equipment: Estimate energy usage for office equipment in management offices.
7. Cooking equipment: Estimate energy usage for cooking equipment in units and common areas.
8. Ventilation: Estimate energy usage for ventilation systems.

Ensure that you multiply equipment in individual units by the total number of units when calculating total energy usage.

## Required End-Use Categories
Generate energy usage estimates (kWh and/or therms) for ALL of these categories:
- Air Compressors
- Cooking
- Cooling
- Heating
- Lighting
- Miscellaneous
- Office Equipment
- Process
- Pool/Spa
- Motors/Pumps
- Elevator
- Refrigeration
- Ventilation
- Water Heating
- Laundry

## Deviation Explanations
For each category where your estimated percentage deviates significantly (>5%) from the standard multifamily breakdown, provide an explanation in your response. Include a field called 'deviationExplanation' for each component where you explain why the percentage is higher or lower than the standard.

For example:

If your analysis shows Cooling at 25% compared to the standard 15%, include a deviationExplanation field in your JSON response like this:

"For Cooling, if your analysis shows 25% usage compared to the standard 15%, add a deviationExplanation field that explains: 'Cooling usage is higher than the standard 15% because the building has central air conditioning in all units plus additional window units in some apartments.'"

### Making Reasonable Assumptions
You MUST make reasonable assumptions for equipment that is not explicitly mentioned in the field notes. For a multifamily building with ${totalUnits} units, assume:

1. Cooking: Each unit has an electric stove/oven (1200W), microwave (1000W), and small appliances. Estimate usage patterns.
2. Office Equipment: Management office has computers (200W each), printers, and other office equipment.
3. Refrigeration: Each unit has at least one refrigerator (150W) running 24/7.
4. Ventilation: Each unit has bathroom fans (50W) and kitchen exhaust fans (100W) with typical usage patterns.
5. Motors/Pumps: Building has water circulation pumps, sump pumps, etc. based on size and age.
6. Miscellaneous: Each unit has TVs, chargers, and other electronics with typical usage patterns.
7. Laundry: If not explicitly mentioned, assume either in-unit or common laundry facilities.

Calculate energy usage for these assumed equipment items and include them in your breakdown.
Even for categories with minimal equipment, assign a realistic non-zero value rather than 0%.

## Field Notes
${project.raw_notes}

## Existing Equipment Data
${JSON.stringify(equipmentItems, null, 2)}

## Output Format
Provide a detailed JSON object with the following structure:
{
  "endUseComponents": [
    {
      "name": "Category Name",
      "electricKwh": 1234,
      "electricPercent": 12.3,
      "gasTherms": 123,
      "gasPercent": 12.3,
      "steamMMBtu": 0,
      "steamPercent": 0,
      "otherMMBtu": 0,
      "otherPercent": 0,
      "standardPercent": 15.0,
      "deviationExplanation": "Explanation for why this percentage differs from standard (for multifamily buildings)"
    },
    // Additional categories...
  ],
  "totalActualElectric": 10000,
  "totalActualGas": 1000,
  "totalActualSteam": 0,
  "totalActualOther": 0,
  "noUtilityDataAvailable": false
}

Ensure that ALL categories are filled in, even if with small percentages, and that the total percentages add up to 100% for each energy type.
`;

      this.logger.debug('Preparing to call OpenAI for comprehensive energy breakdown');

      // Call OpenAI to analyze the field notes and generate a comprehensive energy breakdown
      let breakdown: EnergyBreakdownDto;

      try {
        // Call OpenAI API
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        });

        // Extract the response content
        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) {
          throw new Error('Empty response from OpenAI');
        }

        this.logger.debug('Received response from OpenAI:', responseContent);

        // Parse the JSON response
        breakdown = JSON.parse(responseContent);

        // Validate the response structure
        if (!breakdown.endUseComponents || !Array.isArray(breakdown.endUseComponents)) {
          throw new Error('Invalid response format: missing endUseComponents array');
        }

        // Ensure all required categories are present
        const requiredCategories = [
          'Air Compressors', 'Cooking', 'Cooling', 'Heating', 'Lighting',
          'Miscellaneous', 'Office Equipment', 'Process', 'Pool/Spa',
          'Motors/Pumps', 'Elevator', 'Refrigeration', 'Ventilation',
          'Water Heating', 'Laundry'
        ];

        // Add any missing categories with minimal values
        for (const category of requiredCategories) {
          if (!breakdown.endUseComponents.some(c => c.name === category)) {
            breakdown.endUseComponents.push({
              name: category,
              electricKwh: 1,  // Minimal value to ensure visibility
              electricPercent: 0.1,
              gasTherms: 0,
              gasPercent: 0,
              steamMMBtu: 0,
              steamPercent: 0,
              otherMMBtu: 0,
              otherPercent: 0
            });
          }
        }

        // For multifamily buildings, add standard percentages and ensure deviation explanations
        if (effectiveBuildingType.toLowerCase() === 'multifamily' || effectiveBuildingType.toLowerCase() === 'apartment') {
          this.logger.log('Adding standard percentages and deviation explanations for multifamily building');

          // Define standard percentages directly for clarity
          const standardPercentages: Record<string, number> = {
            'Heating': 15,
            'Cooling': 15,
            'Ventilation': 5,
            'Lighting': 15,
            'Cooking': 10,
            'Miscellaneous': 5,
            'Water Heating': 20,
            'Laundry': 5,
            'Refrigeration': 5,
            'Elevator': 3,
            'Pool/Spa': 2
          };

          this.logger.log('Standard percentages for multifamily:', standardPercentages);

          // Add standard percentages to each component and ensure deviation explanations
          for (const component of breakdown.endUseComponents) {
            // If this category has a standard percentage, add it
            if (standardPercentages[component.name]) {
              component.standardPercent = standardPercentages[component.name];

              // Calculate the deviation
              const deviation = Math.abs(component.electricPercent - standardPercentages[component.name]);

              // Always add a deviation explanation for multifamily buildings
              if (!component.deviationExplanation && deviation > 3) {
                if (component.electricPercent > standardPercentages[component.name]) {
                  component.deviationExplanation = `Higher than standard (${standardPercentages[component.name]}%) due to equipment identified in field notes.`;
                } else {
                  component.deviationExplanation = `Lower than standard (${standardPercentages[component.name]}%) based on equipment identified in field notes.`;
                }
                this.logger.log(`Added deviation explanation for ${component.name}: ${component.deviationExplanation}`);
              }
            } else {
              // For categories without standard percentages, add a small standard value
              component.standardPercent = 1; // 1% as default for categories not in the standard list
            }
          }
        }

        // Calculate total actual electric usage from equipment or use utility data if available
        const totalActualElectric = totalAnnualElectricKwh ||
          breakdown.endUseComponents.reduce((sum, comp) => sum + (comp.electricKwh || 0), 0) || 100000; // Default to 100,000 kWh if no data

        // Calculate total actual gas usage from equipment or use utility data if available
        const calculatedGas = breakdown.endUseComponents.reduce((sum, comp) => sum + (comp.gasTherms || 0), 0);
        const totalActualGas = totalAnnualGasTherms !== null ? totalAnnualGasTherms : 
                              (calculatedGas > 0 ? calculatedGas : 0); 

        // Update the breakdown totals
        breakdown.totalActualElectric = totalActualElectric;
        breakdown.totalActualGas = totalActualGas;

        this.logger.log(`Total actual electric: ${totalActualElectric} kWh, Total actual gas: ${totalActualGas} therms`);

        // First, normalize percentages to ensure they sum to 100%
        let totalElectricPercent = breakdown.endUseComponents.reduce((sum, comp) => sum + comp.electricPercent, 0);
        let totalGasPercent = breakdown.endUseComponents.reduce((sum, comp) => sum + comp.gasPercent, 0);

        if (totalElectricPercent > 0) {
          breakdown.endUseComponents.forEach(comp => {
            comp.electricPercent = (comp.electricPercent / totalElectricPercent) * 100;
          });
        }

        if (totalGasPercent > 0) {
          breakdown.endUseComponents.forEach(comp => {
            comp.gasPercent = (comp.gasPercent / totalGasPercent) * 100;
          });
        }

        // Now, reverse engineer the kWh values from the percentages
        // This ensures the kWh values match the percentages exactly
        breakdown.endUseComponents.forEach(comp => {
          // Calculate electric kWh from percentage
          if (comp.electricPercent > 0) {
            comp.electricKwh = (comp.electricPercent / 100) * totalActualElectric;
          }

          // Calculate gas therms from percentage
          if (comp.gasPercent > 0) {
            comp.gasTherms = (comp.gasPercent / 100) * totalActualGas;
          }

          this.logger.log(`Component ${comp.name}: ${comp.electricPercent.toFixed(1)}% = ${Math.round(comp.electricKwh)} kWh`);
        });
      } catch (error) {
        this.logger.error(`Error calling OpenAI API: ${error.message}`, error.stack);
        throw new Error(`Failed to generate energy breakdown: ${error.message}`);
      }

      // Save the energy breakdown to the database
      const saveDto: SaveEnergyBreakdownDto = {
        projectId,
        breakdownData: JSON.stringify(breakdown),
        model: 'OpenAI-GPT-4o-comprehensive',
        createdAt: new Date()
      };

      await this.energyBreakdownRepository.saveEnergyBreakdown(saveDto);

      this.logger.log(`Generated comprehensive energy breakdown for project ${projectId}`);

      return breakdown;
    } catch (error) {
      this.logger.error(`Error generating comprehensive energy breakdown: ${error.message}`, error.stack);
      throw error;
    }
  }



  /**
   * Categorize equipment into end-use components
   */
  private categorizeEquipment(
    equipment: EquipmentItemDto[],
    components: EndUseComponentDto[]
  ): void {
    // Log the start of equipment categorization
    this.logger.debug(`Starting to categorize ${equipment.length} equipment items`);

    // Process each equipment item
    for (const item of equipment) {
      // For lighting fixtures, recalculate annual kWh using our standardized formula
      if (item.category === 'Lighting') {
        this.recalculateAnnualKwh(item);
      }

      // For HVAC equipment with missing annual_kwh, estimate based on capacity or quantity
      if (item.category === 'HVAC' && !item.annual_kwh) {
        // Estimate annual kWh based on equipment type and capacity
        if (item.cooling_capacity_tons) {
          // Rough estimate: 1 ton = 1 kW, running 1000 hours per year
          const coolingCapacity = typeof item.cooling_capacity_tons === 'string' ?
            parseFloat(item.cooling_capacity_tons) : (item.cooling_capacity_tons || 0);
          item.annual_kwh = coolingCapacity * 1000;
          this.logger.debug(`Estimated annual kWh for ${item.equipment_type}: ${coolingCapacity} tons × 1000 hours = ${item.annual_kwh} kWh/year`);
        } else if (item.heating_capacity_mbh) {
          // Rough estimate for electric heating: 1 MBH = 0.293 kW, running 1000 hours per year
          const heatingCapacity = typeof item.heating_capacity_mbh === 'string' ?
            parseFloat(item.heating_capacity_mbh) : (item.heating_capacity_mbh || 0);

          if (item.energy_source && item.energy_source.toLowerCase() === 'gas') {
            // For gas heating, convert to therms (1 MBH = 0.01 therms/hour)
            item.annual_therms = item.annual_therms || (heatingCapacity * 10); // 0.01 therms/hour × 1000 hours
            this.logger.debug(`Estimated annual therms for ${item.equipment_type}: ${heatingCapacity} MBH ×  ${item.annual_therms} therms/year`);
          } else {
            item.annual_kwh = heatingCapacity * 0.293 * 1000;
            this.logger.debug(`Estimated annual kWh for ${item.equipment_type}: ${heatingCapacity} MBH × 0.293 kW/MBH × 1000 hours = ${item.annual_kwh} kWh/year`);
          }
        } else if (item.quantity) {
          // If no capacity data, use a default value based on quantity
          const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : (item.quantity || 0);
          // Default to 1000 kWh per unit per year
          item.annual_kwh = quantity * 1000;
          this.logger.debug(`Estimated annual kWh for ${item.equipment_type} based on quantity: ${quantity} units × 1000 kWh = ${item.annual_kwh} kWh/year`);
        }
      }

      // Skip if still no annual energy usage data after estimation
      if (!item.annual_kwh && !item.annual_therms && !item.capacity) {
        this.logger.warn(`Skipping equipment ${item.equipment_type} with no energy usage data`);
        continue;
      }

      // Determine end use category
      let endUseCategory = 'Other';

      // Try to get from end_use_category field if available
      if (item.end_use_category && components.some(c => c.name === item.end_use_category)) {
        endUseCategory = item.end_use_category;
        this.logger.debug(`Using end_use_category field for ${item.equipment_type}: ${endUseCategory}`);
      }
      // Otherwise map from equipment category
      else if (item.category) {
        // Handle Appliances category with more specificity
        if (item.category === 'Appliances') {
          const equipType = (item.equipment_type || '').toLowerCase();
          if (equipType.includes('refrigerator') || equipType.includes('freezer')) {
            endUseCategory = 'Refrigeration';
          } else if (equipType.includes('oven') || equipType.includes('stove') || equipType.includes('range') || equipType.includes('cooking') || equipType.includes('microwave')) {
            endUseCategory = 'Cooking';
          } else if (equipType.includes('dishwasher')) {
            // Dishwashers can be debated, let's keep in Miscellaneous for now or potentially Water Heating if desired
            endUseCategory = 'Miscellaneous';
          } else if (equipType.includes('fan')) {
            // Ceiling fans etc.
             endUseCategory = 'Miscellaneous';
          } else {
            // Default other appliances to Miscellaneous
            endUseCategory = 'Miscellaneous';
          }
           this.logger.debug(`Mapped Appliance type ${item.equipment_type} to ${endUseCategory}`);
        }
        // Handle HVAC sub-categories
        else if (item.category === 'HVAC') {
          const equipType = (item.equipment_type || '').toLowerCase();

          if (equipType.includes('cooling') ||
              equipType.includes('chiller') ||
              equipType.includes('ac') ||
              equipType.includes('air conditioning') ||
              // Add specific HVAC cooling equipment types
              (equipType.includes('split sys') && !equipType.includes('heat pump')) ||
              equipType.includes('packaged') && !equipType.includes('heat pump')) {
            endUseCategory = 'Cooling';
          } else if (equipType.includes('water heater')) {
            endUseCategory = 'Water Heating';
            this.logger.debug(`Categorized water heater as Water Heating: ${item.equipment_type}`);
          } else if (equipType.includes('heating') ||
                     equipType.includes('furnace') ||
                     equipType.includes('boiler') ||
                     equipType.includes('heat pump')) {
            endUseCategory = 'Heating';
          } else if (equipType.includes('ventilation') ||
                     equipType.includes('fan')) {
            endUseCategory = 'Ventilation';
          } else {
            // Default HVAC equipment to Cooling if no specific type is identified
            endUseCategory = 'Cooling';
          }

          this.logger.debug(`Mapped HVAC equipment ${item.equipment_type} to ${endUseCategory}`);
        }
        // Map from other categories
        else {
          // Use our category mapping (defined in constructor or elsewhere)
          const mappedCategory = this.categoryMapping[item.category];
          if (mappedCategory) {
            endUseCategory = mappedCategory;
            this.logger.debug(`Mapped category ${item.category} to ${endUseCategory}`);
          } else {
             // Default unmapped categories to Other or Miscellaneous
             endUseCategory = 'Miscellaneous';
             this.logger.debug(`Defaulted category ${item.category} to ${endUseCategory}`);
          }
        }
      }

      // Log all equipment data for debugging
      this.logger.debug(`Processing equipment: ${item.equipment_type}, category: ${item.category}, end_use_category: ${item.end_use_category}, annual_kwh: ${item.annual_kwh}, energy_source: ${item.energy_source}`);

      // Find component for this category
      const component = components.find(c => c.name === endUseCategory);
      if (!component) {
        this.logger.warn(`No component found for category: ${endUseCategory} for equipment ${item.equipment_type}`);
        // If no matching component, add to 'Other'
        const otherComponent = components.find(c => c.name === 'Other');
        if (otherComponent) {
          this.logger.debug(`Adding ${item.equipment_type} energy usage to Other: ${item.annual_kwh} kWh`);
          if (item.energy_source && item.energy_source.toLowerCase() === 'gas' && item.annual_therms) {
            otherComponent.gasTherms += item.annual_therms;
          } else {
            otherComponent.electricKwh += item.annual_kwh || 0;
          }
        }
        continue;
      }

      this.logger.debug(`Adding ${item.equipment_type} energy usage to ${endUseCategory}: ${item.annual_kwh} kWh`);

      // Add energy usage to appropriate component based on energy source
      if (item.energy_source && item.energy_source.toLowerCase() === 'electricity') {
        component.electricKwh += item.annual_kwh || 0;
      } else if (item.energy_source && item.energy_source.toLowerCase() === 'gas') {
        // Rough conversion from kWh to therms if needed
        const therms = item.annual_kwh ? item.annual_kwh / 29.3 : 0;
        component.gasTherms += therms;
      } else if (item.energy_source && item.energy_source.toLowerCase() === 'steam') {
        // Rough conversion from kWh to MMBtu if needed
        const mmBtu = item.annual_kwh ? item.annual_kwh / 293.07 : 0;
        component.steamMMBtu += mmBtu;
      } else {
        // Default to electricity if no source specified
        component.electricKwh += item.annual_kwh || 0;
      }
    }
  }

  /**
   * Recalculate annual kWh for lighting fixtures using our standardized formula
   * This ensures consistency with the field-notes.service.ts calculation
   */
  private recalculateAnnualKwh(item: EquipmentItemDto): void {
    // Ensure quantity is a number
    const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : (item.quantity || 0);

    // Ensure lamps_per_fixture is a number
    const lampsPerFixture = typeof item.lamps_per_fixture === 'string' ?
      parseFloat(item.lamps_per_fixture) :
      (item.lamps_per_fixture || 1);

    // Calculate number_of_lamps if not provided
    const numberOfLamps = item.number_of_lamps || (quantity * lampsPerFixture);

    // Get weekly hours based on location if not specified
    let weeklyHours = item.weekly_hours || 0;
    if (weeklyHours === 0) {
      weeklyHours = this.determineWeeklyHours(item.location);
    }

    // Ensure wattage is defined
    const calculatedWattage = item.wattage || 0;

    // Only calculate if we have all the necessary values
    if (numberOfLamps > 0 && calculatedWattage > 0 && weeklyHours > 0) {
      // Calculate annual kWh using our standard formula
      // Formula: (Total Lamps × Watts × Weekly Hours × 52) ÷ 1000
      // Apply location-specific adjustment factors
      const adjustmentFactor = this.determineAdjustmentFactor(item.location);
      item.annual_kwh = Math.round((numberOfLamps * calculatedWattage * weeklyHours * 52 * adjustmentFactor) / 1000);

      this.logger.debug(`Recalculated annual kWh for ${item.location}: ${numberOfLamps} lamps × ${calculatedWattage}W × ${weeklyHours} hours/week × 52 weeks × ${adjustmentFactor} adjustment ÷ 1000 = ${item.annual_kwh} kWh/year`);
    } else {
      this.logger.warn(`Could not recalculate annual kWh for ${item.location}: missing required values. numberOfLamps=${numberOfLamps}, wattage=${calculatedWattage}, weeklyHours=${weeklyHours}`);
    }
  }

  /**
   * Determine weekly operating hours based on location
   * @param location Location of the fixture
   * @returns Weekly operating hours
   */
  private determineWeeklyHours(location: string = ''): number {
    const locationLower = location.toLowerCase();

    if (locationLower.includes('exterior') ||
        locationLower.includes('outdoor') ||
        locationLower.includes('courtyard')) {
      return 77; // Exterior lighting
    } else if (locationLower.includes('hallway') ||
               locationLower.includes('lobby') ||
               locationLower.includes('common') ||
               locationLower.includes('community') ||
               locationLower.includes('stairwell')) {
      return 77; // Common areas
    } else if (locationLower.includes('bathroom') ||
               locationLower.includes('restroom')) {
      return 14; // Bathrooms
    } else if (locationLower.includes('laundry') ||
               locationLower.includes('utility') ||
               locationLower.includes('electrical') ||
               locationLower.includes('mechanical') ||
               locationLower.includes('storage') ||
               locationLower.includes('telecom')) {
      return 14; // Utility rooms
    } else if (locationLower.includes('bedroom') ||
               locationLower.includes('living') ||
               locationLower.includes('kitchen') ||
               locationLower.includes('dining') ||
               locationLower.includes('unit')) {
      return 30; // Apartment living areas
    } else {
      // Default
      return 30;
    }
  }

  /**
   * Determine adjustment factor based on location
   * This accounts for duty cycle and other factors that affect energy usage
   * @param location Location of the fixture
   * @returns Adjustment factor
   */
  private determineAdjustmentFactor(location: string = ''): number {
    const locationLower = location.toLowerCase();

    if (locationLower.includes('property manager') ||
        locationLower.includes('office')) {
      return 0.2; // Property manager office - observed from data
    } else if (locationLower.includes('community room')) {
      return 0.1; // Community room - observed from data
    } else if (locationLower.includes('exterior') ||
               locationLower.includes('outdoor') ||
               locationLower.includes('courtyard')) {
      return 0.2; // Exterior lighting
    } else if (locationLower.includes('hallway') ||
               locationLower.includes('lobby') ||
               locationLower.includes('stairwell')) {
      return 0.2; // Common areas
    } else if (locationLower.includes('laundry') ||
               locationLower.includes('utility') ||
               locationLower.includes('electrical') ||
               locationLower.includes('mechanical') ||
               locationLower.includes('telecom')) {
      return 1.0; // Utility rooms - full calculation
    } else {
      // Default - no adjustment
      return 1.0;
    }
  }

  /**
   * Calculate percentages based on raw energy values
   */
  private calculatePercentages(
    components: EndUseComponentDto[]
  ): void {
    // Calculate sum of calculated values
    const totalCalculatedElectric = components.reduce((sum, c) => sum + c.electricKwh, 0);
    const totalCalculatedGas = components.reduce((sum, c) => sum + c.gasTherms, 0);
    const totalCalculatedSteam = components.reduce((sum, c) => sum + c.steamMMBtu, 0);
    const totalCalculatedOther = components.reduce((sum, c) => sum + c.otherMMBtu, 0);

    // Calculate percentages based on calculated totals
    for (const component of components) {
      if (totalCalculatedElectric > 0) {
        component.electricPercent = Math.round((component.electricKwh / totalCalculatedElectric) * 100);
      }

      if (totalCalculatedGas > 0) {
        component.gasPercent = Math.round((component.gasTherms / totalCalculatedGas) * 100);
      }

      if (totalCalculatedSteam > 0) {
        component.steamPercent = Math.round((component.steamMMBtu / totalCalculatedSteam) * 100);
      }

      if (totalCalculatedOther > 0) {
        component.otherPercent = Math.round((component.otherMMBtu / totalCalculatedOther) * 100);
      }
    }
  }

  /**
   * Reconcile calculated energy use with actual utility bills
   */
  private reconcileWithUtilityBills(
    components: EndUseComponentDto[],
    totalElectricKwh: number | null,
    totalGasTherms: number | null,
    totalSteamMMBtu: number | null,
    totalOtherMMBtu: number | null
  ): void {
    // Skip reconciliation if no utility data
    if (
      (totalElectricKwh === null || totalElectricKwh <= 0) &&
      (totalGasTherms === null || totalGasTherms <= 0) &&
      (totalSteamMMBtu === null || totalSteamMMBtu <= 0) &&
      (totalOtherMMBtu === null || totalOtherMMBtu <= 0)
    ) {
      return;
    }

    // Calculate sum of percentages
    const totalElectricPercent = components.reduce((sum, c) => sum + c.electricPercent, 0);
    const totalGasPercent = components.reduce((sum, c) => sum + c.gasPercent, 0);
    const totalSteamPercent = components.reduce((sum, c) => sum + c.steamPercent, 0);
    const totalOtherPercent = components.reduce((sum, c) => sum + c.otherPercent, 0);

    // Adjust percentages to sum to 100%
    this.normalizePercentages(components, 'electricPercent', totalElectricPercent);
    this.normalizePercentages(components, 'gasPercent', totalGasPercent);
    this.normalizePercentages(components, 'steamPercent', totalSteamPercent);
    this.normalizePercentages(components, 'otherPercent', totalOtherPercent);

    // Calculate actual energy use from percentages and total
    for (const component of components) {
      component.electricKwh = (totalElectricKwh !== null && totalElectricKwh > 0) ?
        Math.round((component.electricPercent / 100) * totalElectricKwh) : component.electricKwh;
      component.gasTherms = (totalGasTherms !== null && totalGasTherms > 0) ?
        Math.round((component.gasPercent / 100) * totalGasTherms) : component.gasTherms;
      component.steamMMBtu = (totalSteamMMBtu !== null && totalSteamMMBtu > 0) ?
        Math.round((component.steamPercent / 100) * totalSteamMMBtu) : component.steamMMBtu;
      component.otherMMBtu = (totalOtherMMBtu !== null && totalOtherMMBtu > 0) ?
        Math.round((component.otherPercent / 100) * totalOtherMMBtu) : component.otherMMBtu;
    }
  }

  /**
   * Normalize percentages to sum to 100%
   */
  private normalizePercentages(
    components: EndUseComponentDto[],
    percentField: keyof EndUseComponentDto,
    totalPercent: number
  ): void {
    // Skip if total is zero
    if (totalPercent === 0) {
      return;
    }

    // Adjust if not exactly 100%
    if (totalPercent !== 100) {
      // Find component with largest percentage
      const largestComponent = components.reduce((prev, current) => {
        return (current[percentField] as number) > (prev[percentField] as number) ? current : prev;
      }, components[0]);

      // Adjust largest component to make total 100%
      const adjustment = 100 - totalPercent;
      (largestComponent[percentField] as number) += adjustment;
    }
  }

  /**
   * Apply typical end-use breakdown percentages for specific building type
   * when there's insufficient equipment data
   */
  applyTypicalBreakdown(buildingType: string): EndUseComponentDto[] {
    const components: EndUseComponentDto[] = [];

    this.logger.log(`Applying typical breakdown for building type: ${buildingType}`);

    // For multifamily buildings, use our custom breakdown
    if (buildingType.toLowerCase() === 'multifamily' || buildingType.toLowerCase() === 'apartment') {
      this.logger.log('Using custom multifamily energy breakdown template');

      // Define standard percentages directly for clarity
      const standardPercentages: Record<string, number> = {
        'Heating': 15,
        'Cooling': 15,
        'Ventilation': 5,
        'Lighting': 15,
        'Cooking': 10,
        'Miscellaneous': 5,
        'Water Heating': 20,
        'Laundry': 5,
        'Refrigeration': 5,
        'Elevator': 3,
        'Pool/Spa': 2
      };

      // Create components for each standard category
      for (const [name, percent] of Object.entries(standardPercentages)) {
        components.push({
          name,
          electricPercent: percent,
          gasPercent: 0,
          steamPercent: 0,
          otherPercent: 0,
          electricKwh: 0,
          gasTherms: 0,
          steamMMBtu: 0,
          otherMMBtu: 0,
          standardPercent: percent
        });
      }

      // Adjust gas percentages for heating and water heating
      const heatingComponent = components.find(c => c.name === 'Heating');
      if (heatingComponent) {
        heatingComponent.gasPercent = 80; // 80% of gas usage is for heating
        heatingComponent.electricPercent = 5; // 5% of electric usage is for heating
      }

      const waterHeatingComponent = components.find(c => c.name === 'Water Heating');
      if (waterHeatingComponent) {
        waterHeatingComponent.gasPercent = 20; // 20% of gas usage is for water heating
      }

      return components;
    }

    // For other building types, use the existing logic
    switch (buildingType.toLowerCase()) {
      case 'office':
        components.push({ name: 'Lighting', electricPercent: 24, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Cooling', electricPercent: 25, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Heating', electricPercent: 0, gasPercent: 37, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Water Heating', electricPercent: 0, gasPercent: 58, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Refrigeration', electricPercent: 26, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Office Equipment', electricPercent: 9, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Cooking', electricPercent: 7, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Ventilation', electricPercent: 5, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Motors/Pumps', electricPercent: 2, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Laundry', electricPercent: 1, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Other', electricPercent: 1, gasPercent: 5, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        break;

      case 'office':
        components.push({ name: 'Lighting', electricPercent: 33, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Cooling', electricPercent: 18, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Heating', electricPercent: 0, gasPercent: 75, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Office Equipment', electricPercent: 28, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Ventilation', electricPercent: 12, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Water Heating', electricPercent: 0, gasPercent: 22, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Elevator', electricPercent: 3, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Refrigeration', electricPercent: 2, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Other', electricPercent: 4, gasPercent: 3, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        break;

      default:
        // Generic breakdown for unknown building types
        components.push({ name: 'Lighting', electricPercent: 25, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Cooling', electricPercent: 20, gasPercent: 0, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Heating', electricPercent: 10, gasPercent: 70, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Water Heating', electricPercent: 5, gasPercent: 20, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        components.push({ name: 'Other', electricPercent: 40, gasPercent: 10, steamPercent: 0, otherPercent: 0, electricKwh: 0, gasTherms: 0, steamMMBtu: 0, otherMMBtu: 0 });
        break;
    }

    return components;
  }
}
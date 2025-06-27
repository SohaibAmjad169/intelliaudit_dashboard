import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { FieldNotesRepository } from '../repositories/field-notes.repository';
import { FieldNotesModel } from '../models/field-notes.model';
import { CreateFieldNotesDto } from '../dto/create-field-notes.dto';
import { FieldNotesResponseDto, GetFieldNotesResponseDto, EquipmentItemDto, BuildingInfoDto } from '../dto/field-notes-response.dto';

@Injectable()
export class FieldNotesService {
  private readonly logger = new Logger(FieldNotesService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly fieldNotesRepo: FieldNotesRepository,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiKey) {
      throw new Error('OpenAI API key is missing');
    }

    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  // ... (processAllFieldNotes, processFieldNotes, getFieldNotes, extractBuildingInfoFromEquipment methods remain the same) ...
  async processAllFieldNotes(dto: CreateFieldNotesDto): Promise<FieldNotesResponseDto> {
    this.logger.log(`Processing field notes for all equipment types in a single call...`);

    // Process all equipment types at once with a unified prompt
    // Pass 'all' as the equipmentType
    const result = await this.processFieldNotes(dto, 'all');

    this.logger.log(`Completed processing field notes for all equipment types. Found ${result.equipment.length} equipment items.`);

    return result;
  }

  async processFieldNotes(dto: CreateFieldNotesDto, equipmentType: string = 'lighting'): Promise<FieldNotesResponseDto> {
    const startTime = Date.now();

    try {
      // Convert payload to notes if provided, otherwise use dto.notes
      const rawInputText = (
        dto.formPayload ? this.payloadToNotes(dto.formPayload)
                        : (dto.notes || '')
      ).trim();

      if (!rawInputText.trim()) {
        throw new BadRequestException('Field notes or payload cannot be empty.');
      }

      // Create and validate field notes model using the processed text
      const fieldNotesModel = new FieldNotesModel({
        notes: rawInputText, // Use the possibly converted notes
        projectId: dto.projectId,
        model: dto.model || 'gpt-4o' // Default model if not provided
      });

      fieldNotesModel.validate();

      // Preprocess notes to optimize for token usage
      const preprocessedNotes = fieldNotesModel.preprocessNotes();

      // Process field notes with OpenAI
      const aiResult = await this.processWithOpenAI(
        preprocessedNotes,
        fieldNotesModel.model,
        equipmentType // Pass the specific equipment type or 'all'
      );

      // Process the extracted equipment data using our internal logic
      // This step applies standardized calculations and logic regardless of AI output
      const processedEquipment = this.processEquipmentData(aiResult.equipment || [], equipmentType);

      // Add processed equipment to the model
      if (processedEquipment && processedEquipment.length > 0) {
        fieldNotesModel.addEquipment(processedEquipment);
      }

      // Add building info if available from AI result, otherwise use default/extracted
      let finalBuildingInfo = aiResult.building_info;
      if (!finalBuildingInfo) {
        finalBuildingInfo = this.extractBuildingInfoFromEquipment(processedEquipment);
      } else {
        // Ensure essential fields have defaults if missing from AI
        if (!finalBuildingInfo.type) finalBuildingInfo.type = 'Multifamily'; // Default type
        if (!finalBuildingInfo.floors) finalBuildingInfo.floors = this.estimateFloorCount(processedEquipment);
      }

      if (finalBuildingInfo) {
        fieldNotesModel.setBuildingInfo(finalBuildingInfo);
      }


      // Update metadata
      const processingTimeMs = Date.now() - startTime;
      fieldNotesModel.updateMetadata({
        processingTimeMs,
        processedAt: new Date().toISOString()
      });

      // Calculate confidence score
      fieldNotesModel.calculateConfidence();

      // Save data to database in a transaction
      if (fieldNotesModel.equipment.length > 0) {
        await this.fieldNotesRepo.processFieldNotesTransaction(
          fieldNotesModel.projectId,
          fieldNotesModel.notes,
          fieldNotesModel.equipment,
          fieldNotesModel.model
        );
      } else {
        // Just save raw notes if no equipment was extracted or processed
        await this.fieldNotesRepo.saveRawNotes(
          fieldNotesModel.projectId,
          fieldNotesModel.notes
        );
        this.logger.warn(`No equipment data extracted or processed for project ${fieldNotesModel.projectId}. Saving raw notes only.`);
      }

      // Log energy breakdown if equipment was processed
      if (fieldNotesModel.equipment.length > 0) {
        this.logEnergyBreakdownByLocationType(fieldNotesModel.equipment);
      }

      return fieldNotesModel.toResponseDto();
    } catch (error) {
      this.logger.error(`Error processing field notes (Type: ${equipmentType}): ${error.message}`, error.stack);

      // Return an error response DTO
      return {
        equipment: [],
        building_info: undefined, // No building info on error
        flags: [{
          type: 'error',
          message: `Failed to process field notes: ${error.message}`,
          severity: 'error'
        }],
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          confidence: 0 // Low confidence on error
        }
      };
    }
  }

  async getFieldNotes(projectId: string): Promise<GetFieldNotesResponseDto> {
    try {
      // Get raw notes
      const rawNotes = await this.fieldNotesRepo.getRawNotes(projectId);

      // Get equipment
      const equipment = await this.fieldNotesRepo.getEquipmentByProject(projectId);

      // In a real application, building info might be stored separately.
      // Here, we derive it or use a default if needed.
      const buildingInfo = this.extractBuildingInfoFromEquipment(equipment);

      return {
        raw_notes: rawNotes || undefined, // Return undefined if null/empty
        equipment: equipment || [],       // Return empty array if null
        building_info: buildingInfo      // Use extracted/default building info
      };
    } catch (error) {
      this.logger.error(`Error getting field notes for project ${projectId}: ${error.message}`, error.stack);
      // Throwing here might be appropriate depending on API design
      throw new BadRequestException(`Failed to get field notes for project ${projectId}: ${error.message}`);
    }
  }

  private extractBuildingInfoFromEquipment(equipment: EquipmentItemDto[]): BuildingInfoDto | undefined {
    if (!equipment || equipment.length === 0) {
      // Cannot determine info without equipment data
      this.logger.warn('Cannot extract building info: No equipment data available.');
      return undefined;
    }

    // Estimate floors based on location data
    const estimatedFloors = this.estimateFloorCount(equipment);

    // Basic placeholder logic - enhance as needed
    // Could potentially infer type based on equipment patterns (e.g., many identical units suggest Multifamily)
    const buildingType = 'Multifamily'; // Default assumption

    // Could try to estimate total units based on patterns if needed, but risky.
    // For now, leave total_units potentially undefined unless explicitly set elsewhere.

    this.logger.log(`Extracted fallback building info: Type=${buildingType}, Floors=${estimatedFloors}`);

    return {
      type: buildingType,
      floors: estimatedFloors,
      unit_types: false, // Set to false as per DTO definition
      // total_units: undefined // Leave undefined unless we have a reliable way to estimate
    };
  }

  // ... (processEquipmentData, processSingleLightingItem, processSingleHvacItem methods remain the same) ...
  private processEquipmentData(equipmentData: EquipmentItemDto[], equipmentType: string = 'lighting'): EquipmentItemDto[] {
    if (!equipmentData || equipmentData.length === 0) {
      return [];
    }

    const processedItems: EquipmentItemDto[] = [];

    for (const item of equipmentData) {
      // Determine the actual type of the item, falling back to the requested type
      const itemType = (item.category || item.equipment_type || equipmentType).toLowerCase();

      let processedItem: EquipmentItemDto | null = null;

      // Route to the correct processing function based on item's type
      if (itemType.includes('lighting')) {
        processedItem = this.processSingleLightingItem(item);
      } else if (itemType.includes('hvac') || itemType.includes('cooling') || itemType.includes('heating') || itemType.includes('ventilation')) {
        processedItem = this.processSingleHvacItem(item);
      } else if (itemType.includes('pump') || itemType.includes('motor') || itemType.includes('pumps/motors')) {
        processedItem = this.processSinglePumpMotorItem(item);
      } else if (itemType.includes('dhw') || itemType.includes('water heat') || itemType.includes('hot water')) {
        processedItem = this.processSingleDhwItem(item);
      }
      else {
        // If type is 'all' and item type is unknown/other, keep it as is but log warning
        if (equipmentType.toLowerCase() === 'all') {
            this.logger.warn(`Processing item with unknown/unhandled type '${itemType}': ${JSON.stringify(item)}. Keeping original data.`);
            processedItem = item; // Keep original item if type is unknown during 'all' processing
        } else {
            this.logger.warn(`Skipping item with unrecognized type '${itemType}' during processing for requested type '${equipmentType}'. Item: ${JSON.stringify(item)}`);
        }
      }

      if (processedItem) {
        processedItems.push(processedItem);
      }
    }

    this.logger.log(`Processed ${processedItems.length} equipment items for type '${equipmentType}'.`);
    return processedItems;
  }

  private processSingleLightingItem(item: EquipmentItemDto): EquipmentItemDto {
    // Ensure quantity is a valid number, default to 1 if missing/invalid
    const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity :
                     (typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : 1);
    if (isNaN(quantity) || quantity <= 0) {
        this.logger.warn(`Invalid or missing quantity for lighting item at '${item.location}'. Defaulting to 1. Original value: ${item.quantity}`);
        item.quantity = 1;
    } else {
        item.quantity = quantity;
    }


    // Ensure lamps_per_fixture is a valid number, default to 1
    const lampsPerFixture = typeof item.lamps_per_fixture === 'number' && item.lamps_per_fixture > 0 ? item.lamps_per_fixture :
                            (typeof item.lamps_per_fixture === 'string' ? parseFloat(item.lamps_per_fixture) : 1);
     if (isNaN(lampsPerFixture) || lampsPerFixture <= 0) {
        this.logger.warn(`Invalid or missing lamps_per_fixture for lighting item at '${item.location}'. Defaulting to 1. Original value: ${item.lamps_per_fixture}`);
        item.lamps_per_fixture = 1;
    } else {
         item.lamps_per_fixture = lampsPerFixture;
    }

    // Calculate number_of_lamps if not provided or invalid
    let numberOfLamps = item.number_of_lamps;
    if (typeof numberOfLamps !== 'number' || numberOfLamps <= 0) {
      numberOfLamps = Math.round(item.quantity * item.lamps_per_fixture);
      this.logger.debug(`Calculated number_of_lamps for ${item.location}: ${item.quantity} fixtures × ${item.lamps_per_fixture} lamps/fixture = ${numberOfLamps} total lamps`);
    }
    item.number_of_lamps = numberOfLamps;


    // Standardize wattage values based on lamp type if not explicitly provided or invalid
    let wattage = typeof item.wattage === 'number' && item.wattage > 0 ? item.wattage :
                  (typeof item.wattage === 'string' ? parseFloat(item.wattage) : 0);

    if (isNaN(wattage) || wattage <= 0) {
      wattage = 0; // Reset wattage if invalid
      if (item.lamp_type) {
        const lampTypeLower = item.lamp_type.toLowerCase();
        if (lampTypeLower.includes('led')) wattage = 9.5;
        else if (lampTypeLower.includes('cfl')) wattage = item.location?.toLowerCase().includes('bathroom') ? 23 : 13;
        else if (lampTypeLower.includes('t8') || lampTypeLower.includes('t-8')) wattage = 32;
        else if (lampTypeLower.includes('incandescent')) wattage = 25;
        else wattage = 10; // Default guess if type unknown

        this.logger.debug(`Estimated wattage for ${item.lamp_type} at ${item.location}: ${wattage}W`);
      } else {
         this.logger.warn(`Could not determine wattage for lighting item at '${item.location}' - wattage missing/invalid and no lamp_type provided. Setting wattage to 0.`);
         wattage = 0; // Ensure it's 0 if un-determinable
      }
    }
    item.wattage = wattage;


    // Determine weekly hours based on location if not specified or invalid
    let weeklyHours = typeof item.weekly_hours === 'number' && item.weekly_hours > 0 ? item.weekly_hours :
                      (typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours) : 0);

    if (isNaN(weeklyHours) || weeklyHours <= 0) {
      weeklyHours = this.determineWeeklyHours(item.location);
      this.logger.debug(`Determined weekly hours for ${item.location}: ${weeklyHours} hrs/week`);
    }
     item.weekly_hours = weeklyHours;


    // Calculate annual kWh using our standardized formula
    let annualKwh = 0;
    const totalLamps = item.number_of_lamps || 0; // Use calculated/provided number_of_lamps
    const calculatedWattage = item.wattage || 0; // Use determined wattage

    if (totalLamps > 0 && calculatedWattage > 0 && item.weekly_hours > 0) {
      const adjustmentFactor = this.determineAdjustmentFactor(item.location);
      // Formula: (Total Lamps × Watts per Lamp × Weekly Hours × 52 weeks × Adjustment Factor) / 1000
      annualKwh = Math.round((totalLamps * calculatedWattage * item.weekly_hours * 52 * adjustmentFactor) / 1000);

      this.logger.debug(`Calculated annual kWh for ${item.location}: ${totalLamps} lamps × ${calculatedWattage}W × ${item.weekly_hours} hrs/week × 52 weeks × ${adjustmentFactor} adj ÷ 1000 = ${annualKwh} kWh/year`);
    } else {
      this.logger.warn(`Could not calculate annual kWh for ${item.location}: missing/invalid values. totalLamps=${totalLamps}, wattage=${calculatedWattage}, weeklyHours=${item.weekly_hours}`);
    }

    // Always save our calculated value, ignoring any AI-provided value for annual_kwh
    item.annual_kwh = annualKwh;

    // Determine control strategy and mounting type based on location if not provided
    const controlStrategy = item.control_strategy || this.determineControlStrategy(item.location);
    const mountingType = item.mounting_type || this.determineMountingType(item.location);

    // Return the fully processed item with standardized fields
    return {
      ...item,
      equipment_type: item.equipment_type || 'Lighting', // Default if missing
      category: 'Lighting', // Standardize category
      energy_source: 'Electricity', // Lighting is electric
      quantity: item.quantity, // Use validated quantity
      lamps_per_fixture: item.lamps_per_fixture, // Use validated lamps_per_fixture
      number_of_lamps: item.number_of_lamps, // Use calculated/validated number_of_lamps
      wattage: item.wattage, // Use validated/estimated wattage
      weekly_hours: item.weekly_hours, // Use validated/determined hours
      annual_kwh: item.annual_kwh, // Use calculated kWh
      end_use_category: 'Lighting', // Standardize end use
      control_strategy: controlStrategy, // Use determined/provided control
      mounting_type: mountingType, // Use determined/provided mounting
    };
  }

  private processSingleHvacItem(item: EquipmentItemDto): EquipmentItemDto {
      // Ensure quantity is a valid number, default to 1
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity :
                       (typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : 1);
       if (isNaN(quantity) || quantity <= 0) {
            this.logger.warn(`Invalid or missing quantity for HVAC item '${item.equipment_type}' at '${item.location}'. Defaulting to 1. Original value: ${item.quantity}`);
            item.quantity = 1;
        } else {
            item.quantity = quantity;
        }

      // Determine end use category based on equipment type if not provided
      let endUseCategory = item.end_use_category;
      if (!endUseCategory && item.equipment_type) {
        const equipTypeLower = item.equipment_type.toLowerCase();
        if (equipTypeLower.includes('heat') || equipTypeLower.includes('furnace') || equipTypeLower.includes('boiler')) {
          endUseCategory = 'Heating';
        } else if (equipTypeLower.includes('cool') || equipTypeLower.includes('ac') || equipTypeLower.includes('chiller')) {
          endUseCategory = 'Cooling';
        } else if (equipTypeLower.includes('ventilation') || equipTypeLower.includes('fan') || equipTypeLower.includes('erv') || equipTypeLower.includes('hrv')) {
          endUseCategory = 'Ventilation';
        } else {
            endUseCategory = 'HVAC General'; // Fallback if type is ambiguous
             this.logger.debug(`Could not determine specific end use for HVAC type '${item.equipment_type}'. Using '${endUseCategory}'.`);
        }
      } else if (!endUseCategory) {
          endUseCategory = 'HVAC General'; // Fallback if type is also missing
          this.logger.warn(`Missing equipment_type and end_use_category for HVAC item at '${item.location}'. Using '${endUseCategory}'.`);
      }
      item.end_use_category = endUseCategory;


      // Determine energy source based on fuel type if not provided
      let energySource = item.energy_source;
      if (!energySource) {
          if (item.fuel_type) {
            const fuelTypeLower = item.fuel_type.toLowerCase();
            if (fuelTypeLower.includes('gas') || fuelTypeLower.includes('natural')) {
              energySource = 'Gas';
            } else if (fuelTypeLower.includes('electric')) {
               energySource = 'Electricity';
            } else {
                // Assume Electricity if fuel type is unknown/other, but could be Gas too. Needs better logic maybe.
                energySource = 'Electricity';
                this.logger.debug(`Assuming 'Electricity' as energy source for HVAC item with fuel type '${item.fuel_type}' at '${item.location}'.`);
            }
          } else {
             // If no fuel type, assume Electricity for AC/Heat Pumps, potentially Gas for Furnaces/Boilers
             const equipTypeLower = (item.equipment_type || '').toLowerCase();
             if (equipTypeLower.includes('furnace') || equipTypeLower.includes('boiler')){
                 energySource = 'Gas'; // Common default for these
                 this.logger.debug(`Assuming 'Gas' energy source for '${item.equipment_type}' at '${item.location}' as fuel_type is missing.`);
             } else {
                 energySource = 'Electricity'; // Default for others (AC, HP, Fans)
                 this.logger.debug(`Assuming 'Electricity' energy source for '${item.equipment_type}' at '${item.location}' as fuel_type is missing.`);
             }
          }
      }
       item.energy_source = energySource;

      // Determine weekly hours based on location/type if not specified or invalid
      let weeklyHours = typeof item.weekly_hours === 'number' && item.weekly_hours > 0 ? item.weekly_hours :
                        (typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours) : 0);
      if (isNaN(weeklyHours) || weeklyHours <= 0) {
        const locationLower = (item.location || '').toLowerCase();
        const equipTypeLower = (item.equipment_type || '').toLowerCase();

        if (locationLower.includes('mechanical') || locationLower.includes('boiler room') || equipTypeLower.includes('boiler')) {
          weeklyHours = 168; // 24/7 operation likely
        } else if (locationLower.includes('common') || locationLower.includes('hallway') || locationLower.includes('lobby') || equipTypeLower.includes('rtu')) {
          weeklyHours = 77; // Common areas/RTUs often run longer
        } else if (locationLower.includes('office') || locationLower.includes('amenity') || locationLower.includes('community')) {
          weeklyHours = 50; // Office/amenity spaces
        } else {
          weeklyHours = 40; // Default assumption for apartment units or unknown context
        }
        this.logger.debug(`Estimated weekly hours for ${item.equipment_type || 'HVAC'} at ${item.location}: ${weeklyHours} hours/week`);
      }
      item.weekly_hours = weeklyHours;
      const annualHours = item.weekly_hours * 52;
      item.annual_hours = annualHours; // Store calculated annual hours


      // Estimate wattage if not provided or invalid, based on capacity or type
      let wattage = typeof item.wattage === 'number' && item.wattage > 0 ? item.wattage :
                    (typeof item.wattage === 'string' ? parseFloat(item.wattage) : 0);

      if (isNaN(wattage) || wattage <= 0) {
          wattage = 0; // Reset if invalid
          const coolingCapacity = typeof item.cooling_capacity_tons === 'number' ? item.cooling_capacity_tons : parseFloat(item.cooling_capacity_tons || '0');
          const heatingCapacity = typeof item.heating_capacity_mbh === 'number' ? item.heating_capacity_mbh : parseFloat(item.heating_capacity_mbh || '0');

          if (item.end_use_category === 'Cooling' && coolingCapacity > 0) {
            // 1 ton cooling ≈ 1000 watts (or slightly more depending on SEER/EER)
            wattage = coolingCapacity * 1000;
            this.logger.debug(`Estimated wattage for cooling: ${coolingCapacity} tons × 1000W/ton = ${wattage}W`);
          } else if (item.end_use_category === 'Heating') {
              if (item.energy_source === 'Gas' && heatingCapacity > 0) {
                 // Gas heating primarily uses fuel, estimate electrical for fan/controls
                 wattage = 500; // Typical fan motor wattage for residential/light commercial furnace
                 this.logger.debug(`Estimated electrical wattage for Gas heating (${heatingCapacity} MBH): ${wattage}W (fan/controls)`);
              } else if (item.energy_source === 'Electricity' && heatingCapacity > 0) {
                 // Electric heating: 1 MBH ≈ 293 watts
                 wattage = heatingCapacity * 293;
                 this.logger.debug(`Estimated wattage for electric heating: ${heatingCapacity} MBH × 293W/MBH = ${wattage}W`);
              }
          } else if (item.end_use_category === 'Ventilation') {
             // Estimate wattage for fans/ventilation
             wattage = 300; // Generic estimate for ventilation fans
             this.logger.debug(`Estimated wattage for Ventilation: ${wattage}W`);
          }

          // Default guess if still zero
          if (wattage <= 0) {
              wattage = 1000; // Default guess if capacity/type info is insufficient
              this.logger.warn(`Could not estimate wattage for HVAC item '${item.equipment_type}' at '${item.location}'. Using default guess: ${wattage}W`);
          }
      }
       item.wattage = wattage;


      // Calculate annual kWh (electricity) and/or annual Therms (gas)
      let annualKwh = 0;
      let annualTherms = 0;

      if (item.quantity > 0 && item.annual_hours > 0) {
           if (item.energy_source === 'Electricity' && item.wattage > 0) {
                // Calculate kWh for electric components
                annualKwh = Math.round((item.wattage * item.quantity * item.annual_hours) / 1000);
                this.logger.debug(`Calculated annual kWh for electric HVAC: ${item.wattage}W × ${item.quantity} units × ${item.annual_hours} hrs/yr ÷ 1000 = ${annualKwh} kWh/year`);
           } else if (item.energy_source === 'Gas') {
                const heatingCapacity = typeof item.heating_capacity_mbh === 'number' ? item.heating_capacity_mbh : parseFloat(item.heating_capacity_mbh || '0');
                if (item.end_use_category === 'Heating' && heatingCapacity > 0) {
                    // Estimate annual therms based on heating capacity (MBH) and annual hours
                    // Formula: MBH × 0.01 therms/MBH/hr (approx conversion) × annual hours × quantity
                    // This is a rough estimate, real usage depends heavily on climate, thermostat settings, efficiency (AFUE)
                    // A better estimate might use AFUE: Therms = (MBH * 1000 BTU/MBH * annual_hours) / (AFUE * 100,000 BTU/therm)
                    // Handle the case where efficiency might be a string or an object with afue property
                    let afue = 0.80; // Default 80% AFUE if unknown
                    
                    // Use a type assertion to help TypeScript understand the structure
                    if (item.efficiency && typeof item.efficiency === 'object' && 'afue' in item.efficiency) {
                      const effObj = item.efficiency as { afue: number };
                      if (typeof effObj.afue === 'number' && effObj.afue > 0) {
                        afue = effObj.afue;
                      }
                    }
                    if (afue > 0) {
                       annualTherms = Math.round((heatingCapacity * 1000 * item.annual_hours * item.quantity) / (afue * 100000));
                       this.logger.debug(`Estimated annual therms for Gas heating: (${heatingCapacity} MBH × 1000 BTU/MBH × ${item.annual_hours} hrs × ${item.quantity} units) / (${afue.toFixed(2)} AFUE × 100,000 BTU/therm) = ${annualTherms} therms/year`);
                    } else {
                        annualTherms = Math.round(heatingCapacity * 0.01 * item.annual_hours * item.quantity); // Simpler fallback estimate
                         this.logger.debug(`Estimated annual therms for Gas heating (fallback): ${heatingCapacity} MBH × 0.01 therms/MBH/hr × ${item.annual_hours} hrs × ${item.quantity} units = ${annualTherms} therms/year`);
                    }

                }
                 // Also calculate kWh for the electrical components (fan/controls) of gas systems
                 const electricalWattage = item.wattage > 0 ? item.wattage : 500; // Use provided wattage if available, else estimate fan wattage
                 annualKwh = Math.round((electricalWattage * item.quantity * item.annual_hours) / 1000);
                 this.logger.debug(`Calculated annual kWh for Gas HVAC (electrical components): ${electricalWattage}W × ${item.quantity} units × ${item.annual_hours} hrs/yr ÷ 1000 = ${annualKwh} kWh/year`);
           }
      } else {
          this.logger.warn(`Could not calculate annual energy for HVAC item '${item.equipment_type}' at ${item.location}: missing/invalid values. Quantity=${item.quantity}, AnnualHours=${item.annual_hours}, Wattage=${item.wattage}, EnergySource=${item.energy_source}`);
      }


      // Always save our calculated values, ignoring any AI-provided energy values
      item.annual_kwh = annualKwh;
      item.annual_therms = annualTherms; // Add therms if calculated


      // Return the fully processed item
      return {
        ...item,
        category: item.category || 'HVAC', // Standardize category
        quantity: item.quantity, // Use validated quantity
        weekly_hours: item.weekly_hours, // Use validated/determined hours
        annual_hours: item.annual_hours, // Use calculated annual hours
        wattage: item.wattage, // Use validated/estimated wattage
        annual_kwh: item.annual_kwh, // Use calculated kWh
        annual_therms: item.annual_therms, // Use calculated Therms
        end_use_category: item.end_use_category, // Use determined end use
        energy_source: item.energy_source, // Use determined energy source
      };
  }

  private processSinglePumpMotorItem(item: EquipmentItemDto): EquipmentItemDto {
    // Ensure quantity is a valid number, default to 1
    const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity :
                     (typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : 1);
    if (isNaN(quantity) || quantity <= 0) {
      this.logger.warn(`Invalid or missing quantity for Pump/Motor item '${item.equipment_type}' at '${item.location}'. Defaulting to 1. Original value: ${item.quantity}`);
      item.quantity = 1;
    } else {
      item.quantity = quantity;
    }

    // Determine end use category based on equipment type if not provided
    let endUseCategory = item.end_use_category;
    if (!endUseCategory) {
      const equipTypeLower = (item.equipment_type || '').toLowerCase();
      if (equipTypeLower.includes('circulation') || equipTypeLower.includes('circulator')) {
        endUseCategory = 'Circulation';
      } else if (equipTypeLower.includes('booster')) {
        endUseCategory = 'Water Pressure';
      } else if (equipTypeLower.includes('sump')) {
        endUseCategory = 'Drainage';
      } else {
        endUseCategory = 'Motors/Pumps'; // Default category
        this.logger.debug(`Using default end use category 'Motors/Pumps' for '${item.equipment_type}' at '${item.location}'.`);
      }
    }
    item.end_use_category = endUseCategory;

    // Set energy source to Electricity (most pumps/motors are electric)
    item.energy_source = item.energy_source || 'Electricity';

    // Determine weekly hours based on application and location
    let weeklyHours = typeof item.weekly_hours === 'number' && item.weekly_hours > 0 ? item.weekly_hours :
                      (typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours) : 0);
    if (isNaN(weeklyHours) || weeklyHours <= 0) {
      const locationLower = (item.location || '').toLowerCase();
      const equipTypeLower = (item.equipment_type || '').toLowerCase();
      const applicationLower = (item.application || '').toLowerCase();

      if (applicationLower.includes('continuous') || 
          equipTypeLower.includes('sump') || 
          locationLower.includes('mechanical') || 
          locationLower.includes('boiler room')) {
        weeklyHours = 168; // 24/7 operation for continuous duty pumps
      } else if (applicationLower.includes('heating') || applicationLower.includes('cooling')) {
        weeklyHours = 77; // Heating/cooling circulation pumps
      } else if (applicationLower.includes('domestic') || applicationLower.includes('water')) {
        weeklyHours = 50; // Domestic water circulation
      } else {
        weeklyHours = 40; // Default assumption
      }
      this.logger.debug(`Estimated weekly hours for ${item.equipment_type || 'Pump/Motor'} at ${item.location}: ${weeklyHours} hours/week`);
    }
    item.weekly_hours = weeklyHours;
    const annualHours = item.weekly_hours * 52;
    item.annual_hours = annualHours;

    // Estimate wattage based on horsepower if not provided
    let wattage = typeof item.wattage === 'number' && item.wattage > 0 ? item.wattage :
                  (typeof item.wattage === 'string' ? parseFloat(item.wattage) : 0);

    if (isNaN(wattage) || wattage <= 0) {
      // Try to get horsepower from either dedicated field
      const horsepower = typeof item.horsepower === 'number' ? item.horsepower : 
                        (typeof item.horsepower === 'string' ? parseFloat(item.horsepower) : 
                        (typeof item.motor_hp === 'number' ? item.motor_hp : 
                        (typeof item.motor_hp === 'string' ? parseFloat(item.motor_hp) : 0)));

      if (horsepower > 0) {
        // Convert HP to Watts: 1 HP ≈ 746 Watts
        wattage = horsepower * 746;
        this.logger.debug(`Estimated wattage from horsepower: ${horsepower} HP × 746W/HP = ${wattage}W`);
      } else {
        // Estimate based on application if HP not available
        const equipTypeLower = (item.equipment_type || '').toLowerCase();
        const applicationLower = (item.application || '').toLowerCase();

        if (equipTypeLower.includes('circulator') || applicationLower.includes('small')) {
          wattage = 100; // Small circulator pumps
        } else if (equipTypeLower.includes('sump')) {
          wattage = 300; // Typical sump pump
        } else if (applicationLower.includes('booster') || applicationLower.includes('pressure')) {
          wattage = 750; // Water pressure booster
        } else {
          wattage = 500; // Default guess
        }
        this.logger.debug(`Estimated wattage for ${item.equipment_type || 'Pump/Motor'} based on type/application: ${wattage}W`);
      }
    }
    item.wattage = wattage;

    // Calculate annual kWh
    let annualKwh = 0;
    if (item.quantity > 0 && item.annual_hours > 0 && item.wattage > 0) {
      annualKwh = Math.round((item.wattage * item.quantity * item.annual_hours) / 1000);
      this.logger.debug(`Calculated annual kWh for ${item.equipment_type || 'Pump/Motor'}: ${item.wattage}W × ${item.quantity} units × ${item.annual_hours} hrs/yr ÷ 1000 = ${annualKwh} kWh/year`);
    } else {
      this.logger.warn(`Could not calculate annual kWh for ${item.equipment_type || 'Pump/Motor'} at ${item.location}: missing/invalid values.`);
    }

    // Always save our calculated value
    item.annual_kwh = annualKwh;

    // Return the fully processed item
    return {
      ...item,
      category: item.category || 'Pumps/Motors', // Standardize category
      quantity: item.quantity,
      weekly_hours: item.weekly_hours,
      annual_hours: item.annual_hours,
      wattage: item.wattage,
      annual_kwh: item.annual_kwh,
      end_use_category: item.end_use_category,
      energy_source: item.energy_source,
    };
  }

  private processSingleDhwItem(item: EquipmentItemDto): EquipmentItemDto {
    // Ensure quantity is a valid number, default to 1
    const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity :
                     (typeof item.quantity === 'string' ? parseInt(item.quantity, 10) : 1);
    if (isNaN(quantity) || quantity <= 0) {
      this.logger.warn(`Invalid or missing quantity for DHW item '${item.equipment_type}' at '${item.location}'. Defaulting to 1. Original value: ${item.quantity}`);
      item.quantity = 1;
    } else {
      item.quantity = quantity;
    }

    // Set end use category to Water Heating
    item.end_use_category = item.end_use_category || 'Water Heating';

    // Determine energy source based on equipment type if not provided
    let energySource = item.energy_source;
    if (!energySource) {
      const equipTypeLower = (item.equipment_type || '').toLowerCase();
      if (equipTypeLower.includes('gas') || equipTypeLower.includes('natural')) {
        energySource = 'Gas';
      } else if (equipTypeLower.includes('electric')) {
        energySource = 'Electricity';
      } else if (equipTypeLower.includes('heat pump')) {
        energySource = 'Electricity';
      } else {
        // Default assumption - most water heaters are gas in multifamily
        energySource = 'Gas';
        this.logger.debug(`Assuming 'Gas' as energy source for DHW item '${item.equipment_type}' at '${item.location}'.`);
      }
    }
    item.energy_source = energySource;

    // Determine weekly hours
    let weeklyHours = typeof item.weekly_hours === 'number' && item.weekly_hours > 0 ? item.weekly_hours :
                      (typeof item.weekly_hours === 'string' ? parseFloat(item.weekly_hours) : 0);
    if (isNaN(weeklyHours) || weeklyHours <= 0) {
      const locationLower = (item.location || '').toLowerCase();

      if (locationLower.includes('mechanical') || locationLower.includes('boiler room')) {
        weeklyHours = 168; // 24/7 operation for central systems
      } else if (locationLower.includes('common')) {
        weeklyHours = 77; // Common area water heaters
      } else {
        weeklyHours = 40; // In-unit water heaters (typical usage)
      }
      this.logger.debug(`Estimated weekly hours for ${item.equipment_type || 'DHW'} at ${item.location}: ${weeklyHours} hours/week`);
    }
    item.weekly_hours = weeklyHours;
    const annualHours = item.weekly_hours * 52;
    item.annual_hours = annualHours;

    // Estimate wattage for electrical components
    let wattage = typeof item.wattage === 'number' && item.wattage > 0 ? item.wattage :
                  (typeof item.wattage === 'string' ? parseFloat(item.wattage) : 0);

    if (isNaN(wattage) || wattage <= 0) {
      if (item.energy_source === 'Electricity') {
        // Try to get input BTU rating and convert to watts
        const inputBtuPerHour = typeof item.input_btu_per_hour === 'number' ? item.input_btu_per_hour :
                              (typeof item.input_btu_per_hour === 'string' ? parseFloat(item.input_btu_per_hour) : 0);

        if (inputBtuPerHour > 0) {
          // Convert BTU/hr to Watts: 1 BTU/hr ≈ 0.293 Watts
          wattage = inputBtuPerHour * 0.293;
          this.logger.debug(`Estimated wattage from BTU input: ${inputBtuPerHour} BTU/hr × 0.293W/BTU/hr = ${wattage}W`);
        } else {
          // Estimate based on capacity if available
          const gallons = typeof item.capacity_gallons === 'number' ? item.capacity_gallons :
                        (typeof item.capacity_gallons === 'string' ? parseFloat(item.capacity_gallons) : 0);

          if (gallons > 0) {
            // Rough estimate based on tank size
            if (gallons <= 30) wattage = 3500;
            else if (gallons <= 50) wattage = 4500;
            else wattage = 5500;
            this.logger.debug(`Estimated wattage for ${gallons} gallon electric water heater: ${wattage}W`);
          } else {
            // Default for electric water heater
            wattage = 4500;
            this.logger.debug(`Using default wattage for electric water heater: ${wattage}W`);
          }
        }
      } else if (item.energy_source === 'Gas') {
        // For gas water heaters, estimate electrical usage for controls/ignition
        wattage = 100; // Typical electrical usage for gas water heater controls
        this.logger.debug(`Estimated electrical wattage for gas water heater controls: ${wattage}W`);
      }
    }
    item.wattage = wattage;

    // Calculate annual kWh (electricity)
    let annualKwh = 0;
    let annualTherms = 0;

    if (item.quantity > 0 && item.annual_hours > 0) {
      if (item.energy_source === 'Electricity' && item.wattage > 0) {
        annualKwh = Math.round((item.wattage * item.quantity * item.annual_hours) / 1000);
        this.logger.debug(`Calculated annual kWh for electric water heater: ${item.wattage}W × ${item.quantity} units × ${item.annual_hours} hrs/yr ÷ 1000 = ${annualKwh} kWh/year`);
      } else if (item.energy_source === 'Gas') {
        // Calculate electrical usage for controls
        annualKwh = Math.round((item.wattage * item.quantity * item.annual_hours) / 1000);

        // Estimate gas usage in therms
        const inputBtuPerHour = typeof item.input_btu_per_hour === 'number' ? item.input_btu_per_hour :
                              (typeof item.input_btu_per_hour === 'string' ? parseFloat(item.input_btu_per_hour) : 0);

        if (inputBtuPerHour > 0) {
          // Convert BTU/hr to therms/hr: 1 therm = 100,000 BTU
          // Assume 30% duty cycle for water heaters
          const dutyCycle = 0.3;
          annualTherms = Math.round((inputBtuPerHour * item.quantity * item.annual_hours * dutyCycle) / 100000);
          this.logger.debug(`Calculated annual therms for gas water heater: (${inputBtuPerHour} BTU/hr × ${item.quantity} units × ${item.annual_hours} hrs/yr × ${dutyCycle} duty cycle) ÷ 100,000 BTU/therm = ${annualTherms} therms/year`);
        } else {
          // Rough estimate based on capacity if available
          const gallons = typeof item.capacity_gallons === 'number' ? item.capacity_gallons :
                        (typeof item.capacity_gallons === 'string' ? parseFloat(item.capacity_gallons) : 0);

          if (gallons > 0) {
            // Very rough estimate: 200 therms/year per 50 gallons
            annualTherms = Math.round((gallons / 50) * 200 * item.quantity);
            this.logger.debug(`Estimated annual therms for ${gallons} gallon gas water heater: (${gallons} gal ÷ 50) × 200 therms/yr × ${item.quantity} units = ${annualTherms} therms/year`);
          } else {
            // Default estimate for unknown size
            annualTherms = 200 * item.quantity;
            this.logger.debug(`Using default annual therms for gas water heater: 200 therms/yr × ${item.quantity} units = ${annualTherms} therms/year`);
          }
        }
      }
    } else {
      this.logger.warn(`Could not calculate annual energy for ${item.equipment_type || 'DHW'} at ${item.location}: missing/invalid values.`);
    }

    // Save calculated values
    item.annual_kwh = annualKwh;
    item.annual_therms = annualTherms;

    // Return the fully processed item
    return {
      ...item,
      category: item.category || 'DHW', // Standardize category
      quantity: item.quantity,
      weekly_hours: item.weekly_hours,
      annual_hours: item.annual_hours,
      wattage: item.wattage,
      annual_kwh: item.annual_kwh,
      annual_therms: item.annual_therms,
      end_use_category: item.end_use_category,
      energy_source: item.energy_source,
    };
  }

  // ... (determineControlStrategy, determineMountingType, determineWeeklyHours, determineAdjustmentFactor, logEnergyBreakdownByLocationType, estimateFloorCount methods remain the same) ...
  private determineControlStrategy(location: string = ''): string {
    const locationLower = location.toLowerCase();

    if (locationLower.includes('exterior') ||
        locationLower.includes('outdoor') ||
        locationLower.includes('garage') ||
        locationLower.includes('parking')) {
      return 'Time Clock'; // Or Photocell
    } else if (locationLower.includes('hallway') ||
               locationLower.includes('lobby') ||
               locationLower.includes('common') ||
               locationLower.includes('stairwell')) {
      return 'Time Clock'; // Often 24/7 or timed
    } else if (locationLower.includes('laundry') ||
               locationLower.includes('community') ||
               locationLower.includes('restroom') ||
               locationLower.includes('bathroom') && !locationLower.includes('unit')) { // Common restrooms
      return 'Motion Sensor'; // Good for occupancy-based control
    } else if (locationLower.includes('office') || locationLower.includes('manager')) {
        return 'Manual Switch'; // Offices typically manual or sensor
    }
     else {
      // Default for apartment units or unspecified locations
      return 'Manual Switch';
    }
  }

  private determineMountingType(location: string = ''): string {
    const locationLower = location.toLowerCase();

    // More specific checks first
    if (locationLower.includes('pole') || locationLower.includes('parking lot')) return 'Pole Mounted';
    if (locationLower.includes('wall pack') || (locationLower.includes('wall') && locationLower.includes('exterior'))) return 'Wall Pack';
     if (locationLower.includes('bollard')) return 'Bollard';
    if (locationLower.includes('recessed') || locationLower.includes('can light')) return 'Recessed';
    if (locationLower.includes('track')) return 'Track Mounted';
    if (locationLower.includes('cove')) return 'Cove Lighting';
    if (locationLower.includes('suspended') || locationLower.includes('pendant')) return 'Suspended';
    if (locationLower.includes('wall') || locationLower.includes('sconce')) return 'Wall Mounted'; // Interior wall
    if (locationLower.includes('ceiling') || locationLower.includes('surface')) return 'Surface Mounted'; // Explicit ceiling/surface
    if (locationLower.includes('troffer')) return 'Recessed Troffer'; // Common office/commercial

    // General location defaults
    if (locationLower.includes('exterior')) return 'Wall Pack'; // Common exterior default
    if (locationLower.includes('garage') || locationLower.includes('parking structure')) return 'Surface Mounted'; // Garages often surface strip lights

    // Default if no specific keywords match
    return 'Surface Mounted';
  }

  private determineWeeklyHours(location: string = ''): number {
    const locationLower = location.toLowerCase();

    // 24/7 or near 24/7 locations
    if (locationLower.includes('exterior') ||
        locationLower.includes('outdoor') ||
        locationLower.includes('parking') || // Includes garage, lot
        locationLower.includes('hallway') ||
        locationLower.includes('lobby') ||
        locationLower.includes('common area') || // General common
        locationLower.includes('stairwell') ||
        locationLower.includes('elevator')) {
      return 77; // Approx 11 hours/day avg (dusk-dawn or partial daytime) - Adjust based on typical dusk-dawn + some daytime
                  // Or potentially 168 for critical areas like some hallways/stairs if truly 24/7 lighting
    }
    // High use intermittent areas
    else if (locationLower.includes('laundry') ||
             locationLower.includes('community') ||
             locationLower.includes('amenity') ||
             locationLower.includes('fitness') ||
             locationLower.includes('mail room')) {
      return 50; // Estimate ~7 hours/day usage
    }
     // Office / Admin areas
     else if (locationLower.includes('office') ||
              locationLower.includes('manager') ||
              locationLower.includes('leasing')) {
       return 50; // Standard 8-10 hours/day, 5 days/week
     }
    // Low use / short duration areas
    else if (locationLower.includes('bathroom') || // Includes restrooms unless specified 'unit bathroom'
             locationLower.includes('restroom') ||
             locationLower.includes('washroom') ||
             locationLower.includes('utility') ||
             locationLower.includes('electrical') ||
             locationLower.includes('mechanical') ||
             locationLower.includes('storage') ||
             locationLower.includes('closet') ||
             locationLower.includes('telecom')) {
      return 14; // Estimate ~2 hours/day usage
    }
    // In-unit areas
    else if (locationLower.includes('unit') ||
             locationLower.includes('apartment') ||
             locationLower.includes('bedroom') ||
             locationLower.includes('living') ||
             locationLower.includes('kitchen') || // In-unit kitchen
             locationLower.includes('dining') ||
             locationLower.includes('den') ||
             locationLower.includes('unit bath')) { // Specifically unit bathrooms if tagged
      return 30; // Estimate ~4 hours/day average usage per fixture within a unit
    }
    // Default if location is vague or doesn't match known patterns
    else {
      this.logger.debug(`Using default weekly hours (30) for unknown location type: '${location}'`);
      return 30;
    }
  }

  private determineAdjustmentFactor(location: string = ''): number {
    const locationLower = location.toLowerCase();

    // Examples: Adjust down if controls likely reduce usage beyond simple hours
    if (locationLower.includes('office') && !locationLower.includes('home office')) {
      // return 0.8; // Office lights might not be on the full 50 hours if sensors are used
    } else if (locationLower.includes('community room') || locationLower.includes('laundry')) {
     // return 0.7; // Usage might be high during peaks but low otherwise, even with sensors
    } else if (locationLower.includes('exterior') || locationLower.includes('parking')) {
     // return 0.9; // If photocell/timer is accurate, maybe slight reduction for maintenance/dawn overlap?
    }

    // Default - no adjustment unless specific rules apply
    return 1.0;
  }

  private logEnergyBreakdownByLocationType(equipment: EquipmentItemDto[]): void {
    if (!equipment || equipment.length === 0) {
      this.logger.log('No equipment data provided for energy breakdown logging.');
      return;
    }

    // Define broader location categories for reporting
    // Order matters for matching (more specific first)
    const categories: Record<string, string[]> = {
       'Apartment Units': ['unit', 'apartment', 'bedroom', 'living', 'kitchen', 'dining', 'den', 'unit bath'], // Ensure unit-specific terms are caught here
       'Common Interior': ['hallway', 'lobby', 'stairwell', 'common area', 'community', 'amenity', 'fitness', 'laundry', 'mail room', 'elevator', 'interior common'],
       'Common Exterior': ['exterior', 'outdoor', 'courtyard', 'parking lot', 'facade', 'landscape', 'pole', 'bollard'],
       'Service/Utility': ['utility', 'electrical', 'mechanical', 'storage', 'closet', 'telecom', 'trash', 'compactor', 'boiler room', 'pump room'],
       'Office/Admin': ['office', 'manager', 'leasing', 'admin'],
       'Garage/Parking Structure': ['garage', 'parking structure', 'covered parking'],
       'Restrooms (Common)': ['restroom', 'bathroom', 'washroom'], // Catches non-unit bathrooms
       'Other': [] // Catch-all for anything not categorized
    };

    const groupedKwh: Record<string, number> = {};
    const groupedTherms: Record<string, number> = {};
    let totalKwh = 0;
    let totalTherms = 0;

    equipment.forEach(item => {
      const locationLower = (item.location || '').toLowerCase();
      let assignedCategory = 'Other'; // Default category

      // Find the matching category
      for (const [category, keywords] of Object.entries(categories)) {
         // Skip 'Other' category check initially
         if (category === 'Other') continue;

         // Special check for Restrooms to avoid unit bathrooms
         if (category === 'Restrooms (Common)' && locationLower.includes('unit')) {
            continue; // Skip if it's explicitly a unit bathroom
         }

        if (keywords.some(keyword => locationLower.includes(keyword))) {
          assignedCategory = category;
          break; // Stop checking once a category is found
        }
      }

      // Initialize category totals if not present
      if (!groupedKwh[assignedCategory]) groupedKwh[assignedCategory] = 0;
      if (!groupedTherms[assignedCategory]) groupedTherms[assignedCategory] = 0;

      // Add energy usage to the assigned category
      const itemKwh = item.annual_kwh || 0;
      const itemTherms = item.annual_therms || 0;

      groupedKwh[assignedCategory] += itemKwh;
      groupedTherms[assignedCategory] += itemTherms;
      totalKwh += itemKwh;
      totalTherms += itemTherms;
    });

    // Log the breakdown
    this.logger.log('--- Energy Usage Breakdown by Location Type ---');
    if (totalKwh > 0) {
        this.logger.log('Electricity (kWh):');
        Object.entries(groupedKwh)
            .filter(([, kwh]) => kwh > 0) // Only show categories with usage
            .sort(([, kwhA], [, kwhB]) => kwhB - kwhA) // Sort descending by kWh
            .forEach(([category, kwh]) => {
                const percentage = totalKwh > 0 ? ((kwh / totalKwh) * 100).toFixed(1) : '0.0';
                this.logger.log(`  ${category}: ${Math.round(kwh).toLocaleString()} kWh/year (${percentage}%)`);
        });
         this.logger.log(`  Total Electricity: ${Math.round(totalKwh).toLocaleString()} kWh/year`);
    } else {
        this.logger.log('No significant Electricity (kWh) usage found.');
    }

    if (totalTherms > 0) {
        this.logger.log('Natural Gas (Therms):');
         Object.entries(groupedTherms)
            .filter(([, therms]) => therms > 0) // Only show categories with usage
            .sort(([, thermsA], [, thermsB]) => thermsB - thermsA) // Sort descending by Therms
            .forEach(([category, therms]) => {
                const percentage = totalTherms > 0 ? ((therms / totalTherms) * 100).toFixed(1) : '0.0';
                this.logger.log(`  ${category}: ${Math.round(therms).toLocaleString()} therms/year (${percentage}%)`);
        });
        this.logger.log(`  Total Natural Gas: ${Math.round(totalTherms).toLocaleString()} therms/year`);
    } else {
         this.logger.log('No significant Natural Gas (Therms) usage found.');
    }
     this.logger.log('-----------------------------------------------');
  }

  private estimateFloorCount(equipment: EquipmentItemDto[]): number {
     if (!equipment || equipment.length === 0) {
        return 1; // Default if no data
     }

    let maxFloor = 0;

    equipment.forEach(item => {
      const location = item.location || '';
      if (location) {
        // Match explicit floor numbers like "3rd floor", "Floor 5", "level 2"
        const match = location.match(/(?:floor|level|flr)\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*floor/i);
        if (match) {
           // Extract the number from potential capturing groups
           const floorNum = parseInt(match[1] || match[2], 10);
           if (!isNaN(floorNum) && floorNum > maxFloor) {
             maxFloor = floorNum;
           }
        }
      }
    });

    // If no explicit floor numbers found, return 1 (or potentially infer from other clues if needed)
    const finalFloorCount = maxFloor > 0 ? maxFloor : 1;
    this.logger.debug(`Estimated floor count: ${finalFloorCount}`);
    return finalFloorCount;
  }

  // ... (processWithOpenAI, getSystemPrompt methods remain the same) ...
  private async processWithOpenAI(
    notes: string,
    model: string = 'gpt-4o', // Default model
    equipmentType: string = 'lighting' // Default type
  ): Promise<{
    equipment: EquipmentItemDto[];
    building_info?: BuildingInfoDto;
  }> {
    try {
      this.logger.log(`Processing field notes (Type: ${equipmentType}) with ${model}. Notes length: ${notes.length} characters.`);
      const systemPrompt = this.getSystemPrompt(equipmentType); // Get the appropriate prompt

      if (!systemPrompt) {
          throw new Error(`Could not get system prompt for equipment type: ${equipmentType}`);
      }

      this.logger.log(`Calling OpenAI API (${model}) with ${equipmentType}-specific prompt...`);
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: notes }
        ],
        model: model, // Use the specified model
        response_format: { type: 'json_object' }, // Expect JSON output
        temperature: 0.2, // Lower temperature for more deterministic, structured output
        // max_tokens: 4096 // Consider setting max_tokens if responses might be very large
      });

      const responseContent = completion.choices[0]?.message?.content;
      const usage = completion.usage; // Get token usage

      if (usage) {
           this.logger.log(`OpenAI API usage for ${equipmentType}: ${usage.prompt_tokens} prompt tokens, ${usage.completion_tokens} completion tokens, ${usage.total_tokens} total tokens.`);
      }


      if (!responseContent) {
        this.logger.error('Empty response content received from OpenAI API.');
        throw new Error('Empty response from OpenAI');
      }

      // Attempt to parse the JSON response
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        this.logger.error(`Failed to parse OpenAI JSON response: ${parseError.message}`, responseContent);
        // Log the raw response for debugging
        throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
      }

      // Validate the structure of the parsed response
      if (!parsedResponse || typeof parsedResponse !== 'object') {
         throw new Error('Invalid response format: parsed response is not an object.');
      }

      // --- Equipment Validation ---
      let equipment: EquipmentItemDto[] = [];
      if (parsedResponse.equipment && Array.isArray(parsedResponse.equipment)) {
          equipment = parsedResponse.equipment as EquipmentItemDto[]; // Assume structure matches DTO for now
          this.logger.log(`OpenAI returned ${equipment.length} raw equipment items for type '${equipmentType}'.`);
          // Add more validation here if needed (e.g., check required fields on each item)
      } else {
           this.logger.warn(`OpenAI response for type '${equipmentType}' did not contain a valid 'equipment' array. Proceeding without equipment from AI.`);
           // If equipment array is missing/invalid, return empty array, don't throw unless critical
           equipment = [];
      }


      // --- Building Info Validation ---
      let buildingInfo: BuildingInfoDto | undefined = undefined;
       if (parsedResponse.building_info && typeof parsedResponse.building_info === 'object') {
            buildingInfo = parsedResponse.building_info as BuildingInfoDto;
            this.logger.log(`Building info from OpenAI: Type=${buildingInfo.type || 'N/A'}, Units=${buildingInfo.total_units || 'N/A'}, Floors=${buildingInfo.floors || 'N/A'}`);

            // Log unit types if available
             if (buildingInfo.unit_types && Array.isArray(buildingInfo.unit_types) && buildingInfo.unit_types.length > 0) {
                 const unitTypesStr = buildingInfo.unit_types
                    .map((ut: { count: number; type: string }) => `${ut.count || '?'} x ${ut.type || 'Unknown Type'}`)
                    .join(', ');
                 this.logger.log(`Unit types from OpenAI: ${unitTypesStr}`);
             }
       } else {
            this.logger.warn(`No valid 'building_info' object found in OpenAI response for type '${equipmentType}'.`);
       }


      // Return the raw extracted data. Processing/calculation happens later.
      return {
        equipment: equipment, // Return the extracted (but not yet processed) equipment
        building_info: buildingInfo // Return the extracted building info
      };

    } catch (error) {
      // Log specific OpenAI errors if available
      if (error instanceof OpenAI.APIError) {
          this.logger.error(`OpenAI API Error (Status ${error.status}): ${error.message}`, error.error);
      } else {
          this.logger.error(`Error during OpenAI processing (Type: ${equipmentType}): ${error.message}`, error.stack);
      }
       // Re-throw a generic error for the calling function to handle
      throw new Error(`OpenAI processing failed for ${equipmentType}: ${error.message}`);
    }
  }

  private getSystemPrompt(equipmentType: string = 'lighting'): string | null {
    const typeLower = equipmentType.toLowerCase();

    switch (typeLower) {
        case 'all':
            this.logger.debug('Using comprehensive prompt for ALL equipment types.');
            return this.getAllEquipmentPrompt();
        case 'lighting':
             this.logger.debug('Using LIGHTING specific prompt.');
            return this.getLightingPrompt();
        case 'hvac':
             this.logger.debug('Using HVAC specific prompt.');
            return this.getHvacPrompt();
         // Add cases for other specific types here if needed
         // case 'dhw': return this.getDhwPrompt();
         // case 'pumps': return this.getPumpsPrompt();
        default:
            this.logger.error(`Invalid equipment type requested for system prompt: ${equipmentType}. Valid types: 'all', 'lighting', 'hvac'.`);
            return null; // Indicate an invalid type was requested
    }
  }


  /**
   * Get a comprehensive prompt for extracting ALL major equipment types.
   * @returns The comprehensive system prompt string
   */
  private getAllEquipmentPrompt(): string {
    return `
# Comprehensive Energy Audit Equipment Extraction

You are an expert energy auditor AI assistant. Your task is to extract ALL specified equipment information from the provided field notes for a commercial or multifamily building. Create a comprehensive equipment inventory covering ALL of the following categories:
- Lighting fixtures (BOTH common areas AND inside individual units)
- HVAC equipment (heating, cooling, ventilation)
- Pumps and motors (related to HVAC or other building systems)
- Domestic Hot Water (DHW) systems
- Water fixtures (toilets, faucets, showers)
- Laundry equipment
- Irrigation systems
- Appliances and other equipment

IMPORTANT: You MUST extract ALL equipment mentioned in the field notes, including equipment inside individual units (apartments), common areas, and mechanical/utility rooms. Do not skip any equipment items, no matter how minor they may seem.

## Input:
Field notes from an energy audit site visit.

## Output Format:
Return a **single JSON object** with the following structure. **Adhere strictly to this schema.**

\\\`\\\`\\\`json
{
  "building_info": {
    "type": "string (e.g., Multifamily, Office, Retail)",
    "total_units": "number | null (Total number of residential units if applicable)",
    "unit_types": [
      {
        "type": "string (e.g., 1-Bedroom, 2-Bedroom, Studio)",
        "count": "number"
      }
    ] | null,
    "floors": "number | null",
    "address": "string | null"
  },
  "equipment": [
    {
      // --- Common Fields (Required for ALL items) ---
      "equipment_type": "string (Specific type, e.g., LED Troffer, Split System AC, Circulator Pump, Gas Water Heater)",
      "category": "string (One of: 'Lighting', 'HVAC', 'Ventilation', 'Pumps/Motors', 'DHW')",
      "quantity": "number (Number of identical items in this group)",
      "location": "string (Specific location, e.g., 'Unit 101 Kitchen', '3rd Floor Hallway', 'Mechanical Room', 'Exterior North Wall')",
      "wattage": "number | null (Estimated or specified wattage in Watts for electrical components)",
      "weekly_hours": "number | null (Estimated weekly operating hours)",
      "annual_kwh": "number | null (CRITICAL: For gas equipment that uses electricity, estimate electrical usage for controls/fans/etc. For electric-only equipment, set to 0)",
      "annual_therms": "number | null (CRITICAL: For gas equipment, estimate gas usage. For non-gas equipment, set to null)",
      "energy_source": "string (One of: 'Electricity', 'Gas', 'Both', 'Other', 'None')",
      "end_use_category": "string (MUST be one of: 'Air Compressors', 'Cooling', 'Cooking', 'Lighting', 'Miscellaneous', 'Office Equipment', 'Process', 'Ventilation', 'Water Pumps', 'Refrigeration', 'Water Heating')",
      "is_per_unit": "boolean (true if the equipment is inside an individual unit/apartment, false for common area equipment)",

      // --- Lighting Specific ---
      "lamps_per_fixture": "number | null",
      "number_of_lamps": "number | null (Total lamps for the quantity specified)",
      "lamp_type": "string | null (e.g., LED, T8 Fluorescent, Incandescent)",
      "control_strategy": "string | null (e.g., Manual Switch, Motion Sensor, Time Clock, Photocell)",
      "mounting_type": "string | null (e.g., Recessed, Surface Mounted, Wall Pack, Pole Mounted)",

      // --- HVAC Specific ---
      "manufacturer": "string | null",
      "model": "string | null",
      "serial_number": "string | null",
      "year": "number | null",
      "age": "number | null (Calculated or specified)",
      "cooling_capacity_tons": "number | null",
      "heating_capacity_mbh": "number | null",
      "fuel_type": "string | null (e.g., Natural Gas, Electricity, Propane)",
      "serves": "string | null (Area or system served, e.g., 'Unit 101', 'Common Areas', 'Heating Loop')",
      "efficiency": {
        "seer": "number | null",
        "eer": "number | null",
        "hspf": "number | null",
        "afue": "number | null"
      } | null,

      // --- Ventilation Specific (Can overlap with HVAC) ---
      "cfm": "number | null",
      "motor_hp": "number | null (Motor horsepower)",

      // --- Pumps/Motors Specific ---
      "horsepower": "number | null",
      "flow_rate": "number | null",
      "application": "string | null (e.g., Chilled Water Pump, Boiler Pump, Domestic Water Booster)",

      // --- DHW Specific ---
      "capacity_gallons": "number | null",
      "input_btu_per_hour": "number | null"
    }
  ],
  "flags": [],
  "metadata": {
    "confidence": 0.9,
    "processingTimeMs": null,
    "processedAt": null
  }
}
\\\`\\\`\\\`

## Data Extraction & Processing Rules:

1.  **Identify Building Info:** Extract \`type\`, \`total_units\`, \`unit_types\`, \`floors\`, and \`address\` if mentioned. Use \`null\` if information is missing.
2.  **Extract ALL Equipment:** Find EVERY piece of equipment mentioned in the field notes, including ALL items in individual units/apartments. Pay special attention to sections describing unit inspections (e.g., "Unit 215", "Unit 205") and extract ALL equipment in those units.
3.  **Group Identical Items:** Combine identical equipment items found in the same location or across multiple similar locations (e.g., '10 x LED fixtures in 1st Floor Hallway', '50 x Split AC units in 1-Bed Apartments'). Use the \`quantity\` field.
4.  **Detailed Location:** Be specific with the \`location\`. For equipment inside specific units, include the unit number (e.g., 'Unit 215 - Kitchen', 'Unit 205 - Bathroom 1'). For common areas, be as specific as possible (e.g., 'Laundry Room', 'Community Room', 'Property Manager Office').
5.  **Categorization:** Assign the correct \`category\` and specific \`equipment_type\`. Determine \`energy_source\`, \`end_use_category\`, and \`fuel_type\` based on the equipment. For water fixtures (toilets, faucets, showers), use category 'Water Fixtures' and set appropriate end_use_category. For ventilation equipment (exhaust fans, air handlers, ERVs, HRVs), use category 'Ventilation' and set end_use_category to 'Ventilation'. For in-unit equipment, set \`is_per_unit\` to true.
6.  **Energy Source and Consumption (CRITICAL):**
    *   For equipment that uses BOTH gas and electricity (e.g., gas water heaters, gas furnaces):
        *   Set \`energy_source\` to "Both"
        *   Set \`annual_kwh\` to estimated electrical usage for controls/fans (100-700W typical)
        *   Set \`annual_therms\` to estimated gas usage based on capacity/specs
    *   For electric-only equipment:
        *   Set \`energy_source\` to "Electricity"
        *   Set \`annual_kwh\` to 0 (will be calculated later)
        *   Set \`annual_therms\` to null
    *   For gas-only equipment (rare):
        *   Set \`energy_source\` to "Gas"
        *   Set \`annual_kwh\` to null
        *   Set \`annual_therms\` to estimated gas usage
7.  **Wattage Estimation (CRITICAL):**
    *   If wattage is specified, use it.
    *   If not specified, **estimate** based on type/capacity:
        *   Lighting: LED (9.5W), CFL (13W/23W), T8 (32W/lamp), Incandescent (25W/60W). Use context.
        *   HVAC Cooling: 1 ton ≈ 1000 Watts.
        *   HVAC Electric Heating: 1 MBH ≈ 293 Watts.
        *   HVAC Gas Heating (Electrical): Estimate fan/controls ≈ 300-700 Watts.
        *   Fans/Ventilation: 100-500 Watts based on apparent size/application.
        *   Pumps/Motors: 1 HP ≈ 746 Watts. Use HP if given, otherwise estimate based on application (e.g., small circulator 100W, large pump 1000W+).
        *   DHW Electric: Use input rating if given, otherwise estimate based on size (e.g., 4500W).
        *   DHW Gas (Electrical): Estimate 100-300W for controls/ignition.
    *   Output the estimated or specified wattage in the \`wattage\` field. Use \`null\` only if impossible to determine.
8.  **Gas Usage Estimation (CRITICAL):**
    *   For gas water heaters:
        *   If input BTU/hr known: annual_therms = (BTU/hr × annual_hours × 0.3 duty cycle) ÷ 100,000
        *   If only gallons known: annual_therms = (gallons ÷ 50) × 200
        *   Default: 200 therms/year for unknown size
    *   For gas furnaces/boilers:
        *   If input BTU/hr known: annual_therms = (BTU/hr × annual_hours × 0.4 duty cycle) ÷ 100,000
        *   Default based on size/application
9.  **Weekly Hours Estimation (CRITICAL):**
    *   If hours are specified, use them.
    *   If not specified, **estimate** based on location/type:
        *   Exterior/Parking/Common Hallways/Lobby/Stairs: 77 hours/week (Avg ~11 hrs/day).
        *   Mechanical/Boiler Rooms (continuous equipment): 168 hours/week.
        *   Office/Amenity/Community/Laundry: 50 hours/week.
        *   In-Unit (Residential): HVAC (40 hrs/wk), Lighting (30 hrs/wk per fixture type avg).
        *   Low-Use (Storage/Utility/Restrooms): 14 hours/week.
    *   Output the estimated or specified hours in the \`weekly_hours\` field. Use \`null\` only if impossible to determine.
10. **Fill All Fields:** Provide a value (\`string\`, \`number\`, \`boolean\`, \`object\`, \`array\`) or \`null\` for every field defined in the schema for each equipment item. Do not omit fields.
11. **Accuracy and Completeness:** Be thorough. Extract details like manufacturer, model, serial numbers, capacities, efficiencies (SEER, AFUE, etc.) if available. Calculate \`age\` if \`year\` is found.
12. **Extract ALL Equipment Types:** Make sure to extract ALL of these equipment types if mentioned:
    *   ALL lighting fixtures in common areas AND inside units
    *   ALL HVAC equipment (heat pumps, furnaces, AC units, etc.)
    *   ALL ventilation equipment (exhaust fans, air handlers, ERVs, HRVs, ventilators, etc.) with category 'Ventilation'
    *   ALL water heaters (in units and common areas)
    *   ALL water fixtures (toilets, faucets, showers, sinks)
    *   ALL laundry equipment (washers, dryers)
    *   ALL irrigation systems
    *   ALL appliances (stoves, refrigerators, etc.)

Focus on accurate data extraction and estimation based on these rules. The final JSON must be valid.
`;
  }


  /**
   * Get the lighting-specific prompt for OpenAI.
   * @returns The lighting prompt string
   */
  private getLightingPrompt(): string {
    // Escape inner backticks: ``` -> \`\`\`
    return `
# Lighting Fixture Energy Audit Extraction

You are an expert energy auditor AI assistant specializing in lighting. Your task is to extract detailed lighting fixture information from the provided field notes for a commercial or multifamily building.

## Input:
Field notes from an energy audit site visit, potentially focusing on lighting.

## Output Format:
Return a **single JSON object** with the following structure. **Adhere strictly to this schema.**

\\\`\\\`\\\`json
{
  "building_info": {
    "type": "string (e.g., Multifamily, Office, Retail)",
    "total_units": "number | null",
    "unit_types": [
      {
        "type": "string (e.g., 1-Bedroom, 2-Bedroom, Studio)",
        "count": "number"
      }
    ] | null,
    "floors": "number | null",
    "address": "string | null"
  },
  "equipment": [
    {
      // --- Lighting Fields (Required for ALL items) ---
      "equipment_type": "string (Specific fixture type, e.g., LED Troffer, Wall Pack, Recessed Can)",
      "category": "Lighting", // Always "Lighting"
      "quantity": "number (Number of identical fixtures in this group)",
      "location": "string (Specific location, e.g., 'Unit 101 Kitchen', '3rd Floor Hallway', 'Exterior North Wall')",
      "lamps_per_fixture": "number | null (Number of lamps in one fixture)",
      "number_of_lamps": "number | null (Total lamps for the quantity specified = quantity * lamps_per_fixture)",
      "lamp_type": "string | null (e.g., LED, T8 Fluorescent, Incandescent, CFL)",
      "wattage": "number | null (Estimated or specified wattage PER LAMP in Watts)", // Wattage PER LAMP
      "weekly_hours": "number | null (Estimated weekly operating hours for this location/fixture)",
      "annual_kwh": 0, // **CRITICAL: Always output 0 for this field.**
      "control_strategy": "string | null (e.g., Manual Switch, Motion Sensor, Time Clock, Photocell)",
      "mounting_type": "string | null (e.g., Recessed, Surface Mounted, Wall Pack, Pole Mounted)",
      "energy_source": "Electricity", // Always "Electricity"
      "end_use_category": "Lighting" // Always "Lighting"
    }
  ],
  "flags": [],
  "metadata": {
    "confidence": 0.9,
    "processingTimeMs": null,
    "processedAt": null
  }
}
\\\`\\\`\\\`

## Data Extraction & Processing Rules:

1.  **Identify Building Info:** Extract \`type\`, \`total_units\`, \`unit_types\`, \`floors\`, and \`address\` if mentioned. Use \`null\` if missing.
2.  **Extract ALL Lighting Fixtures:** Find every lighting fixture mentioned.
3.  **Group Identical Fixtures:** Combine identical fixtures (same type, wattage, controls, mounting) found in the same location or across multiple similar locations. Use the \`quantity\` field.
4.  **Detailed Location:** Be specific with the \`location\`.
5.  **Fixture Details:** Extract \`equipment_type\`, \`lamps_per_fixture\`, \`lamp_type\`, \`control_strategy\`, \`mounting_type\`. Calculate \`number_of_lamps\` (\`quantity\` * \`lamps_per_fixture\`).
6.  **Wattage Estimation (CRITICAL - PER LAMP):**
    *   If wattage per lamp is specified, use it.
    *   If fixture wattage is given, divide by \`lamps_per_fixture\` to get per-lamp wattage.
    *   If not specified, **estimate wattage PER LAMP** based on \`lamp_type\`:
        *   LED: 9.5W (typical replacement), adjust if fixture type suggests different (e.g., LED tube might be 15W).
        *   CFL: 13W (standard), 23W (higher output).
        *   T8 Fluorescent: 32W (standard 4ft), adjust for length (e.g., 17W for 2ft).
        *   Incandescent: 25W, 40W, 60W, 100W. Use context if possible.
    *   Output the estimated or specified wattage PER LAMP in the \`wattage\` field. Use \`null\` only if impossible.
7.  **Weekly Hours Estimation (CRITICAL):**
    *   If hours are specified, use them.
    *   If not specified, **estimate** based on \`location\`:
        *   Exterior/Parking/Common Hallways/Lobby/Stairs: 77 hours/week.
        *   Office/Amenity/Community/Laundry: 50 hours/week.
        *   In-Unit (Residential): 30 hours/week (average per fixture).
        *   Low-Use (Storage/Utility/Restrooms): 14 hours/week.
    *   Output the estimated or specified hours in the \`weekly_hours\` field. Use \`null\` only if impossible.
8.  **Annual kWh:** **Always output 0.** Do not calculate.
9.  **Fill All Fields:** Provide a value or \`null\` for every field defined in the schema. Do not omit fields.
10. **Accuracy:** Focus on extracting the correct counts, types, locations, and estimating wattage/hours accurately based on these rules.

The final JSON must be valid.
`;
  }

  /**
   * Get the HVAC-specific prompt for OpenAI.
   * @returns The HVAC prompt string
   */
  private getHvacPrompt(): string {
    // Escape inner backticks: ``` -> \`\`\`
    return `
# HVAC Equipment Energy Audit Extraction

You are an expert energy auditor AI assistant specializing in Heating, Ventilation, and Air Conditioning (HVAC) systems. Your task is to extract detailed HVAC equipment information from the provided field notes for a commercial or multifamily building.

## Input:
Field notes from an energy audit site visit, potentially focusing on HVAC equipment.

## Output Format:
Return a **single JSON object** with the following structure. **Adhere strictly to this schema.**

\\\`\\\`\\\`json
{
  "building_info": {
    "type": "string (e.g., Multifamily, Office, Retail)",
    "total_units": "number | null",
    "unit_types": [
      {
        "type": "string (e.g., 1-Bedroom, 2-Bedroom, Studio)",
        "count": "number"
      }
    ] | null,
    "floors": "number | null",
    "address": "string | null"
  },
  "equipment": [
    {
      // --- Common HVAC Fields (Required for ALL items) ---
      "equipment_type": "string (Specific type, e.g., Split System AC, Gas Furnace, Rooftop Unit (RTU), Boiler, Exhaust Fan)",
      "category": "string (One of: 'HVAC', 'Ventilation')", // Use 'HVAC' for heating/cooling, 'Ventilation' for fans primarily for air movement
      "quantity": "number (Number of identical items in this group)",
      "location": "string (Specific location, e.g., 'Unit 101 Closet', 'Roof', 'Mechanical Room', 'Common Areas')",
      "manufacturer": "string | null",
      "model": "string | null",
      "serial_number": "string | null",
      "year": "number | null",
      "age": "number | null (Calculated or specified)",
      "wattage": "number | null (Estimated or specified wattage in Watts for ELECTRICAL components/consumption)",
      "weekly_hours": "number | null (Estimated weekly operating hours)",
      "annual_kwh": 0, // **CRITICAL: Always output 0 for this field.**
      "energy_source": "string (One of: 'Electricity', 'Gas', 'Other', 'None')", // Primary energy source
      "fuel_type": "string | null (Specific fuel if applicable, e.g., Natural Gas, Electricity, Propane)", // Often same as energy_source but can differ (e.g., Gas furnace uses Gas fuel, Electricity energy source for fan)
      "end_use_category": "string (One of: 'Cooling', 'Heating', 'Ventilation', 'Heating & Cooling')",
      "serves": "string | null (Area or system served, e.g., 'Unit 101', 'Common Areas', 'Heating Loop', 'Building Ventilation')",

      // --- Heating/Cooling Specific ---
      "cooling_capacity_tons": "number | null",
      "heating_capacity_mbh": "number | null",
      "efficiency": {
        "seer": "number | null",
        "eer": "number | null",
        "hspf": "number | null",
        "afue": "number | null"
      } | null,

      // --- Ventilation Specific ---
      "cfm": "number | null",
      "motor_hp": "number | null (Motor horsepower)"
    }
  ],
  "flags": [],
  "metadata": {
    "confidence": 0.9,
    "processingTimeMs": null,
    "processedAt": null
  }
}
\\\`\\\`\\\`

## Data Extraction & Processing Rules:

1.  **Identify Building Info:** Extract \`type\`, \`total_units\`, \`unit_types\`, \`floors\`, and \`address\` if mentioned. Use \`null\` if missing.
2.  **Extract ALL HVAC Equipment:** Find every piece of heating, cooling, and ventilation equipment.
3.  **Group Identical Items:** Combine identical equipment items found in the same location or across multiple similar locations. Use the \`quantity\` field.
4.  **Detailed Location & Served Area:** Be specific with \`location\`. Use \`serves\` to indicate what the unit conditions (e.g., 'Unit 101', 'Common Hallways').
5.  **Categorization:** Assign \`category\` ('HVAC' or 'Ventilation'). Determine specific \`equipment_type\`. Determine \`energy_source\`, \`fuel_type\`, and \`end_use_category\` ('Cooling', 'Heating', 'Ventilation', 'Heating & Cooling').
6.  **Wattage Estimation (CRITICAL - ELECTRICAL):**
    *   Focus on **electrical** consumption (Watts).
    *   If wattage is specified, use it.
    *   If not specified, **estimate electrical wattage**:
        *   Cooling (AC, HP): 1 ton ≈ 1000 Watts. Use \`cooling_capacity_tons\`.
        *   Electric Heating (Furnace, Boiler, HP supplemental): 1 MBH ≈ 293 Watts. Use \`heating_capacity_mbh\`.
        *   Gas Heating (Furnace, Boiler): Estimate **electrical** for fan/controls ≈ 300-700 Watts (ignore gas BTU input for this field).
        *   Ventilation Fans: Use \`motor_hp\` (1 HP ≈ 746 Watts) or estimate based on size (e.g., Bath Fan 30W, Common Exhaust 300W, Large RTU fan 1000W+).
    *   Output the estimated or specified electrical wattage in the \`wattage\` field. Use \`null\` only if impossible.
7.  **Weekly Hours Estimation (CRITICAL):**
    *   If hours are specified, use them.
    *   If not specified, **estimate** based on \`location\` and \`serves\`:
        *   Common Area HVAC/Ventilation: 77 hours/week.
        *   Mechanical Room (Boilers, Chillers - if run continuously): 168 hours/week.
        *   Office/Amenity Spaces: 50 hours/week.
        *   In-Unit HVAC (Residential): 40 hours/week (average runtime).
        *   Exhaust Fans (Bath/Kitchen - intermittent): 14 hours/week.
    *   Output the estimated or specified hours in the \`weekly_hours\` field. Use \`null\` only if impossible.
8.  **Annual kWh:** **Always output 0.** Do not calculate.
9.  **Capacities & Efficiencies:** Extract \`cooling_capacity_tons\`, \`heating_capacity_mbh\`, \`cfm\`, \`motor_hp\`, and efficiency ratings (SEER, EER, HSPF, AFUE) if available.
10. **Details:** Extract \`manufacturer\`, \`model\`, \`serial_number\`, \`year\`. Calculate \`age\` if \`year\` is found.
11. **Fill All Fields:** Provide a value or \`null\` for every field defined in the schema. Do not omit fields.

Accuracy in identifying types, capacities, and estimating electrical wattage and operating hours is key. The final JSON must be valid.
`;
  }

  // ... (testCalculations method remains the same) ...
  async testCalculations(notes: string): Promise<EquipmentItemDto[]> {
    this.logger.log('--- Starting Test Calculations ---');
    this.logger.log(`Input field notes length: ${notes.length} characters`);

    try {
        // 1. Process with OpenAI to get raw extraction
        // Using 'all' type for testing broad extraction
        const aiResult = await this.processWithOpenAI(notes, 'gpt-4o', 'all');

        this.logger.log(`AI Extraction returned ${aiResult.equipment.length} raw items.`);
        if (aiResult.building_info) {
             this.logger.log(`AI Extracted Building Info: ${JSON.stringify(aiResult.building_info)}`);
        } else {
             this.logger.log(`AI Extracted Building Info: None`);
        }


        // 2. Apply internal processing logic to the extracted data
        this.logger.log('Applying internal processing and calculations...');
        // Use 'all' so it routes each item based on its category
        const processedEquipment = this.processEquipmentData(aiResult.equipment || [], 'all');

        this.logger.log(`Internal processing resulted in ${processedEquipment.length} equipment items.`);

        // 3. Log details of the *processed* equipment for verification
        this.logger.log('--- Processed Equipment Details ---');
        processedEquipment.forEach((item: EquipmentItemDto, index: number) => {
             const energyStr = `kWh: ${item.annual_kwh || 0}` + (item.annual_therms ? `, Therms: ${item.annual_therms}` : '');
             this.logger.debug(`#${index + 1}: [${item.category}] ${item.equipment_type} | Loc: ${item.location} | Qty: ${item.quantity} | Wattage: ${item.wattage || 'N/A'} | Hrs: ${item.weekly_hours || 'N/A'} | Energy: ${energyStr}`);
        });
        this.logger.log('---------------------------------');

        // 4. Log the final breakdown based on processed data
        this.logEnergyBreakdownByLocationType(processedEquipment);

        this.logger.log('--- Test Calculations Complete ---');
        return processedEquipment; // Return the final, processed list

    } catch (error) {
        this.logger.error(`Error during testCalculations: ${error.message}`, error.stack);
        throw error; // Re-throw the error after logging
    }
  }

  /**
   * Turn a Cognito-Forms style object into a reasonably small text block
   * that still looks like "field notes". Photo arrays and other
   * high-volume blobs are stripped so we don't blow the token budget.
   */
  private payloadToNotes(payload: unknown): string {
    const replacer = (key: string, value: any) => {
      if (!key) return value; // root
      const low = key.toLowerCase();
      // Remove noisy/large fields
      if (low.includes('photo') || low.includes('image') || low.includes('file') || low.includes('storageurl') || key === 'Entry' || key === 'Form' || key === 'Id') return undefined;
      // Abbreviate large arrays
      if (Array.isArray(value) && value.length > 50) return `[${value.length} items omitted]`;
      return value;
    };

    // Pretty print so it's still somewhat human-readable
    return `--- BEGIN STRUCTURED FIELD DATA ---
`
         + JSON.stringify(payload, replacer, 2)
         + `
--- END STRUCTURED FIELD DATA ---`;
  }

} // End of FieldNotesService class
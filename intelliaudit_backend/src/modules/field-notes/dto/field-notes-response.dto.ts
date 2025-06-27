import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Equipment item class
export class EquipmentItemDto {
  @ApiProperty({ description: 'Unique ID of the equipment' })
  id: string;

  @ApiProperty({ description: 'Type of equipment' })
  equipment_type: string;

  @ApiPropertyOptional({ description: 'Manufacturer name' })
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Model number' })
  model?: string;

  @ApiPropertyOptional({ description: 'Equipment category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Number of units' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Equipment location' })
  location?: string;

  @ApiPropertyOptional({ description: 'Location type (Common Area or In-Unit)' })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Energy source (e.g., electricity, natural gas)' })
  energy_source?: string;

  @ApiPropertyOptional({ description: 'Source type of the equipment data' })
  source_type: string;

  @ApiPropertyOptional({ description: 'Power consumption in watts' })
  wattage?: number;

  @ApiPropertyOptional({ description: 'Number of lamps per fixture' })
  lamps_per_fixture?: number;

  @ApiPropertyOptional({ description: 'Total number of lamps (quantity × lamps_per_fixture)' })
  number_of_lamps?: number;

  @ApiPropertyOptional({ description: 'Capacity with units (e.g., "1.5 tons", "80,000 BTU/h")' })
  capacity?: string;

  @ApiPropertyOptional({ description: 'Efficiency rating' })
  efficiency?: string;

  @ApiPropertyOptional({ description: 'Efficiency unit (SEER, AFUE, EER, etc.)' })
  efficiency_unit?: string;

  @ApiPropertyOptional({ description: 'Estimated operating hours per week' })
  weekly_hours?: number;

  @ApiPropertyOptional({ description: 'Operating days per week' })
  days_per_week?: number;

  @ApiPropertyOptional({ description: 'Estimated annual kWh consumption' })
  annual_kwh?: number;

  @ApiPropertyOptional({ description: 'Estimated annual operating hours' })
  annual_hours?: number;

  @ApiPropertyOptional({ description: 'Input rating (e.g., BTU/h for heaters)' })
  input_rating?: number;

  @ApiPropertyOptional({ description: 'Flow rate for water equipment (e.g., "1.5 gpm")' })
  flow_rate?: string;

  @ApiPropertyOptional({ description: 'Temperature rise for water heaters' })
  temperature_rise?: number;

  @ApiPropertyOptional({ description: 'Load factor (0-1)' })
  load_factor?: number;

  @ApiPropertyOptional({ description: 'Confidence in the extraction (0-1)' })
  confidence?: number;

  @ApiPropertyOptional({ description: 'List of assumptions made' })
  assumptions?: string[] | Record<string, any>;

  @ApiPropertyOptional({ description: 'Recommendations for the equipment' })
  recommendations?: string;

  @ApiPropertyOptional({ description: 'End use category for energy breakdown' })
  end_use_category?: string;

  @ApiPropertyOptional({ description: 'Type of lamp (LED, CFL, T-8, etc.)' })
  lamp_type?: string;

  @ApiPropertyOptional({ description: 'Multiplier' })
  multiplier?: number;

  @ApiPropertyOptional({ description: 'Specifications' })
  specifications?: {
    lampsPerFixture?: number;
    mountingDetails?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Control strategy' })
  control_strategy?: string;

  @ApiPropertyOptional({ description: 'Mounting type' })
  mounting_type?: string;

  @ApiPropertyOptional({ description: 'Operating status (e.g., "always on", "off")' })
  operating_status?: string;

  // HVAC-specific fields
  @ApiPropertyOptional({ description: 'Cooling capacity in tons' })
  cooling_capacity_tons?: number;

  @ApiPropertyOptional({ description: 'Heating capacity in MBH (1000 BTU/h)' })
  heating_capacity_mbh?: number;

  @ApiPropertyOptional({ description: 'Fuel type (Electric, Gas, etc.)' })
  fuel_type?: string;

  @ApiPropertyOptional({ description: 'What the equipment serves (e.g., "2-bedroom Apts")' })
  serves?: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Year of manufacture' })
  year?: number;

  @ApiPropertyOptional({ description: 'Age in years' })
  age?: number;

  @ApiPropertyOptional({ description: 'Annual therms consumption (for gas equipment)' })
  annual_therms?: number;
  
  @ApiPropertyOptional({ description: 'CFM (Cubic Feet per Minute) for ventilation equipment' })
  cfm?: number;
  
  // Pumps/Motors-specific fields
  @ApiPropertyOptional({ description: 'Motor horsepower' })
  motor_hp?: number;
  
  @ApiPropertyOptional({ description: 'Pump/motor horsepower' })
  horsepower?: number;
  
  @ApiPropertyOptional({ description: 'Pump/motor application (e.g., "Chilled Water Pump", "Boiler Pump")' })
  application?: string;
  
  // DHW-specific fields
  @ApiPropertyOptional({ description: 'Capacity in gallons for water heaters' })
  capacity_gallons?: number;
  
  @ApiPropertyOptional({ description: 'Input BTU per hour for water heaters' })
  input_btu_per_hour?: number;

  @ApiPropertyOptional({ description: 'Efficiency ratings' })
  efficiency_ratings?: {
    seer?: number;
    eer?: number;
    hspf?: number;
    afue?: number;
    [key: string]: any;
  };
}

// Flag class for warnings and errors
export class FlagDto {
  @ApiProperty({ description: 'Type of flag', example: 'warning' })
  type: string;

  @ApiProperty({ description: 'Message describing the flag' })
  message: string;

  @ApiProperty({
    description: 'Severity level of the flag',
    enum: ['info', 'warning', 'error']
  })
  severity: 'info' | 'warning' | 'error';
}

// Metadata class
export class MetadataDto {
  @ApiProperty({ description: 'Timestamp when processing completed' })
  processedAt: string;

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Confidence score (0-1) of the processing results',
    minimum: 0,
    maximum: 1
  })
  confidence: number;
}

// Building information class
export class BuildingInfoDto {
  @ApiPropertyOptional({ description: 'Building type' })
  type?: string;

  @ApiPropertyOptional({ description: 'Building type (alias for type)' })
  building_type?: string;

  @ApiPropertyOptional({ description: 'Total number of units in building' })
  total_units?: number;

  @ApiPropertyOptional({ description: 'Number of floors' })
  floors?: number;

  @ApiPropertyOptional({ description: 'Building address' })
  address?: string;
  unit_types: boolean;
}

// Main response class
export class FieldNotesResponseDto {
  @ApiProperty({
    description: 'Array of equipment items extracted from field notes',
    type: [EquipmentItemDto]
  })
  equipment: EquipmentItemDto[];

  @ApiProperty({
    description: 'Array of processing flags, warnings, or errors',
    type: [FlagDto]
  })
  flags: FlagDto[];

  @ApiProperty({
    description: 'Metadata about the processing operation',
    type: MetadataDto
  })
  metadata: MetadataDto;

  @ApiPropertyOptional({
    description: 'Building information extracted from field notes',
    type: BuildingInfoDto
  })
  building_info?: BuildingInfoDto;
}

// Get field notes response class
export class GetFieldNotesResponseDto {
  @ApiPropertyOptional({ description: 'Raw field notes text' })
  raw_notes?: string;

  @ApiProperty({
    description: 'Array of equipment items extracted from field notes',
    type: [EquipmentItemDto]
  })
  equipment: EquipmentItemDto[];

  @ApiPropertyOptional({
    description: 'Building information extracted from field notes',
    type: BuildingInfoDto
  })
  building_info?: BuildingInfoDto;
}
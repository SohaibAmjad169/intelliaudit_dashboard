import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for end-use component data in energy breakdown
 */
export class EndUseComponentDto {
  @ApiProperty({ description: 'Name of the end use category' })
  name: string;

  @ApiProperty({ description: 'Percentage of electric usage for this category' })
  electricPercent: number;

  @ApiProperty({ description: 'Percentage of gas usage for this category' })
  gasPercent: number;

  @ApiProperty({ description: 'Percentage of steam usage for this category' })
  steamPercent: number;

  @ApiProperty({ description: 'Percentage of other energy source usage for this category' })
  otherPercent: number;

  @ApiProperty({ description: 'Annual electric usage in kWh for this category' })
  electricKwh: number;

  @ApiProperty({ description: 'Annual gas usage in therms for this category' })
  gasTherms: number;

  @ApiProperty({ description: 'Annual steam usage in MMBtu for this category' })
  steamMMBtu: number;

  @ApiProperty({ description: 'Annual other energy source usage in MMBtu for this category' })
  otherMMBtu: number;

  @ApiProperty({ description: 'Standard percentage for this category (for multifamily)', required: false })
  standardPercent?: number;

  @ApiProperty({ description: 'Explanation for deviation from standard percentage', required: false })
  deviationExplanation?: string;
}

/**
 * DTO for complete energy breakdown response
 */
export class EnergyBreakdownDto {
  @ApiProperty({
    description: 'List of end use components with their energy breakdowns',
    type: [EndUseComponentDto]
  })
  endUseComponents: EndUseComponentDto[];

  @ApiProperty({ description: 'Total annual electric usage in kWh' })
  totalActualElectric: number;

  @ApiProperty({ description: 'Total annual gas usage in therms' })
  totalActualGas: number;

  @ApiProperty({ description: 'Total annual steam usage in MMBtu' })
  totalActualSteam: number;

  @ApiProperty({ description: 'Total annual other energy source usage in MMBtu' })
  totalActualOther: number;

  @ApiProperty({
    description: 'Flag indicating that no actual utility data was available',
    required: false
  })
  noUtilityDataAvailable?: boolean;
}

/**
 * DTO for saving energy breakdown data to database
 */
export class SaveEnergyBreakdownDto {
  @ApiProperty({ description: 'Project ID to associate the energy breakdown with' })
  projectId: string;

  @ApiProperty({ description: 'Serialized energy breakdown data' })
  breakdownData: string;

  @ApiProperty({ description: 'Model used to generate the energy breakdown' })
  model: string;

  @ApiProperty({ description: 'Timestamp when the breakdown was created' })
  createdAt: Date;
}
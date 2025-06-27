import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Portfolio Manager property data
 */
export class PortfolioManagerPropertyDto {
  @ApiProperty({ description: 'Property ID in Portfolio Manager' })
  id: string;

  @ApiProperty({ description: 'Property name' })
  name: string;

  @ApiProperty({ description: 'Property address' })
  address: string;

  @ApiProperty({ description: 'Property city' })
  city: string;

  @ApiProperty({ description: 'Property state' })
  state: string;

  @ApiProperty({ description: 'Property postal code' })
  postalCode: string;

  @ApiProperty({ description: 'Property primary function' })
  primaryFunction?: string;

  @ApiProperty({ description: 'Property gross floor area' })
  grossFloorArea?: number;

  @ApiProperty({ description: 'Property year built' })
  yearBuilt?: number;

  @ApiProperty({ description: 'Associated project ID', required: false })
  projectId?: string;
}

/**
 * DTO for Portfolio Manager property response
 */
export class PortfolioManagerPropertyResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Property data', type: PortfolioManagerPropertyDto, required: false })
  data?: PortfolioManagerPropertyDto;

  @ApiProperty({ description: 'Error message if any', required: false })
  error?: string;
}

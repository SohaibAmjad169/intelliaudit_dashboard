import { ApiProperty } from '@nestjs/swagger';

export class PortfolioManagerMetrics {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Project ID' })
  project_id: string;

  @ApiProperty({ description: 'Year' })
  year: number | null;

  @ApiProperty({ description: 'Month' })
  month: number | null;

  @ApiProperty({ description: 'ENERGY STAR Score (1-100)' })
  energy_star_score: number | null;

  @ApiProperty({ description: 'Site total energy (kBtu)' })
  site_total_energy: number | null;

  @ApiProperty({ description: 'Source total energy (kBtu)' })
  source_total_energy: number | null;

  @ApiProperty({ description: 'Site energy intensity (kBtu/ft²)' })
  site_intensity: number | null;

  @ApiProperty({ description: 'Source energy intensity (kBtu/ft²)' })
  source_intensity: number | null;

  @ApiProperty({ description: 'Direct greenhouse gas emissions (metric tons CO2e)' })
  direct_ghg_emissions: number | null;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at: Date | null;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at: Date | null;
}

export interface PortfolioManagerMetricsInput {
  project_id: string;
  year: number;
  month: number;
  energy_star_score?: number;
  site_total_energy?: number;
  source_total_energy?: number;
  site_intensity?: number;
  source_intensity?: number;
  direct_ghg_emissions?: number;
  water_score?: number;
}

// Extended metrics with additional fields for the frontend
export interface ExtendedPortfolioManagerMetrics extends PortfolioManagerMetrics {
  annual_electricity?: number; // kWh
  annual_natural_gas?: number; // therms
  annual_energy_cost?: number; // dollars
  water_score?: number; // 1-100
  water_wui?: number; // gallons/ft²
  annual_water_use?: number; // gallons
  annual_water_cost?: number; // dollars
} 
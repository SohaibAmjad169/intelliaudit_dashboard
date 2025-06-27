export interface PortfolioManagerMetricsResponse {
  id: string;
  project_id: string;
  year: number;
  month: number;
  energy_star_score: number | null;
  site_total_energy: number;
  source_total_energy: number;
  site_intensity: number;
  direct_ghg_emissions: number;
  annual_electricity: number | null;
  annual_natural_gas: number | null;
  annual_energy_cost: number;
  water_wui: number | null;
  annual_water_use: number | null;
  annual_water_cost: number | null;
} 
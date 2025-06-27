import { apiClient } from '../common/api-client';

export interface EquipmentSpecifications {
  capacity?: string;
  efficiency?: {
    cooling?: string;
    heating?: string;
  };
  refrigerantType?: string;
  voltage?: string;
  phase?: string;
  wattage?: number;
  fuelType?: string;
}

export interface EquipmentCondition {
  overall: 'Good' | 'Fair' | 'Poor';
  visibleIssues: string[];
  estimatedAge?: string;
  remainingLife?: string;
}

export interface EquipmentLocation {
  room?: string;
  floor?: string;
}

export interface EquipmentAnalysisItem {
  id?: string;
  project_id: string;
  equipment_type?: string;
  manufacturer?: string;
  model?: string;
  category?: string;
  quantity?: number;
  wattage?: number;
  capacity?: string;
  operating_hours?: number;
  days_per_week?: number;
  annual_kwh?: number;
  notes?: string;
  confidence?: number;
  specifications?: EquipmentSpecifications;
  condition?: EquipmentCondition;
  location?: EquipmentLocation | string;
  load_factor?: string | number;
  control_strategy?: string;
  serial_number?: string;
  weekly_hours?: number;
  annual_hours?: number;
  formula_used?: string;
  work_shown?: string;
  recommendations?: string;
  is_per_unit?: boolean;
  multiplier?: number;
  
  // New fields from our schema update
  voltage?: string;
  phase?: string;
  fuel_type?: string;
  cooling_efficiency?: string;
  heating_efficiency?: string;
  equipment_age?: number;
  installation_date?: string;
  maintenance_schedule?: string;
  replacement_cost?: number;
  expected_lifetime?: number;
  
  // HVAC specific fields
  refrigerant_type?: string;
  airflow_rate?: number;
  
  // Lighting specific fields
  lumens?: number;
  color_temperature?: number;
  lighting_type?: string;
  
  // Water fixture specific fields
  flow_rate_gpm?: number;
  water_usage_annual?: number;
  
  // DHW specific fields
  recovery_rate?: number;
  standby_loss?: number;
  
  // Laundry specific fields
  cycles_per_week?: number;
  water_usage_per_cycle?: number;
  
  // Irrigation specific fields
  irrigation_area?: number;
  irrigation_schedule?: string;
  
  // Appliance specific fields
  energy_star_rated?: boolean;
  annual_therms?: number;
  
  // Photo fields
  photo_url?: string;
  thumbnail_url?: string;
  photo_filename?: string;
  photos?: any;
}

class EquipmentAnalysisService {
  /**
   * Get all equipment analysis records for a project
   */
  async getByProject(projectId: string): Promise<EquipmentAnalysisItem[]> {
    try {
      console.log(`EquipmentAnalysisService: Fetching equipment for project ${projectId}`);
      const response = await apiClient.get<EquipmentAnalysisItem[]>(`/equipment-prisma/project/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error fetching equipment by project:', error);
      throw error;
    }
  }

  /**
   * Get equipment analysis by ID
   */
  async getById(id: string): Promise<EquipmentAnalysisItem | null> {
    try {
      return await apiClient.get<EquipmentAnalysisItem>(`/equipment-analysis/${id}`);
    } catch (error) {
      console.error('Error fetching equipment by ID:', error);
      return null;
    }
  }

  /**
   * Create a new equipment analysis record
   */
  async create(data: EquipmentAnalysisItem): Promise<EquipmentAnalysisItem | null> {
    try {
      return await apiClient.post<EquipmentAnalysisItem>('/equipment-analysis', data);
    } catch (error) {
      console.error('Error creating equipment analysis:', error);
      return null;
    }
  }

  /**
   * Update an equipment analysis record
   */
  async update(id: string, data: EquipmentAnalysisItem): Promise<EquipmentAnalysisItem | null> {
    try {
      return await apiClient.put<EquipmentAnalysisItem>(`/equipment-analysis/${id}`, data);
    } catch (error) {
      console.error('Error updating equipment analysis:', error);
      return null;
    }
  }

  /**
   * Delete an equipment analysis record
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/equipment-analysis/${id}`);
    } catch (error) {
      console.error('Error deleting equipment analysis:', error);
    }
  }

  /**
   * Get equipment analysis records by category
   */
  async getByCategory(projectId: string, category: string): Promise<EquipmentAnalysisItem[]> {
    try {
      return await apiClient.get<EquipmentAnalysisItem[]>(`/equipment-analysis/project/${projectId}/category/${category}`);
    } catch (error) {
      console.error('Error fetching equipment by category:', error);
      return [];
    }
  }

  /**
   * Get equipment analysis records by equipment type
   */
  async getByEquipmentType(projectId: string, equipmentType: string): Promise<EquipmentAnalysisItem[]> {
    try {
      return await apiClient.get<EquipmentAnalysisItem[]>(`/equipment-analysis/project/${projectId}/type?type=${encodeURIComponent(equipmentType)}`);
    } catch (error) {
      console.error('Error fetching equipment by type:', error);
      return [];
    }
  }

  /**
   * Calculate energy usage for all equipment in a project
   */
  async calculateProjectEnergy(projectId: string): Promise<{
    totalKwh: number;
    totalTherms: number;
    energyByCategory: Record<string, { kwh: number; therms: number; count: number }>;
    equipmentCount: number;
  } | null> {
    try {
      return await apiClient.get<{
        totalKwh: number;
        totalTherms: number;
        energyByCategory: Record<string, { kwh: number; therms: number; count: number }>;
        equipmentCount: number;
      }>(`/equipment-analysis/project/${projectId}/energy`);
    } catch (error) {
      console.error('Error calculating project energy:', error);
      return null;
    }
  }
}

export const equipmentAnalysisService = new EquipmentAnalysisService();

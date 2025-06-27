import { apiClient } from '../common/api-client';
import { EquipmentItem } from '../../features/energy/types';
import { EquipmentAnalysis } from '../../types/equipment-analysis';
import { EnrichedEquipment } from '../../types/equipment';
import { equipmentAnalysisService, EquipmentAnalysisItem } from '../equipment/equipment-analysis';
import { normalizeUUID } from '../common/uuid-helpers';
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

// Utility functions for energy calculations
const calculateAnnualHours = (weeklyHours: number | undefined): number => {
  if (!weeklyHours) return 0;
  return weeklyHours * 52;
};

function calculateAnnualKwh(item: EquipmentAnalysisItem | EquipmentItem): number {
  if (item.annual_kwh) return item.annual_kwh;
  
  const wattage = item.wattage || 0;
  const weeklyHours = item.weekly_hours || 0;
  const annualHours = calculateAnnualHours(weeklyHours);
  
  const wattageNum = typeof wattage === 'string' ? parseFloat(wattage) || 0 : wattage || 0;
  return (wattageNum * annualHours) / 1000;
}

export const equipmentV2Service = {
  /**
   * Get equipment analysis data for a project
   * @param projectId - The project ID
   * @returns Array of equipment analysis items
   */
  async getEquipmentAnalysis(projectId: string): Promise<EquipmentAnalysis[]> {
    const result = await apiClient.get<{ data: EquipmentAnalysis[] }>(`projects/${projectId}/equipment-analysis`);
    return result.data || [];
  },

  /**
   * Get enriched equipment data for a project
   * @param projectId - The project ID
   * @returns Array of enriched equipment items
   */
  async getEnrichedEquipment(projectId: string): Promise<EnrichedEquipment[]> {
    return apiClient.get<EnrichedEquipment[]>(`equipment/enriched/${projectId}`);
  },

  /**
   * Trigger the equipment data enrichment process
   * @param projectId - The project ID
   * @returns The enriched equipment data
   */
  async enrichEquipmentData(projectId: string): Promise<EnrichedEquipment[]> {
    return apiClient.post<EnrichedEquipment[]>(`equipment/enrich/${projectId}`);
  },
  /**
   * Get all equipment for a project
   * @param projectId Project ID
   * @returns Array of equipment items
   */
  async getAllEquipment(projectId: string): Promise<EquipmentItem[]> {
    try {
      console.log(`Fetching equipment for project: ${projectId}`);
      const data = await equipmentAnalysisService.getByProject(projectId);
      console.log(`Raw equipment data received:`, data ? `${data.length} items` : 'no data');
      if (!data) return [];
      
      // Transform the data to match the EquipmentItem type
      const transformedData = data.map(item => {
        // Calculate weekly hours from days_per_week and hours_per_day if available
        const daysPerWeek = item.days_per_week ? 
          (typeof item.days_per_week === 'string' ? parseFloat(item.days_per_week) : item.days_per_week) : 7;
        const hoursPerDay = (item as any).hours_per_day ? 
          parseFloat((item as any).hours_per_day as string) : 24;
        const calculatedWeeklyHours = daysPerWeek * hoursPerDay;

        return {
          id: item.id || `temp-${Date.now()}-${Math.random()}`, // Ensure ID is always present
          equipment_type: item.equipment_type || '',
          category: item.category || 'Other',
          location: typeof item.location === 'string' ? item.location : item.location?.room || '',
          quantity: item.quantity || 1,
          wattage: item.wattage || 0,
          weekly_hours: item.weekly_hours || calculatedWeeklyHours,
          annual_hours: item.annual_hours || calculateAnnualHours(item.weekly_hours || calculatedWeeklyHours),
          annual_kwh: item.annual_kwh || calculateAnnualKwh({...item, weekly_hours: item.weekly_hours || calculatedWeeklyHours}),
          annual_therms: (() => {
            const rawValue = item.annual_therms;
            const isDefined = rawValue !== undefined && rawValue !== null;
            const numValue = isDefined ? Number(rawValue) : undefined;
            console.log(`Item ${item.id} mapping annual_therms: raw='${rawValue}', isDefined=${isDefined}, numValue=${numValue}`);
            return numValue;
          })(),
          is_per_unit: item.is_per_unit || false,
          manufacturer: item.manufacturer || '',
          model: item.model || '',
          capacity: item.capacity || '',
          notes: item.notes || '',
          recommendations: item.recommendations || '',
          confidence: item.confidence || 0,
          source_type: 'field_notes',
          formula_used: item.formula_used || '',
          work_shown: item.work_shown || '',
          specifications: item.specifications || {},
          photo_url: item.photo_url || '',
          serial_number: item.serial_number || '',
          lamps_per_fixture: (item as any).lamps_per_fixture !== undefined ? Number((item as any).lamps_per_fixture) : undefined,
          number_of_lamps: (item as any).number_of_lamps || 
            ((item.quantity && (item as any).lamps_per_fixture) ? 
              Math.round(Number(item.quantity) * Number((item as any).lamps_per_fixture)) : 
              undefined),
          multiplier: item.multiplier || 1.0,
          end_use_category: (item as any).end_use_category || undefined,
          lamp_type: (item as any).lamp_type || undefined
        };
      });
      
      console.log(`Transformed equipment data:`, transformedData.length, 'items');
      // Log the first few items to check data quality
      if (transformedData.length > 0) {
        console.log('Sample equipment:', transformedData.slice(0, 2));
      }
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  },

  /**
   * Get a single equipment item by ID
   * @param id Equipment ID
   * @returns Equipment item
   */
  async getEquipmentById(id: string): Promise<EquipmentItem | null> {
    try {
      // Normalize the UUID before making the API call
      const normalizedId = normalizeUUID(id);
      const data = await apiClient.get<EquipmentItem>(`equipment-prisma/item/${normalizedId}`);
      return data;
    } catch (error) {
      console.error('Error fetching equipment by ID:', error);
      return null;
    }
  },

  /**
   * Create a new equipment item
   * @param equipmentData Equipment data
   * @returns Created equipment item
   */
  async createEquipment(equipmentData: Partial<EquipmentItem>): Promise<EquipmentItem | null> {
    try {
      const data = await apiClient.post<EquipmentItem>('equipment-prisma', equipmentData);
      return data;
    } catch (error) {
      console.error('Error creating equipment:', error);
      return null;
    }
  },

  /**
   * Update an existing equipment item
   * @param id Equipment ID
   * @param equipmentData Updated equipment data
   * @returns Updated equipment item
   */
  async updateEquipment(id: string, equipmentData: Partial<EquipmentItem>): Promise<EquipmentItem | null> {
    try {
      // Normalize the UUID before making the API call
      const normalizedId = normalizeUUID(id);
      const data = await apiClient.put<EquipmentItem>(`equipment-prisma/${normalizedId}`, equipmentData);
      return data;
    } catch (error) {
      console.error('Error updating equipment:', error);
      return null;
    }
  },

  /**
   * Delete an equipment item
   * @param id Equipment ID
   * @returns Success message
   */
  async deleteEquipment(id: string): Promise<{ success: boolean; message: string } | null> {
    try {
      // Normalize the UUID before making the API call
      const normalizedId = normalizeUUID(id);
      await apiClient.delete(`equipment-prisma/${normalizedId}`);
      return { success: true, message: 'Equipment deleted successfully' };
    } catch (error) {
      console.error('Error deleting equipment:', error);
      return null;
    }
  },

  /**
   * Bulk update equipment items
   * @param projectId Project ID
   * @param equipmentItems Array of equipment items to update
   * @returns Updated equipment items
   */
  async bulkUpdateEquipment(
    projectId: string, 
    equipmentItems: Partial<EquipmentItem>[]
  ): Promise<EquipmentItem[] | null> {
    try {
      const data = await apiClient.put<EquipmentItem[]>(`equipment-prisma/bulk/${projectId}`, equipmentItems);
      return data;
    } catch (error) {
      console.error('Error bulk updating equipment:', error);
      return null;
    }
  },

  /**
   * Get multiple equipment items by their IDs in a single batch request
   * @param ids Array of equipment IDs
   * @returns Array of equipment items
   */
  async batchGetEquipment(ids: string[]): Promise<EquipmentItem[]> {
    try {
      const response = await apiClient.post<EquipmentItem[]>('equipment-prisma/batch', { ids });
      return response || [];
    } catch (error) {
      console.error('Error fetching equipment batch:', error);
      return [];
    }
  }
};

import { apiClient } from "../common/api-client"

// Types for water efficiency data
export interface WaterEfficiencyMeasure {
  id: string
  title: string
  existingCondition: string
  recommendation: string
  benefits: {
    title: string
    description: string
  }[]
  pricingNote?: string
  images?: {
    existingImage?: string
    replacementImage?: string
    existingCaption?: string
    replacementCaption?: string
  }
  estimatedSavings?: {
    cost: number
    water: number
    energy: number
    therms: number
  }
  implementationCost?: number
  incentives?: number
  paybackPeriod?: number
  usefulLife?: number
}

export interface WaterEfficiencyData {
  recommendations: WaterEfficiencyMeasure[]
  implemented: WaterEfficiencyMeasure[]
  planned: WaterEfficiencyMeasure[]
}

export interface WaterFixture {
  type: string
  flowRate: number
  unit: string
  quantity: number
}

export interface WaterConditionsData {
  fixtures: WaterFixture[]
  outdoor: {
    turfArea: number
    treesAndShrubsArea: number
    hasSprinklers: boolean
    hasDripIrrigation: boolean
  }
  leaksObserved: boolean
}

/**
 * Service for water efficiency measures data
 */
class WaterAuditService {
  /**
   * Fetch water efficiency measures data
   * @param projectId - The project ID to fetch data for
   * @returns Promise with water efficiency data
   */
  async fetchWaterEfficiencyData(projectId: string): Promise<WaterEfficiencyData> {
    try {
      // The API endpoint should match your backend implementation
      return await apiClient.get<WaterEfficiencyData>(`projects/${projectId}/water-efficiency-measures`)
    } catch (error) {
      console.error("Error fetching water efficiency data:", error)
      throw error // Let the component handle the error
    }
  }
  /**
   * Fetch water efficiency measures data
   * @param projectId - The project ID to fetch data for
   * @returns Promise with water efficiency data
   */
  async fetchMeasures(projectId: string): Promise<any> {
    try {
      // The API endpoint should match your backend implementation
      return await apiClient.get<any>(`measures/${projectId}`)
    } catch (error) {
      console.error("Error fetching water efficiency data:", error)
      throw error // Let the component handle the error
    }
  }

  /**
   * Fetch water conditions data
   * @param projectId - The project ID to fetch data for
   * @returns Promise with water conditions data
   */
  async fetchWaterConditionsData(projectId: string): Promise<WaterConditionsData> {
    try {
      // The API endpoint should match your backend implementation
      return await apiClient.get<WaterConditionsData>(`projects/${projectId}/water-conditions`)
    } catch (error) {
      console.error("Error fetching water conditions data:", error)
      throw error // Let the component handle the error
    }
  }
}

export const waterAuditService = new WaterAuditService()

import { apiClient } from '@/services/common/api-client';

export interface DeduplicationResult {
  totalProcessed: number;
  uniqueRecords: number;
  mergedDuplicates: number;
}

export interface CompletenessResult {
  id: string;
  equipment_type: string;
  category: string;
  completenessScore: number;
  missingFields: string[];
  missingCriticalFields: string[];
  hasCriticalGaps: boolean;
}

export interface CompletenessCheckResult {
  overallCompleteness: number;
  equipmentResults: CompletenessResult[];
  equipmentWithCriticalGaps: number;
  totalEquipment: number;
}

export interface EnrichmentResult {
  totalProcessed: number;
  successfullyEnriched: number;
  failedEnrichment: number;
}

export interface ConsolidationResult {
  deduplicationResults: DeduplicationResult;
  initialCompletenessResults: CompletenessCheckResult;
  enrichmentResults: EnrichmentResult;
  finalCompletenessResults: CompletenessCheckResult;
  aiAnalysisResult: any;
  success: boolean;
  message: string;
}

class EquipmentConsolidationService {
  /**
   * Deduplicate equipment for a project
   */
  async deduplicateEquipment(projectId: string): Promise<DeduplicationResult> {
    const response = await apiClient.post<DeduplicationResult>(`/equipment-consolidation/project/${projectId}/deduplicate`);
    return response;
  }

  /**
   * Check equipment completeness for a project
   */
  async checkEquipmentCompleteness(projectId: string): Promise<CompletenessCheckResult> {
    const response = await apiClient.get<CompletenessCheckResult>(`/equipment-consolidation/project/${projectId}/completeness`);
    return response;
  }

  /**
   * Update equipment completeness status in the database
   */
  async updateCompletenessStatus(projectId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`/equipment-consolidation/project/${projectId}/update-completeness`);
    return response;
  }

  /**
   * Get equipment with critical data gaps
   */
  async getEquipmentWithCriticalGaps(projectId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/equipment-consolidation/project/${projectId}/critical-gaps`);
    return response;
  }

  /**
   * Enrich equipment data using manufacturer databases
   */
  async enrichEquipmentData(equipmentId: string): Promise<any> {
    const response = await apiClient.post<any>(`/equipment-consolidation/equipment/${equipmentId}/enrich`);
    return response;
  }

  /**
   * Enrich all equipment with critical gaps for a project
   */
  async enrichProjectEquipment(projectId: string): Promise<EnrichmentResult> {
    const response = await apiClient.post<EnrichmentResult>(`/equipment-consolidation/project/${projectId}/enrich-all`);
    return response;
  }

  /**
   * Run the complete consolidation workflow
   */
  async consolidateProjectEquipment(projectId: string): Promise<ConsolidationResult> {
    const response = await apiClient.post<ConsolidationResult>(`/equipment-consolidation/project/${projectId}/consolidate`);
    return response;
  }
}

export const equipmentConsolidationService = new EquipmentConsolidationService();

import { ApiError } from '../common/errors';
import { apiClient } from '../common/api-client';
import { AnalysisBatchStatus } from './types';
import type { EquipmentAnalysis } from '@/types/equipment-analysis';

type AIModel = 'o1' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';

// Re-export the type for convenience
export type { EquipmentAnalysis };

export const equipmentPhotoService = {
  /**
   * Process a batch of photos
   */
  processBatch: async (
    files: File[],
    projectId: string,
    batchNumber: number,
    totalBatches: number,
    model: AIModel
  ): Promise<{ success: boolean; analysis?: EquipmentAnalysis }> => {
    const batchId = `batch-${Date.now()}-${batchNumber}`;
    console.log(`[processBatch:${batchId}] Processing batch ${batchNumber}/${totalBatches}:`, {
      count: files.length,
      totalSize: `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)}MB`,
      files: files.map(f => ({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(2)}MB`, type: f.type }))
    });

    const formData = new FormData();
    files.forEach((file) => {
      console.log(`[processBatch:${batchId}] Adding file to batch: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB, ${file.type})`);
      formData.append('files', file);
    });
    formData.append('projectId', projectId);
    formData.append('model', model);

    console.log(`[processBatch:${batchId}] Preparing to send batch to API endpoint 'equipment-prisma/photos/analyze'`);
    const startTime = Date.now();

    try {
      console.log(`[processBatch:${batchId}] Sending API request...`);
      const response = await apiClient.postFormData<{
        success: boolean;
        processed: number;
        total: number;
        results: Array<{
          filename: string;
          analysis: {
            success: boolean;
            analysis?: EquipmentAnalysis;
          };
        }>;
        errors: Array<{
          filename: string;
          error: string;
        }>;
      }>('equipment-prisma/photos/analyze', formData);

      const duration = Date.now() - startTime;
      console.log(`[processBatch:${batchId}] API response received in ${duration}ms:`, {
        success: response.success,
        processed: response.processed,
        total: response.total,
        errors: response.errors?.length,
        resultsCount: response.results?.length || 0,
        firstResultSuccess: response.results?.[0]?.analysis?.success
      });

      if (response.errors && response.errors.length > 0) {
        console.warn(`[processBatch:${batchId}] Errors in batch:`, response.errors);
      }

      if (!response.success) {
        console.error(`[processBatch:${batchId}] Batch failed with success=false`);
        throw new ApiError('Failed to process photos');
      }

      // Return the first successful analysis for backward compatibility
      const firstAnalysis = response.results?.[0]?.analysis?.analysis;
      console.log(`[processBatch:${batchId}] Returning result with firstAnalysis:`, {
        hasAnalysis: !!firstAnalysis,
        analysisType: firstAnalysis ? typeof firstAnalysis : 'none'
      });

      return {
        success: response.success,
        analysis: firstAnalysis
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[processBatch:${batchId}] Batch failed after ${duration}ms:`, error);
      console.error(`[processBatch:${batchId}] Error details:`, {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data'
      });
      throw new ApiError((error as Error).message || 'Failed to process photos');
    }
  },

  /**
   * Process multiple photos using the batch endpoint
   */
  processPhotos: async (
    files: File[],
    projectId: string,
    model: AIModel = 'gpt-4o',
    onBatchProgress?: (batchNumber: number) => void
  ): Promise<{ success: boolean; analysis?: EquipmentAnalysis }> => {
    console.log('[equipmentPhotoService] Starting processPhotos', {
      fileCount: files.length,
      projectId,
      model,
      totalSize: `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)}MB`
    });

    if (files.length === 0) {
      console.error('[equipmentPhotoService] No files provided');
      throw new Error('No files provided');
    }

    const MAX_BATCH_SIZE = 10; // Maximum files to send in a single batch
    const totalBatches = Math.ceil(files.length / MAX_BATCH_SIZE);
    console.log('[equipmentPhotoService] Processing plan', { totalBatches, MAX_BATCH_SIZE });

    let lastResult: { success: boolean; analysis?: EquipmentAnalysis } = { success: false };
    let successfulBatches = 0;
    let failedBatches = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += MAX_BATCH_SIZE) {
      const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1;
      const batchFiles = files.slice(i, i + MAX_BATCH_SIZE);

      console.log(`[equipmentPhotoService] Starting batch ${batchNumber}/${totalBatches}`, {
        batchSize: batchFiles.length,
        batchSizeMB: `${(batchFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)}MB`
      });

      try {
        console.log(`[equipmentPhotoService] Calling processBatch for batch ${batchNumber}`);
        const result = await equipmentPhotoService.processBatch(
          batchFiles,
          projectId,
          batchNumber,
          totalBatches,
          model
        );

        console.log(`[equipmentPhotoService] Batch ${batchNumber} completed`, {
          success: result.success,
          hasAnalysis: !!result.analysis
        });

        // Keep track of the last successful result
        if (result.success) {
          lastResult = result;
          successfulBatches++;
        }

        if (onBatchProgress) {
          console.log(`[equipmentPhotoService] Calling onBatchProgress for batch ${batchNumber}`);
          onBatchProgress(batchNumber);
        }
      } catch (error) {
        failedBatches++;
        console.error(`[equipmentPhotoService] Error processing batch ${batchNumber}:`, error);
        console.error('[equipmentPhotoService] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : 'No response data'
        });
        // Continue with next batch instead of failing the entire process
      }
    }

    console.log('[equipmentPhotoService] All batches completed', {
      totalBatches,
      successfulBatches,
      failedBatches,
      overallSuccess: lastResult.success
    });

    return lastResult;
  },

  getBatchStatus: async (batchId: string): Promise<AnalysisBatchStatus> => {
    try {
      return await apiClient.get<AnalysisBatchStatus>(`v1/equipment/photos/analyze/${batchId}/status`);
    } catch (error) {
      console.error('Error getting batch status:', error);
      throw error instanceof ApiError
        ? error
        : new ApiError('Failed to get batch status', error);
    }
  },

  waitForBatchCompletion: async (
    batchId: string,
    onProgress?: (status: AnalysisBatchStatus) => void
  ): Promise<AnalysisBatchStatus> => {
    const poll = async (): Promise<AnalysisBatchStatus> => {
      const status = await equipmentPhotoService.getBatchStatus(batchId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'failed') {
        throw new ApiError(status.error || 'Batch processing failed');
      }

      if (status.status === 'completed') {
        return status;
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      return poll();
    };

    return poll();
  }
};
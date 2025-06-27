import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { getRedisConnection, PhotoAnalysisJobData, PhotoAnalysisResult } from './photo-analysis.queue';
import { PhotoAnalysisPrismaService } from './photo-analysis-prisma.service';

export class PhotoAnalysisWorker {
  private readonly worker: Worker;
  private readonly logger = new Logger(PhotoAnalysisWorker.name);
  
  constructor(
    private readonly photoAnalysisService: PhotoAnalysisPrismaService,
    configService: ConfigService,
  ) {
    // Creating the worker
    const connection = getRedisConnection(configService);
    
    // Get concurrency from env or use a higher default (10)
    // Parse as integer and ensure it's a valid number
    const configConcurrency = configService.get('PHOTO_ANALYSIS_CONCURRENCY');
    const concurrency = configConcurrency ? parseInt(configConcurrency, 10) : 10;
    
    // Ensure concurrency is a valid number (minimum 1)
    const validConcurrency = !isNaN(concurrency) && concurrency > 0 ? concurrency : 10;
    
    
    this.worker = new Worker<PhotoAnalysisJobData, PhotoAnalysisResult>(
      'photo-analysis',
      this.processJob.bind(this),
      {
        connection,
        concurrency: validConcurrency,
        stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      }
    );

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Log when jobs are added to the queue
    this.worker.on('active', (job: Job<PhotoAnalysisJobData, PhotoAnalysisResult>) => {
      this.logger.log(`Job ${job.id} started processing. Filename: ${job.data.originalFilename || job.data.file?.originalname || 'unknown'}`);
    });
    
    this.worker.on('completed', (job: Job<PhotoAnalysisJobData, PhotoAnalysisResult>) => {
      this.logger.log(`Job ${job.id} completed. Filename: ${job.data.originalFilename || job.data.file?.originalname || 'unknown'}. Success: ${job.returnvalue?.success}`);
    });

    this.worker.on('failed', (job: Job<PhotoAnalysisJobData, PhotoAnalysisResult> | undefined, error: Error) => {
      this.logger.error(`Job ${job?.id || 'unknown'} failed. Filename: ${job?.data?.originalFilename || job?.data?.file?.originalname || 'unknown'}`, error.stack);
    });

    this.worker.on('error', (error: Error) => {
      this.logger.error('Worker error:', error.stack);
    });

    this.worker.on('stalled', (jobId: string) => {
      this.logger.warn(`Job ${jobId} stalled and will be reprocessed`);
    });
  }

  private async processJob(job: Job<PhotoAnalysisJobData, PhotoAnalysisResult>): Promise<PhotoAnalysisResult> {
    const { projectId, model, analysisId, photoUrl, originalFilename, file } = job.data;
    
    // Handle both old and new job data formats
    const filename = originalFilename || file?.originalname || 'unknown';
    this.logger.log(`Processing job ${job.id}: ${filename}`);

    try {
      // New job format - uses analysisId and photoUrl
      if (analysisId && photoUrl) {
        // Use the new public method to process the queued analysis
        const result = await this.photoAnalysisService.processQueuedAnalysis(
          analysisId,
          photoUrl,
          filename,
          model
        );
        
        return {
          success: result.success,
          analysis: result.analysis,
          filename
        };
      } 
      // Legacy format - uses file data
      else if (file) {
        // Convert the file data back to Multer format
        const multerFile: Express.Multer.File = {
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: Buffer.from(file.buffer),
          size: file.size,
          fieldname: file.fieldname || 'file',
          encoding: file.encoding || '7bit',
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        // Use the existing analyzePhoto method
        const result = await this.photoAnalysisService.analyzePhoto(projectId, multerFile, model);
        
        return {
          success: result.success,
          analysis: result.analysis,
          filename: file.originalname,
        };
      } else {
        throw new Error('Invalid job data: missing both file and analysisId/photoUrl');
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}:`, error.stack);
      
      return {
        success: false,
        error: error.message,
        filename,
      };
    }
  }

  // Method to gracefully close the worker when the application is shutting down
  async close(): Promise<void> {
    await this.worker.close();
  }
}

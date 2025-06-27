import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../../../../storage/storage.service';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { HttpService } from '@nestjs/axios';
import sharp from 'sharp';

// Define PhotoMetadataResult type
interface PhotoMetadataResult {
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  efficiency?: string;
  efficiencyUnit?: string;
  year?: string;
  condition?: string;
  confidence?: number;
  processingTime?: number;
  suggestedMatches?: JsonSuggestedMatch[];
}

// Add a suggestedMatch interface
interface SuggestedMatch {
  equipmentId: string;
  matchScore: number;
  reasoning: string;
}

type JsonSuggestedMatch = {
  [K in keyof SuggestedMatch]: SuggestedMatch[K];
} & { [key: string]: any };

@Injectable()
export class PhotoMetadataExtractionService {
  private readonly logger = new Logger(PhotoMetadataExtractionService.name);
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly httpService: HttpService,
  ) {
    // Initialize OpenAI client
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      this.logger.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  /**
   * Creates a new photo batch job for processing
   */
  async createBatchJob(projectId: string, params: {
    totalPhotos: number;
    equipmentType?: string;
    priority?: 'high' | 'normal' | 'low';
  }) {
    
    // Handle "any" value for equipment type
    const equipmentType = params.equipmentType === 'any' ? null : params.equipmentType;
    
    return this.prisma.photo_batch_job.create({
      data: {
        project_id: projectId,
        status: 'queued',
        total_photos: params.totalPhotos,
        equipment_type: equipmentType,
        priority: params.priority || 'normal',
      },
    });
  }

  /**
   * Gets a batch job by ID
   */
  async getBatchJob(batchId: string) {
    return this.prisma.photo_batch_job.findUnique({
      where: { id: batchId },
      include: {
        metadata_results: true,
        match_jobs: true,
      },
    });
  }

  /**
   * Lists all batch jobs for a project
   */
  async listBatchJobs(projectId: string) {
    return this.prisma.photo_batch_job.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Updates the status of a batch job
   */
  async updateBatchJobStatus(batchId: string, status: string, processedPhotos?: number) {
    const data: any = { status };
    
    if (processedPhotos !== undefined) {
      data.processed_photos = processedPhotos;
    }
    
    if (status === 'completed' || status === 'failed') {
      data.completed_at = new Date();
    }
    
    return this.prisma.photo_batch_job.update({
      where: { id: batchId },
      data,
    });
  }

  /**
   * Process and extract metadata from photos using GPT-4o-mini
   */
  async processPhotos(batchId: string, photos: Array<{url?: string, id?: string, file?: Express.Multer.File}>) {
    
    // Get the batch job to update its status
    const batchJob = await this.getBatchJob(batchId);
    if (!batchJob) {
      throw new Error(`Batch job ${batchId} not found`);
    }
    
    // Update batch job status to processing
    await this.updateBatchJobStatus(batchId, 'processing');
    
    try {
      let processedCount = 0;
      let heicConversionCount = 0;
      
      // Log information about files being processed
      photos.forEach(photo => {
        if (photo.file) {
          // Log file presence only
          this.logger.debug(`Processing file: ${photo.file.originalname}`);
        }
      });
      
      if (heicConversionCount > 0) {
      }
      
      // Process each photo using OpenAI vision model
      for (const photo of photos) {
        
        try {
          // Determine if this is an uploaded file or a URL
          let photoUrl = photo.url;
          let photoId = photo.id;
          
          // If we have a file, upload it to Supabase storage
          if (photo.file) {
            // Generate a unique filename with the original file extension
            let fileExt = path.extname(photo.file.originalname);
            
            // Check if this is a converted HEIC file and force .jpg extension
            if (photo.file.mimetype === 'image/jpeg' && 
                (photo.file.originalname.toLowerCase().includes('heic') || 
                 photo.file.originalname.includes('converted-from-heic'))) {
              fileExt = '.jpg';
            }
            
            const fileName = `${uuidv4()}${fileExt}`;
            
            // Create a structured path with project ID and batch ID folders
            const filePath = `${batchJob.project_id}/${batchId}/${fileName}`;
            
            
            // Check if this is a converted HEIC file and override the mimetype
            let contentType = photo.file.mimetype;
            if (photo.file.originalname.includes('converted-from-heic') || 
                (photo.file.originalname.toLowerCase().includes('heic') && contentType === 'image/jpeg')) {
              contentType = 'image/jpeg';
            }
            
            // Upload to Supabase storage
            const storageResult = await this.storageService.uploadFile(photo.file, {
              path: filePath,
              bucket: 'equipment-photos',
              contentType: contentType
            });
            
            photoUrl = storageResult.url ?? '';
            photoId = photoId || uuidv4();
            
          }
          
          // Use OpenAI to analyze the image with retry mechanism
          const metadata = await this.extractMetadataWithOpenAIRetry(photoUrl, batchJob.project_id);
          
          // Save the metadata result
          await this.saveMetadataResult(batchId, {
            photoId,
            photoUrl,
            ...metadata
          });
          
          // Update processed count
          processedCount++;
          
          // Update batch job with new processed count
          await this.updateBatchJobStatus(batchId, 'processing', processedCount);
          
        } catch (error) {
          this.logger.error(`Error processing photo: ${error.message}`);
          // Continue with next photo even if one fails
        }
      }
      
      // Complete the batch job
      await this.updateBatchJobStatus(batchId, 'completed', processedCount);
      
      return {
        success: true,
        processed: processedCount,
        total: photos.length
      };
    } catch (error) {
      this.logger.error(`Error processing photos for batch ${batchId}: ${error.message}`, error.stack);
      
      // Update batch job status to failed
      await this.updateBatchJobStatus(batchId, 'failed');
      
      throw error;
    }
  }
  
  /**
   * Extract metadata from an image using OpenAI's Vision model with retry logic
   */
  private async extractMetadataWithOpenAIRetry(
    imageUrl: string | undefined, 
    projectId: string, 
    maxRetries = 3, 
    initialDelay = 2000
  ): Promise<PhotoMetadataResult> {
    if (!imageUrl) {
      this.logger.error('No image URL provided for metadata extraction');
      throw new Error('No image URL provided for metadata extraction');
    }
    
    let lastError: any;
    let currentImageUrl = imageUrl; // Create a mutable copy that won't be undefined
    
    // Try up to maxRetries times with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        // Check for unsupported image format and convert if needed
        const urlLower = currentImageUrl.toLowerCase();
        if (urlLower.includes('.heic') && attempt === 1) { // Only try conversion on first attempt
          this.logger.warn(`Detected HEIC image, which OpenAI doesn't support. Attempting to fetch and convert: ${currentImageUrl}`);
          
          try {
            // Fetch the image
            const response = await this.httpService.axiosRef.get(currentImageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            
            // Convert to JPEG using Sharp
            const jpegBuffer = await sharp(buffer, { failOn: 'none' })
              .jpeg({ quality: 85 })
              .toBuffer();
              
            // Upload the converted image with a new name
            const filename = `converted-${Date.now()}.jpg`;
            const urlParts = currentImageUrl.split('/');
            const batchId = urlParts.length > 2 ? urlParts[urlParts.length - 2] : 'unknown'; // Extract batch ID from URL
            const projId = urlParts.length > 3 ? urlParts[urlParts.length - 3] : projectId; // Extract project ID from URL
            
            const filePath = `${projId}/${batchId}/${filename}`;
            
            // Create a file-like object for the storage service
            const file = {
              buffer: jpegBuffer,
              originalname: filename,
              mimetype: 'image/jpeg',
              size: jpegBuffer.length
            } as Express.Multer.File;
            
            // Upload the converted image
            const storageResult = await this.storageService.uploadFile(file, {
              path: filePath,
              bucket: 'equipment-photos',
              contentType: 'image/jpeg'
            });
            
            // Use the new URL for analysis
            currentImageUrl = storageResult.url ?? currentImageUrl;
          } catch (conversionError) {
            this.logger.error(`Failed to convert HEIC image: ${conversionError.message}`);
            // Continue with original URL and let OpenAI try to handle it
          }
        }
        
        // Fetch project equipment for matching
        const projectEquipment = await this.prisma.equipment_analysis.findMany({
          where: { project_id: projectId },
          select: {
            id: true,
            equipment_type: true,
            manufacturer: true,
            model: true,
            serial_number: true,
            capacity: true,
            efficiency: true
          },
          take: 30 // Limit to prevent excessive token usage
        });
        
        // Limit equipment items (keeping existing code)
        let equipmentForMatching = projectEquipment;
        if (projectEquipment.length > 10) {
          equipmentForMatching = projectEquipment.slice(0, 10);
        }
        
        // Create equipment JSON (keeping existing code)
        const equipmentListJson = JSON.stringify(equipmentForMatching);
        
        // The existing prompt
        const prompt = `
          Analyze this equipment image and extract the following information in a valid JSON format:
          - Equipment type (HVAC, Lighting, Plumbing, Electrical, etc.)
          - Manufacturer name
          - Model number/name
          - Serial number (if visible)
          - Capacity (e.g. 5 tons, 10,000 BTU)
          - Efficiency rating (e.g. SEER 14, EER 10)
          - Year/age (if visible)
          - General condition

          AFTER extracting the metadata, compare it to the following equipment list from the project and identify potential matches:
          ${equipmentListJson}

          Format your response as a valid JSON object with these exact keys:
          {
            "equipmentType": string,
            "manufacturer": string,
            "model": string,
            "serialNumber": string,
            "capacity": string,
            "efficiency": string,
            "efficiencyUnit": string,
            "year": string,
            "condition": string,
            "confidence": number, // 0-1 to indicate confidence in the extraction
            "suggestedMatches": [
              {
                "equipmentId": string,
                "matchScore": number, // 0-1 to indicate match confidence
                "reasoning": string // Brief explanation of why this is a possible match
              }
            ]
          }

          For suggestedMatches:
          1. Return up to 3 potential matches in descending order of confidence
          2. Use matchScore to indicate your confidence (0-1) in each match
          3. Only include matches with a score > 0.3
          4. Provide brief reasoning for each match 

          If you cannot determine a value, use null for that field. Do not include any explanations outside the JSON.
        `;
        
        // Call OpenAI API with timeout handling
        const apiPromise = this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: currentImageUrl,
                  },
                },
              ] as any, // Type assertion to handle the image_url type
            },
          ],
          response_format: { type: "json_object" }
        });
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI request timed out after 60 seconds')), 60000)
        );
        
        // Race the API call against the timeout
        const response: any = await Promise.race([apiPromise, timeoutPromise]);
        
        // Parse the JSON response
        const content = response?.choices?.[0]?.message?.content || '{}';
        let metadata;
        
        try {
          metadata = JSON.parse(content);
        } catch (e) {
          this.logger.error(`Error parsing OpenAI response: ${e.message}`);
          throw new Error(`Failed to parse OpenAI response: ${e.message}`);
        }
        
        // Calculate processing time
        const processingTime = Math.floor(response.usage?.total_tokens || 0);
        
        
        // Log match suggestions if present
        if (metadata.suggestedMatches && metadata.suggestedMatches.length > 0) {
          this.logger.debug({
            equipmentType: metadata.equipmentType,
            manufacturer: metadata.manufacturer,
            model: metadata.model,
            serialNumber: metadata.serialNumber,
            confidence: metadata.confidence
          });
          
          metadata.suggestedMatches.forEach((match: JsonSuggestedMatch) => {
            const equipment = equipmentForMatching.find(e => e.id === match.equipmentId);
            this.logger.debug({
              equipmentId: match.equipmentId,
              matchScore: match.matchScore,
              reasoning: match.reasoning,
              equipmentDetails: equipment ? {
                type: equipment.equipment_type,
                manufacturer: equipment.manufacturer,
                model: equipment.model,
                serialNumber: equipment.serial_number
              } : 'Equipment not found'
            });
          });
        } else {
          this.logger.debug({
            equipmentType: metadata.equipmentType,
            manufacturer: metadata.manufacturer,
            model: metadata.model,
            serialNumber: metadata.serialNumber,
            confidence: metadata.confidence
          });
        }
        
        return {
          equipmentType: metadata.equipmentType,
          manufacturer: metadata.manufacturer,
          model: metadata.model,
          serialNumber: metadata.serialNumber,
          capacity: metadata.capacity,
          efficiency: metadata.efficiency,
          efficiencyUnit: metadata.efficiencyUnit,
          year: metadata.year,
          condition: metadata.condition,
          confidence: metadata.confidence,
          suggestedMatches: metadata.suggestedMatches,
          processingTime: processingTime
        };
      } catch (error) {
        lastError = error;
        
        // Check if it's a timeout or connection error that warrants retry
        const isRetryableError = 
          error.message?.includes('timed out') || 
          error.message?.includes('ECONNRESET') ||
          error.message?.includes('ETIMEDOUT') ||
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.status === 408 || 
          error.status === 429 || 
          (error.status && error.status >= 500);
        
        if (!isRetryableError) {
          this.logger.error(`Non-retryable error with OpenAI: ${error.message}`);
          throw error; // Don't retry non-timeout errors
        }
        
        if (attempt < maxRetries) {
          // Calculate backoff delay with jitter
          const delay = initialDelay * Math.pow(2, attempt - 1) * (1 + Math.random() * 0.1);
          this.logger.warn(`OpenAI request failed (${error.message}). Retrying in ${Math.round(delay/1000)}s...`);
          
          // Wait before retrying
          await new Promise<void>((resolve) => {
            setTimeout(() => resolve(), delay);
          });
        } else {
          this.logger.error(`All ${maxRetries} attempts to process image with OpenAI failed.`, error);
          throw new Error(`Failed to extract metadata after ${maxRetries} attempts: ${lastError.message}`);
        }
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw lastError;
  }
  
  /**
   * Save metadata result to database with size limiting
   */
  async saveMetadataResult(batchId: string, result: {
    photoId?: string;
    photoUrl?: string;
    equipmentType?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    capacity?: string;
    efficiency?: string;
    efficiencyUnit?: string;
    year?: string;
    condition?: string;
    confidence?: number;
    processingTime?: number;
    suggestedMatches?: SuggestedMatch[];
  }): Promise<any> {
    try {
      const metadataData = {
        batch_id: batchId,
        photo_id: result.photoId,
        photo_url: result.photoUrl,
        equipment_type: result.equipmentType,
        manufacturer: result.manufacturer,
        model: result.model,
        serial_number: result.serialNumber,
        capacity: result.capacity,
        efficiency: result.efficiency,
        efficiency_unit: result.efficiencyUnit,
        year: result.year,
        condition: result.condition,
        confidence: result.confidence,
        processing_time: result.processingTime,
      };

      // If suggested matches exist, process and limit them
      if (result.suggestedMatches && result.suggestedMatches.length > 0) {
        // Prepare matches to fit database constraints
        const limitedMatches = this.prepareSuggestedMatches(result.suggestedMatches);
        
        try {
          return this.prisma.photo_metadata_result.create({
            data: {
              ...metadataData,
              suggested_matches: limitedMatches,
            },
          });
        } catch (dbError) {
          this.logger.error(`Error saving with matches: ${dbError.message}`);
          // Fall back to saving without matches if it fails
          return this.prisma.photo_metadata_result.create({
            data: metadataData
          });
        }
      } else {
        return this.prisma.photo_metadata_result.create({
          data: metadataData
        });
      }
    } catch (error) {
      this.logger.error(`Failed to save metadata result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prepare and truncate suggested matches to fit database constraints
   */
  private prepareSuggestedMatches(matches: JsonSuggestedMatch[] = []): JsonSuggestedMatch[] {
    if (!matches || matches.length === 0) return [];
    
    // Keep only essential fields and normalize UUIDs
    const simplifiedMatches = matches.map(match => {
      // Ensure equipmentId is properly formatted with leading zeros if needed
      let equipmentId = match.equipmentId;
      if (equipmentId && equipmentId.includes('-')) {
        const segments = equipmentId.split('-');
        if (segments.length === 5 && segments[0].length < 8) {
          segments[0] = segments[0].padStart(8, '0');
          equipmentId = segments.join('-');
        }
      }
      
      return {
        equipmentId: equipmentId,
        matchScore: match.matchScore,
        reasoning: match.reasoning ? 
          // Truncate reasoning to reasonable length
          match.reasoning.substring(0, 200) : ''
      };
    });
    
    // Limit to top 3 matches maximum
    const limitedMatches = simplifiedMatches.slice(0, 3);
    
    // Check serialized size
    const serialized = JSON.stringify(limitedMatches);
    if (serialized.length > 8000) { // Assuming JSON column limit of ~8kb
      this.logger.warn(`Suggested matches too large (${serialized.length} bytes), further truncating`);
      
      // Further truncate reasoning fields
      return limitedMatches.map(match => ({
        equipmentId: match.equipmentId,
        matchScore: match.matchScore,
        reasoning: match.reasoning?.substring(0, 50) || ''
      }));
    }
    
    return limitedMatches;
  }

  /**
   * Gets all metadata results for a batch
   */
  async getBatchResults(batchId: string) {
    return this.prisma.photo_metadata_result.findMany({
      where: { batch_id: batchId },
    });
  }

  /**
   * Creates a new metadata match job
   */
  async createMatchJob(projectId: string, batchId: string, config?: any) {
    return this.prisma.metadata_match_job.create({
      data: {
        project_id: projectId,
        batch_id: batchId,
        status: 'pending',
        config,
      },
    });
  }

  /**
   * Updates match job status
   */
  async updateMatchJobStatus(jobId: string, status: string, resultsSummary?: any) {
    const data: any = { status };
    
    if (resultsSummary) {
      data.results_summary = resultsSummary;
    }
    
    if (status === 'completed' || status === 'failed') {
      data.completed_at = new Date();
    }
    
    return this.prisma.metadata_match_job.update({
      where: { id: jobId },
      data,
    });
  }
  
  /**
   * Applies metadata result to equipment
   */
  async applyMetadataToEquipment(metadataResultId: string, equipmentId: string) {
    const metadataResult = await this.prisma.photo_metadata_result.findUnique({
      where: { id: metadataResultId },
    });
    
    if (!metadataResult) {
      throw new Error(`Metadata result ${metadataResultId} not found`);
    }
    
    // Verify equipment exists before updating
    const equipment = await this.prisma.equipment_analysis.findUnique({
      where: { id: equipmentId },
      select: { id: true }
    });
    
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }
    
    // Update equipment with metadata
    const updatedEquipment = await this.prisma.equipment_analysis.update({
      where: { id: equipmentId },
      data: {
        equipment_type: metadataResult.equipment_type || undefined,
        manufacturer: metadataResult.manufacturer || undefined,
        model: metadataResult.model || undefined,
        serial_number: metadataResult.serial_number || undefined,
        capacity: metadataResult.capacity || undefined,
        efficiency: metadataResult.efficiency || undefined,
        efficiency_unit: metadataResult.efficiency_unit || undefined
      },
    });
    
    return updatedEquipment;
  }
}
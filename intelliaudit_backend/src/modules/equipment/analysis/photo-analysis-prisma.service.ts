import { Injectable, Logger, OnModuleInit, OnModuleDestroy, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import JSZip from 'jszip';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { createPhotoAnalysisQueue, PhotoAnalysisJobData, PhotoAnalysisResult } from './photo-analysis.queue';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Readable } from 'stream';

const execPromise = promisify(exec);

interface ProcessedFile {
  originalname: string;
  filename: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface AnalysisResponse {
  success: boolean;
  analysis?: EquipmentAnalysis;
  error?: string;
}

export interface EquipmentAnalysis {
  id: string;
  projectId: string;
  photoUrl: string | null;
  photoFilename: string | null;
  originalFilename: string | null;
  model: string | null;
  status: 'completed';
  createdAt: Date | null;
  updatedAt: Date | null;
  manufacturer: string | null;
  serial_number: string | null;
  equipment_type: string | null;
  category: string | null;
  specifications: {
    capacity: string | null;
    efficiency: string | null;
    voltage: string | null;
    phase: string | null;
    wattage: number | null;
    refrigerantType: string | null;
  } | null;
  condition: {
    overall: string | null;
    visibleIssues: string[] | null;
    estimatedAge: string | null;
    remainingLife: string | null;
  } | null;
  location: string | null;
  quantity: number | null;
  is_per_unit: boolean | null;
  flow_rate: string | null;
  efficiency_unit: string | null;
  energy_source: string | null;
  input_rating: number | null;
  temperature_rise: number | null;
  load_factor: number | null;
  daily_usage: number | null;
  wattage: number | null;
  hours_per_week: number | null;
  annual_hours: number | null;
  annual_kwh: number | null;
  formula_used: string | null;
  work_shown: string | null;
  recommendations: string | null;
  notes: string | null;
  confidence: number | null;
  control_strategy: string | null;
}

@Injectable()
export class PhotoAnalysisPrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PhotoAnalysisPrismaService.name);
  private readonly openai: OpenAI;
  private photoAnalysisQueue: Queue<PhotoAnalysisJobData, PhotoAnalysisResult>;
  private readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];
  private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_DELAY_MS = 1500;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.photoAnalysisQueue = createPhotoAnalysisQueue(configService);
  }

  async onModuleInit() {
    // Initialize the queue when the module is initialized
    this.logger.log('Photo Analysis Queue initialized');
  }

  async onModuleDestroy() {
    // Close the queue connection when the module is destroyed
    await this.photoAnalysisQueue.close();
    this.logger.log('Photo Analysis Queue closed');
  }

  async processPhotos(
    files: Express.Multer.File[],
    projectId: string,
    model: string = 'gpt-4o'
  ): Promise<{
    success: boolean;
    processed: number;
    total: number;
    results: Array<{ filename: string; analysis: AnalysisResponse }>;
    errors: Array<{ filename: string; error: string }>;
    async_processing?: boolean;
  }> {

    if (!files?.length) throw new BadRequestException('No files uploaded');
    if (!projectId) throw new BadRequestException('Project ID required');

    const { processableFiles, errors } = await this.prepareFiles(files);
    // Remove the synchronous processing - we'll use the queue instead
    // const results = await this.processInBatches(processableFiles, projectId, model);

    this.logger.log({
      count: processableFiles.length,
      totalSize: `${processableFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)}MB`,
      files: processableFiles.map((f) => f.originalname)
    });

    // Prepare placeholder results immediately
    const tempResults = processableFiles.map(file => ({
      filename: file.originalname,
      analysis: {
        success: true,
        analysis: {
          id: uuidv4(), // Temporary ID - will be replaced with real one
          projectId: projectId,
          photoUrl: null, // Will be populated after upload
          photoFilename: file.originalname,
          originalFilename: file.originalname,
          model: model,
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          manufacturer: null,
          serial_number: null,
          equipment_type: 'Processing',
          category: 'Processing',
          specifications: {
            capacity: null,
            efficiency: null,
            voltage: null,
            phase: null,
            wattage: null,
            refrigerantType: null
          },
          condition: {
            overall: null,
            visibleIssues: null,
            estimatedAge: null,
            remainingLife: null
          },
          location: null,
          quantity: null,
          is_per_unit: null,
          flow_rate: null,
          efficiency_unit: null,
          energy_source: null,
          input_rating: null,
          temperature_rise: null,
          load_factor: null,
          daily_usage: null,
          wattage: null,
          hours_per_week: null,
          annual_hours: null,
          annual_kwh: null,
          formula_used: null,
          work_shown: null,
          recommendations: null,
          notes: null,
          confidence: null,
          control_strategy: null
        }
      }
    }));

    // Create immediate response
    const immediateResponse = {
      success: true,
      processed: 0,  // Will be updated in background
      total: processableFiles.length,
      results: tempResults as Array<{ filename: string; analysis: AnalysisResponse }>,
      errors: errors,  // Include any errors from file preparation
      async_processing: true  // Flag to indicate background processing
    };
    
    // Process files in the background without blocking response
    this.processFilesInBackground(processableFiles, projectId, model);
    
    return immediateResponse;
  }

  /**
   * Process files in the background without blocking the API response
   * This method handles the actual file uploads, database creation, and job queuing
   * after we've already sent a response to the client
   */
  private async processFilesInBackground(files: ProcessedFile[], projectId: string, model: string): Promise<void> {
    const jobIds = [];
    const uploadedFiles = [];
    const errors = [];

    let fileCount = 0;
    for (const file of files) {
      fileCount++;
      try {
        // Upload file to storage 
        const fileExt = path.extname(file.filename);
        const photoMetadata = await this.storageService.uploadFile({
          ...file,
          stream: Readable.from(file.buffer),
          fieldname: '',
          encoding: '',
          destination: '',
          path: ''
        }, {
          bucket: 'equipment-photos',
          path: `${projectId}/${new Date().toISOString().split('T')[0]}/${uuidv4()}${fileExt}`
        });

        // Create initial database record
        const analysis = await this.prisma.equipment_analysis.create({
          data: {
            project_id: projectId,
            photo_url: photoMetadata.url,
            photo_filename: photoMetadata.filename,
            model,
            equipment_type: 'Unknown',
            category: 'Unknown',
            specifications: {},
            condition: {}
          }
        });
        
        uploadedFiles.push({
          filename: file.originalname,
          analysisId: analysis.id,
          photoUrl: photoMetadata.url
        });

        // Queue AI analysis job
        const job = await this.photoAnalysisQueue.add(
          'analyze-photo',
          {
            projectId,
            analysisId: analysis.id,
            photoUrl: photoMetadata.url,
            originalFilename: file.originalname,
            model,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );
        
        this.logger.log(`Background processing: Added job ${job.id} for file ${file.originalname}`);
        jobIds.push(job.id);
      } catch (error) {
        this.logger.error(`Background processing: Failed to process ${file.originalname}:`, error);
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    this.logger.log(`Background processing completed for ${files.length} files. Success: ${uploadedFiles.length}, Errors: ${errors.length}`);
  }
  
  /**
   * Process files in batches synchronously
   * @deprecated This method is kept for reference but is no longer used in production.
   * Photo processing now happens asynchronously via the BullMQ queue system.
   */
  // @ts-ignore: Method kept for reference but intentionally unused
  private async processInBatches(files: ProcessedFile[], projectId: string, model: string): Promise<Array<{ filename: string; analysis: AnalysisResponse } | null>> {
    const results: Array<{ filename: string; analysis: AnalysisResponse } | null> = [];
    
    for (let i = 0; i < files.length; i += this.BATCH_SIZE) {
      const batch = files.slice(i, i + this.BATCH_SIZE);
      this.logger.log(`Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(files.length / this.BATCH_SIZE)}`);

      const batchResults = await Promise.all(
        batch.map(file => this.processFileWithRetry(file, projectId, model))
      );

      results.push(...batchResults);
      
      if (i + this.BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY_MS));
      }
    }

    return results;
  }

  private async processFileWithRetry(file: ProcessedFile, projectId: string, model: string, retries = 2): Promise<{ filename: string; analysis: AnalysisResponse } | null> {
    try {
      const analysis = await this.analyzePhoto(projectId, file, model);
      return { filename: file.originalname, analysis };
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(`Retrying ${file.originalname}, attempts left: ${retries}`);
        return this.processFileWithRetry(file, projectId, model, retries - 1);
      }
      this.logger.error(`Failed to process ${file.originalname}: ${error.message}`);
      return null;
    }
  }

  private async prepareFiles(
    files: Express.Multer.File[]
  ): Promise<{ processableFiles: ProcessedFile[]; errors: Array<{ filename: string; error: string }> }> {
    const processableFiles: ProcessedFile[] = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        this.validateFile(file);
        
        if (this.isZipFile(file)) {
          const extracted = await this.extractImagesFromZip(file);
          processableFiles.push(...extracted);
          continue;
        }

        const processed = await this.processImageFile(file);
        processableFiles.push(processed);
      } catch (error) {
        errors.push({ filename: file.originalname, error: error.message });
      }
    }

    return { processableFiles, errors };
  }

  private validateFile(file: Express.Multer.File) {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }
    if (!this.SUPPORTED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('Unsupported file type');
    }
  }

  private isZipFile(file: Express.Multer.File): boolean {
    return file.mimetype.match(/^application\/(zip|x-zip-compressed)$/) !== null || 
           file.originalname.toLowerCase().endsWith('.zip');
  }

  async extractImagesFromZip(zipFile: Express.Multer.File): Promise<ProcessedFile[]> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile.buffer);
      const imageFiles: ProcessedFile[] = [];

      for (const [filename, file] of Object.entries(zipContent.files) as [string, JSZip.JSZipObject][]) {
        if (file.dir) continue;

        const ext = path.extname(filename).toLowerCase();
        const mimeType = this.getMimeType(ext);

        if (!this.SUPPORTED_IMAGE_TYPES.includes(mimeType)) continue;

        const content = await file.async('nodebuffer');
        const mockFile: Express.Multer.File = {
          originalname: filename,
          buffer: content,
          mimetype: mimeType,
          size: content.length,
          fieldname: 'file',
          encoding: '7bit',
          stream: Readable.from(content),
          destination: '',
          filename: '',
          path: ''
        };

        const processed = await this.processImageFile(mockFile);
        imageFiles.push(processed);
      }

      return imageFiles;
    } catch (error) {
      this.logger.error('Zip extraction failed:', error);
      throw new Error(`Failed to extract zip: ${error.message}`);
    }
  }

  private getMimeType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif'
    };
    return typeMap[extension.toLowerCase()] || 'application/octet-stream';
  }

  private isHeicFile(file: Express.Multer.File): boolean {
    const filename = file.originalname.toLowerCase();
    const mimetype = file.mimetype?.toLowerCase() || '';
    return (
      filename.endsWith('.heic') ||
      filename.endsWith('.heif') ||
      mimetype.includes('image/heic') ||
      mimetype.includes('image/heif')
    );
  }

  private async convertHeicToJpeg(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }> {
    const tmpDir = os.tmpdir();
    const originalExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, originalExt);
    const inputPath = path.join(tmpDir, `${baseName}-input${originalExt}`);
    const outputPath = path.join(tmpDir, `${baseName}-output.jpg`);

    try {
      fs.writeFileSync(inputPath, file.buffer);

      const platform = os.platform();
      const command = platform === 'darwin' 
        ? `sips -s format jpeg "${inputPath}" --out "${outputPath}"`
        : `convert "${inputPath}" "${outputPath}"`;

      await execPromise(command, { timeout: 10000 });
      const outputBuffer = fs.readFileSync(outputPath);

      return {
        buffer: outputBuffer,
        filename: `${baseName}.jpg`,
        mimetype: 'image/jpeg'
      };
    } catch (error) {
      throw new Error(`HEIC conversion failed: ${error.message}`);
    } finally {
      [inputPath, outputPath].forEach(path => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
      });
    }
  }

  private async processImageFile(file: Express.Multer.File): Promise<ProcessedFile> {
    try {
      let processed: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
      };

      if (this.isHeicFile(file)) {
        processed = await this.convertHeicToJpeg(file);
      } else {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        processed = {
          buffer: file.buffer,
          filename: `${baseName}${ext}`,
          mimetype: file.mimetype
        };
      }

      return {
        originalname: file.originalname,
        filename: processed.filename,
        buffer: processed.buffer,
        mimetype: processed.mimetype,
        size: processed.buffer.length
      };
    } catch (error) {
      this.logger.error(`Image processing failed: ${error.message}`);
      throw error;
    }
  }

  async analyzePhoto(
    projectId: string,
    photo: ProcessedFile,
    model: string
  ): Promise<AnalysisResponse> {
    const photoId = uuidv4().substring(0, 8);
    this.logger.log(`[${photoId}] Analyzing ${photo.originalname}`);

    try {
      const fileExt = path.extname(photo.filename);
      const photoMetadata = await this.storageService.uploadFile({
        ...photo,
        stream: Readable.from(photo.buffer),
        fieldname: '',
        encoding: '',
        destination: '',
        path: ''
      }, {
        bucket: 'equipment-photos',
        path: `${projectId}/${new Date().toISOString().split('T')[0]}/${uuidv4()}${fileExt}`
      });

      const analysis = await this.prisma.equipment_analysis.create({
        data: {
          project_id: projectId,
          photo_url: photoMetadata.url,
          photo_filename: photoMetadata.filename,
          // original_filename: photo.originalname, // Removed as it is not in the Prisma schema
          model,
          equipment_type: 'Unknown',
          category: 'Unknown',
          specifications: {},
          condition: {}
        }
      });

      const analysisResult = await this.performAiAnalysis(photoMetadata.url, model);
      const updatedAnalysis = await this.updateAnalysisRecord(
        analysis.id,
        analysisResult,
        photoMetadata,
        model
      );

      return {
        success: true,
        analysis: this.mapPrismaToResponse(updatedAnalysis)
      };
    } catch (error) {
      this.logger.error(`[${photoId}] Analysis failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process an already uploaded photo for the queue worker
   * This method is used by the queue worker to process photos that have already been uploaded
   */
  async processQueuedAnalysis(
    analysisId: string,
    photoUrl: string,
    filename: string,
    model: string
  ): Promise<AnalysisResponse> {
    const photoId = uuidv4().substring(0, 8);
    this.logger.log(`[${photoId}] Processing queued analysis for ${filename}`);

    try {
      // Get analysis result from AI model
      const analysisResult = await this.performAiAnalysis(photoUrl, model);
      
      // Update the existing analysis record
      const photoMetadata = {
        url: photoUrl,
        filename: filename
      };
      
      const updatedAnalysis = await this.updateAnalysisRecord(
        analysisId,
        analysisResult,
        photoMetadata,
        model
      );

      return {
        success: true,
        analysis: this.mapPrismaToResponse(updatedAnalysis)
      };
    } catch (error) {
      this.logger.error(`[${photoId}] Queue analysis failed: ${error.message}`);
      throw error;
    }
  }

  private async performAiAnalysis(photoUrl: string, model: string): Promise<any> {
    const systemPrompt = `You are an expert HVAC and building systems engineer tasked with extracting equipment information AND performing ASHRAE Level 2 calculations from this photo.

Analyze this photo and extract equipment information in this exact format:
{
  "type": "string", // Required: Equipment type (be specific)
  "make": "string", // Optional: Manufacturer/brand
  "model": "string", // Optional: Model number/name
  "location": "string", // Required: Detailed location (if visible)
  "quantity": number, // Required: Number of identical units visible
  "is_per_unit": boolean, // Required: true if location is 'Unit X' or 'Apartment', false otherwise
  "category": "string", // Required: System category: HVAC, DHW, Lighting, Water Fixtures, Laundry, Appliances, Irrigation, etc.
  "capacity": "string", // Capacity with units (e.g., "1.5 tons", "250 kBtu/h")
  "flow_rate": "string", // For plumbing fixtures (GPM or GPF)
  "efficiency": "string", // Efficiency ratings (SEER, HSPF, AFUE, etc.)
  "efficiency_unit": "string", // Unit of efficiency (SEER, AFUE, COP)
  "energy_source": "string", // gas, electric, etc.
  "input_rating": number, // BTU/h for gas, kW for electric
  "temperature_rise": number, // For DHW (°F)
  "load_factor": number, // % of time at full capacity (0.0-1.0, Use defaults below)
  "daily_usage": number, // For DHW (gallons per day)
  "confidence": number, // Required: Confidence score (0.0 to 1.0)
  "assumptions": ["string"], // Required: List ALL assumptions made
  "wattage_w": number, // Required: Power consumption in watts (infer if needed)
  "hours_per_week": number, // Required: Weekly operating hours (Use defaults below)
  "annual_hours": number, // Required: Calculated hours_per_week * 52
  "annual_kwh": number, // Required: Calculated annual kWh (Use formula below, rounded)
  "formula_used": "string", // Required: Plain text formula, e.g., "(wattage_w * quantity * annual_hours) / 1000"
  "work_shown": "string", // Required: Full math calculation string
  "recommendations": "string", // Optional: ASHRAE Level 2 recommendation
  "serial_number": "string", // Optional: Serial number if visible
  "specifications": { // Optional: Additional specifications as JSON
    "refrigerantType": "string",
    "voltage": "string",
    "phase": "string"
  },
  "condition": { // Optional: Condition assessment as JSON
    "overall": "Good" | "Fair" | "Poor",
    "visibleIssues": ["string"],
    "estimatedAge": "string",
    "remainingLife": "string"
  },
  "control_strategy": "string" // Optional: Control strategy if visible
}

IMPORTANT GUIDELINES:
1.  **Equipment Type:** Be VERY specific with equipment type and try to match these common terms:
  - "DX Split System Heat Pump" for heat pumps
  - "Mighty Therm Boiler" for boilers
  - "Storage Tank" for water tanks
  - Use specific lighting types like "1-Lamp LED Surface", "2-Lamp Fluorescent T8"
  - For air conditioners, prefer "HVAC Unit" or "Air Conditioner"

2.  **Location & Per Unit:** Set "location" based on what's visible and set "is_per_unit" based on whether the location is clearly an apartment/unit.

3.  **Operating Hours (hours_per_week):** Use WEEKLY hours:
  - Common Areas/Central Systems/Most Equip: 84 hrs/wk
  - In-Unit/Tenant Items (is_per_unit=true): 28 hrs/wk
  - Central HVAC/DHW Systems: 150 hrs/wk
  - Water Fixtures: Use actual usage patterns or defaults:
    * Toilets: 14 hrs/wk (2 hrs/day)
    * Faucets: 21 hrs/wk (3 hrs/day)
    * Showers: 7 hrs/wk (1 hr/day)

4.  **Load Factors (load_factor):** Use defaults if not specified:
  - General/Common: 0.7
  - In-Unit/Tenant: 0.5
  - Central HVAC: 0.7
  - Central DHW: 0.3
  - Water Fixtures:
    * Toilets: 0.2
    * Faucets: 0.3
    * Showers: 0.4

5.  **Energy Calculations:** Always calculate annual_kwh using this formula:
  - For electric equipment: (wattage_w * quantity * annual_hours * load_factor) / 1000
  - For gas equipment: Convert BTU/h to kWh equivalent
  - Show all work in the work_shown field

For equipment identification, prefer specificity and accuracy over completeness. If you can't determine something with certainty, use reasonable defaults and document your assumptions.`;
    
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this equipment photo.' },
              { type: 'image_url', image_url: { url: photoUrl, detail: 'high' } }
            ] as any
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No analysis content received');
      }

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      this.logger.error('AI analysis failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private async updateAnalysisRecord(
    id: string,
    analysisRaw: any,
    photoMetadata: { url: string; filename: string },
    model: string
  ) {
    const isEquipment = this.isActualEquipment(analysisRaw);
    
    // Helper function to safely convert values to numbers or null
    const toNumberOrNull = (value: any): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Handle strings like 'Unknown', 'N/A', etc.
        if (['unknown', 'n/a', '-', 'null', 'undefined', ''].includes(value.toLowerCase())) {
          return null;
        }
        // Try to convert to number
        const num = Number(value);
        return isNaN(num) ? null : num;
      }
      return null;
    };

    const updateData = {
      equipment_type: analysisRaw.type || (isEquipment ? 'Unknown' : 'Non-Equipment Photo'),
      manufacturer: analysisRaw.make || null,
      model: analysisRaw.model || null,
      location: typeof analysisRaw.location === 'string' ? analysisRaw.location :
              analysisRaw.location ? JSON.stringify(analysisRaw.location) : null,
      is_per_unit: analysisRaw.is_per_unit || false,
      quantity: toNumberOrNull(analysisRaw.quantity),
      wattage: toNumberOrNull(analysisRaw.wattage_w),
      capacity: analysisRaw.capacity || null,
      flow_rate: analysisRaw.flow_rate || null,
      efficiency: analysisRaw.efficiency || null,
      efficiency_unit: analysisRaw.efficiency_unit || null,
      category: analysisRaw.category || (isEquipment ? 'Unknown' : 'Other'),
      weekly_hours: toNumberOrNull(analysisRaw.hours_per_week),
      annual_hours: toNumberOrNull(analysisRaw.annual_hours),
      annual_kwh: toNumberOrNull(analysisRaw.annual_kwh),
      energy_source: analysisRaw.energy_source || null,
      input_rating: toNumberOrNull(analysisRaw.input_rating),
      temperature_rise: toNumberOrNull(analysisRaw.temperature_rise),
      load_factor: toNumberOrNull(analysisRaw.load_factor),
      daily_usage: toNumberOrNull(analysisRaw.daily_usage),
      notes: analysisRaw.assumptions?.join('\n') || 
            (isEquipment ? null : 'No equipment visible in the image.'),
      confidence: toNumberOrNull(analysisRaw.confidence),
      specifications: analysisRaw.specifications || {},
      ai_model: model,
      source_type: 'photo_analysis',
      formula_used: analysisRaw.formula_used || null,
      work_shown: analysisRaw.work_shown || null,
      recommendations: analysisRaw.recommendations || null,
      photos: JSON.stringify([{ url: photoMetadata.url, filename: photoMetadata.filename }]),
      condition: analysisRaw.condition || null,
      serial_number: analysisRaw.serial_number || null,
      control_strategy: analysisRaw.control_strategy || null
    };
    
    return this.prisma.equipment_analysis.update({
      where: { id },
      data: updateData
    });
  }

  private mapPrismaToResponse(analysis: any): EquipmentAnalysis {
    return {
      id: analysis.id,
      projectId: analysis.project_id,
      photoUrl: analysis.photo_url,
      photoFilename: analysis.photo_filename,
      originalFilename: analysis.original_filename,
      model: analysis.model,
      status: 'completed',
      createdAt: analysis.created_at,
      updatedAt: analysis.updated_at,
      manufacturer: analysis.manufacturer,
      serial_number: analysis.serial_number,
      equipment_type: analysis.equipment_type,
      category: analysis.category,
      specifications: analysis.specifications,
      condition: analysis.condition,
      location: analysis.location,
      quantity: analysis.quantity,
      is_per_unit: analysis.is_per_unit,
      flow_rate: analysis.flow_rate,
      efficiency_unit: analysis.efficiency_unit,
      energy_source: analysis.energy_source,
      input_rating: analysis.input_rating ? Number(analysis.input_rating) : null,
      temperature_rise: analysis.temperature_rise ? Number(analysis.temperature_rise) : null,
      load_factor: analysis.load_factor ? Number(analysis.load_factor) : null,
      daily_usage: analysis.daily_usage ? Number(analysis.daily_usage) : null,
      wattage: analysis.wattage ? Number(analysis.wattage) : null,
      hours_per_week: analysis.weekly_hours ? Number(analysis.weekly_hours) : null,
      annual_hours: analysis.annual_hours ? Number(analysis.annual_hours) : null,
      annual_kwh: analysis.annual_kwh ? Number(analysis.annual_kwh) : null,
      formula_used: analysis.formula_used,
      work_shown: analysis.work_shown,
      recommendations: analysis.recommendations,
      notes: analysis.notes,
      confidence: analysis.confidence ? Number(analysis.confidence) : null,
      control_strategy: analysis.control_strategy
    };
  }

  private isActualEquipment(analysis: any): boolean {
    if (analysis.confidence && analysis.confidence < 0.4) return false;

    const assumptions = Array.isArray(analysis.assumptions) ? 
      analysis.assumptions.join(' ').toLowerCase() : '';
    
    if (assumptions.includes('no equipment') || 
        assumptions.includes('not equipment') ||
        assumptions.includes('couldn\'t identify') ||
        assumptions.includes('no visible equipment')) {
      return false;
    }

    const nonEquipmentTypes = [
      'unknown', 'n/a', 'none', 'not applicable', 'no equipment',
      'non-equipment', 'stairwell', 'stairs', 'hallway', 'corridor',
      'wall', 'floor', 'ceiling', 'string'
    ];

    const equipmentType = (analysis.type || '').toLowerCase();
    if (nonEquipmentTypes.some(term => equipmentType.includes(term))) {
      return false;
    }

    if (!analysis.type || !analysis.category ||
        (analysis.wattage_w === 0 || analysis.wattage_w === null || analysis.wattage_w === undefined) ||
        (analysis.quantity === 0 || analysis.quantity === null || analysis.quantity === undefined)) {
      return false;
    }

    return true;
  }
}
import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  HttpException, 
  HttpStatus, 
  Query, 
  ParseUUIDPipe,
  Logger,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { PhotoMetadataExtractionService } from '../services/photo-metadata-extraction.service';
import { ImageConversionService } from '../services/image-conversion.service';
import { CreateBatchJobDto, SaveMetadataResultDto, ApplyMetadataDto } from '../dto';

// Define enhanced photo type with optional file
interface PhotoWithFile {
  id: string;
  url?: string;
  name?: string;
  file?: Express.Multer.File;
}

@ApiTags('Photo Metadata')
@Controller('photo-metadata')
export class PhotoMetadataController {
  private readonly logger = new Logger(PhotoMetadataController.name);

  constructor(
    private readonly photoMetadataService: PhotoMetadataExtractionService,
    private readonly imageConversionService: ImageConversionService,
  ) {}

  @Post('batch-jobs')
  @ApiOperation({ summary: 'Create a new photo batch job' })
  @ApiResponse({ 
    status: 201, 
    description: 'The batch job has been successfully created.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async createBatchJob(@Body() createBatchJobDto: CreateBatchJobDto) {
    try {
      
      const result = await this.photoMetadataService.createBatchJob(
        createBatchJobDto.projectId,
        {
          totalPhotos: createBatchJobDto.totalPhotos,
          equipmentType: createBatchJobDto.equipmentType,
          priority: createBatchJobDto.priority,
        },
      );
      console.log('====================================');
      console.log('Batch job created:', result);
      console.log('====================================');
      return result;
    } catch (error) {
      console.log('====================================');
      console.log('Batch job Error:', error);
      console.log('====================================');
      throw new HttpException(
        `Failed to create batch job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('batch-jobs/:id')
  @ApiOperation({ summary: 'Get a batch job by ID' })
  @ApiParam({ name: 'id', description: 'Batch job ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'The batch job has been found.' 
  })
  @ApiResponse({ status: 404, description: 'Batch job not found.' })
  async getBatchJob(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const batchJob = await this.photoMetadataService.getBatchJob(id);
      console.log('====================================');
      console.log('Batch job found:', batchJob);
      console.log('====================================');
      if (!batchJob) {
        throw new HttpException(
          `Batch job with ID ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      return batchJob;
    } catch (error) {
      console.log('====================================');
      console.log('Batch job Error:', error); 
      console.log('====================================');
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error retrieving batch job: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to retrieve batch job: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('batch-jobs')
  @ApiOperation({ summary: 'List all batch jobs for a project' })
  @ApiQuery({ name: 'projectId', description: 'Project ID', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'List of batch jobs for the project.' 
  })
  async listBatchJobs(@Query('projectId', ParseUUIDPipe) projectId: string) {
    try {
      return await this.photoMetadataService.listBatchJobs(projectId);
    } catch (error) {
      this.logger.error(`Error listing batch jobs: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to list batch jobs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('results')
  @ApiOperation({ summary: 'Save metadata extraction result' })
  @ApiResponse({ 
    status: 201, 
    description: 'The metadata result has been successfully saved.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async saveMetadataResult(@Body() resultDto: SaveMetadataResultDto) {
    try {
      return await this.photoMetadataService.saveMetadataResult(
        resultDto.batchId,
        {
          photoId: resultDto.photoId,
          photoUrl: resultDto.photoUrl,
          equipmentType: resultDto.equipmentType,
          manufacturer: resultDto.manufacturer,
          model: resultDto.model,
          serialNumber: resultDto.serialNumber,
          capacity: resultDto.capacity,
          efficiency: resultDto.efficiency,
          efficiencyUnit: resultDto.efficiencyUnit,
          year: resultDto.year,
          condition: resultDto.condition,
          confidence: resultDto.confidence,
          processingTime: resultDto.processingTime,
        },
      );
    } catch (error) {
      this.logger.error(`Error saving metadata result: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to save metadata result: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('results')
  @ApiOperation({ summary: 'Get all metadata results for a batch' })
  @ApiQuery({ name: 'batchId', description: 'Batch ID', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'List of metadata results for the batch.' 
  })
  async getBatchResults(@Query('batchId', ParseUUIDPipe) batchId: string) {
    try {
      return await this.photoMetadataService.getBatchResults(batchId);
    } catch (error) {
      this.logger.error(`Error getting batch results: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to get batch results: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply metadata to equipment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metadata has been successfully applied to equipment.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Metadata result not found.' })
  async applyMetadataToEquipment(@Body() applyDto: ApplyMetadataDto) {
    try {
      return await this.photoMetadataService.applyMetadataToEquipment(
        applyDto.metadataResultId,
        applyDto.equipmentId,
      );
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }
      
      this.logger.error(`Error applying metadata: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to apply metadata: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process')
  @ApiOperation({ summary: 'Process photos for metadata extraction' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiResponse({ 
    status: 200, 
    description: 'Photos have been processed successfully.' 
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Batch job not found.' })
  @ApiResponse({ status: 500, description: 'Error processing photos.' })
  async processPhotos(
    @Body() processDto: any,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      // Parse photos from JSON string in form data
      let photos: Array<{id: string, url?: string, name?: string}> = [];
      if (typeof processDto.photos === 'string') {
        try {
          photos = JSON.parse(processDto.photos);
        } catch (e) {
          throw new HttpException(
            'Invalid photos JSON data',
            HttpStatus.BAD_REQUEST
          );
        }
      } else {
        photos = processDto.photos || [];
      }
      
      const batchId = processDto.batchId;
      
      if (!batchId) {
        throw new HttpException('Batch ID is required', HttpStatus.BAD_REQUEST);
      }
      
      
      // Process files first (handle HEIC conversion)
      const processedFiles: Express.Multer.File[] = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            // Keep original file properties and only update necessary ones
            const processedFile = {
              ...file,
              ...(await this.imageConversionService.processImageFile(file))
            };
            processedFiles.push(processedFile);
          } catch (error) {
            this.logger.error(`Error processing file ${file.originalname}: ${error.message}`);
            throw error;
          }
        }
      }
      
      // Enhance photos with processed file data
      const photosWithFiles: PhotoWithFile[] = photos.map(photo => {
        // Find matching file by name or id
        const matchingFile = processedFiles?.find(f => {
          if (photo.name) {
            // If the original was HEIC, the name might have changed to .jpg
            const baseName = photo.name.substring(0, photo.name.lastIndexOf('.')) || photo.name;
            return f.originalname.startsWith(baseName);
          }
          // Fallback to position matching
          return true;
        });
        
        return {
          ...photo,
          file: matchingFile
        };
      });
      
      // Process photos with the photoMetadataService
      const result = await this.photoMetadataService.processPhotos(batchId, photosWithFiles);
      
      return result;
    } catch (error) {
      this.logger.error(`Error processing photos: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to process photos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('apply-batch')
  @ApiOperation({ summary: 'Apply metadata to multiple equipment items in batch' })
  @ApiResponse({ status: 200, description: 'Metadata applied successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async applyMetadataBatch(
    @Body() applyBatchDto: {
      projectId: string;
      matches: Array<{
        metadataResultId: string;
        equipmentId: string;
      }>;
    }
  ) {
    try {
      const results = await Promise.all(
        applyBatchDto.matches.map(match =>
          this.photoMetadataService.applyMetadataToEquipment(
            match.metadataResultId,
            match.equipmentId
          )
        )
      );
      return results;
    } catch (error) {
      this.logger.error(`Error applying metadata batch: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to apply metadata batch: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 
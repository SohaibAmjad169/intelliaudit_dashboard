import { Controller, Post, Body, Get, Put, Param, Logger, UseInterceptors, UploadedFile, UploadedFiles, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FieldNotesAnalysisPrismaService } from '../analysis/field-notes-analysis-prisma.service';
import { EquipmentPrismaService } from './equipment-prisma.service';
import { PhotoAnalysisPrismaService } from '../analysis/photo-analysis-prisma.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';

/**
 * Normalizes a UUID by ensuring all segments have the correct length.
 * Pads segments with leading zeros if they're too short.
 */
function normalizeUUID(uuid: string): string {
  if (!uuid || !uuid.includes('-')) return uuid;

  // Standard UUID segment lengths
  const segmentLengths = [8, 4, 4, 4, 12];

  // Split the UUID into segments
  const segments = uuid.split('-');

  // If we don't have exactly 5 segments, return as is
  if (segments.length !== 5) return uuid;

  // Pad each segment to its required length
  const normalizedSegments = segments.map((segment, index) => {
    const expectedLength = segmentLengths[index];
    if (segment.length < expectedLength) {
      return segment.padStart(expectedLength, '0');
    }
    return segment;
  });

  // Join segments back together
  return normalizedSegments.join('-');
}

interface ProcessFieldNotesDto {
  notes: string;
  projectId: string;
  model?: string;
  raw_notes?: string;
}

@ApiTags('Equipment')
@Controller('equipment-prisma')
export class EquipmentPrismaController {
  private readonly logger = new Logger(EquipmentPrismaController.name);

  constructor(
    // We keep the service in the constructor for backward compatibility
    // but mark it as unused since we've deprecated the endpoint
    // @ts-ignore - Intentionally unused after deprecation
    private readonly fieldNotesAnalysisService: FieldNotesAnalysisPrismaService,
    private readonly equipmentPrismaService: EquipmentPrismaService,
    private readonly photoAnalysisService: PhotoAnalysisPrismaService
  ) {}

  @Post('field-notes')
  @ApiOperation({
    summary: 'Process field notes to extract equipment information [DEPRECATED]',
    description: 'This endpoint is deprecated. Please use the /field-notes endpoint instead.'
  })
  @ApiResponse({
    status: 200,
    description: 'Deprecation notice with information about the new endpoint to use.'
  })
  async processFieldNotes(@Body() dto: ProcessFieldNotesDto) {
    this.logger.warn(`Deprecated endpoint /equipment-prisma/field-notes called. Client should use /field-notes instead.`);

    // Return deprecation notice
    return {
      deprecated: true,
      message: "This endpoint (/equipment-prisma/field-notes) is deprecated and will be removed in a future update.",
      recommendation: "Please use the /field-notes endpoint instead for improved accuracy and consistency.",
      migrationGuide: {
        newEndpoint: "/field-notes",
        requestFormat: {
          notes: "string - The field notes to process",
          projectId: "string - The project ID"
        },
        example: {
          method: "POST",
          url: "/api/field-notes",
          body: {
            notes: "Your field notes text here",
            projectId: dto.projectId
          }
        }
      }
    };
  }

  @Post('photo-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string
  ) {
    // Normalize the project ID
    const normalizedProjectId = normalizeUUID(projectId);

    return this.photoAnalysisService.analyzePhoto(
      normalizedProjectId,
      file,
      'gpt-4o-mini'
    );
  }

  @Post('bulk-photo-upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadPhotos(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('projectId') projectId: string,
  ) {
    // Normalize the project ID
    const normalizedProjectId = normalizeUUID(projectId);

    return this.photoAnalysisService.processPhotos(
      files,
      normalizedProjectId,
      'gpt-4o-mini'
    );
  }

  @Put(':id')
  async updateEquipment(
    @Param('id') id: string,
    @Body() equipmentData: any
  ) {
    // Normalize the equipment ID
    const normalizedId = normalizeUUID(id);

    return this.equipmentPrismaService.updateEquipment(normalizedId, equipmentData);
  }

  // More specific routes need to come before generic ones
  @Get('project/:projectId')
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('category') category?: string,
    @Query('type') type?: string
  ) {
    // Normalize the project ID
    const normalizedProjectId = normalizeUUID(projectId);

    return this.equipmentPrismaService.findAllAnalysis(normalizedProjectId, {
      category,
      type
    });
  }

  // Add a route to get a specific equipment item by ID
  @Get('item/:id')
  async getEquipmentItem(@Param('id') id: string) {
    // Normalize the equipment ID
    const normalizedId = normalizeUUID(id);

    try {
      // Use the findUniqueAnalysis method to get a single equipment item
      const equipment = await this.equipmentPrismaService.findUniqueAnalysis(normalizedId);

      if (!equipment) {
        this.logger.warn(`Equipment with ID ${normalizedId} not found`);
        return { error: 'Equipment not found' };
      }

      return equipment;
    } catch (error) {
      this.logger.error(`Error fetching equipment item by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('batch')
  async getEquipmentBatch(@Body() body: { ids: string[] }) {
    try {
      const { ids } = body;
      if (!ids || !Array.isArray(ids)) {
        return { error: 'Invalid request: ids must be an array' };
      }

      // Normalize all IDs once
      const normalizedIds = ids.map(id => normalizeUUID(id));

      // Get all equipment items in parallel
      const equipmentItems = await Promise.all(
        normalizedIds.map(id => this.equipmentPrismaService.findUniqueAnalysis(id))
      );

      // Filter out any null results
      const validItems = equipmentItems.filter(item => item !== null);

      return validItems;
    } catch (error) {
      this.logger.error(`Error processing batch equipment request: ${error.message}`, error.stack);
      throw error;
    }
  }

  // This should be the last route as it's the most generic
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Normalize the equipment ID
    const normalizedId = normalizeUUID(id);

    return this.equipmentPrismaService.updateEquipment(normalizedId, {});
  }

  @Post('photos/analyze')
  @ApiOperation({ summary: 'Analyze equipment photos using AI' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 50, {
    storage: undefined, // Use memory storage instead of disk
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit per file
      files: 50, // Maximum number of files
    },
    fileFilter: (_, file, cb) => {
      // Accept both images and ZIP files
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|bmp|webp|heic|heif)$/) &&
          !file.mimetype.match(/^application\/(zip|x-zip-compressed)$/) &&
          !file.originalname.toLowerCase().endsWith('.zip')) {
        cb(new BadRequestException('Only image files and ZIP archives are allowed'), false);
        return;
      }
      cb(null, true);
    },
  }))
  @ApiResponse({
    status: 200,
    description: 'Photos have been analyzed successfully.'
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 500, description: 'Error analyzing photos.' })
  async analyzePhotos(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('projectId') projectId: string,
    @Body('model') model: string = 'gpt-4o-mini'
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files uploaded');
    }

    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    if (!['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'].includes(model)) {
      throw new BadRequestException('Invalid AI model specified');
    }

    // Normalize the project ID
    const normalizedProjectId = normalizeUUID(projectId);
    
    try {
      const result = await this.photoAnalysisService.processPhotos(files, normalizedProjectId, model);
      return result;
    } catch (error) {
      this.logger.error(`[DEBUG_CONTROLLER] Error processing photos: ${error.message}`);
      throw error;
    }
  }
}
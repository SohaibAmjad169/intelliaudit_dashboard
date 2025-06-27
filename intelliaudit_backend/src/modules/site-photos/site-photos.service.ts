import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoAnalysisPrismaService } from '../equipment/analysis/photo-analysis-prisma.service';

@Injectable()
export class SitePhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photoAnalysisService: PhotoAnalysisPrismaService,
  ) {}

  async getProjectPhotos(projectId: string) {
    const photos = await this.prisma.equipment_analysis.findMany({
      where: { 
        project_id: projectId,
        photo_url: { not: null } // Only get records with photos
      },
      orderBy: { created_at: 'desc' },
    });

    if (!photos.length) {
      return [];
    }

    return photos;
  }

  async uploadPhoto(projectId: string, photoData: any) {
    return await this.prisma.equipment_analysis.create({
      data: {
        ...photoData,
        project_id: projectId,
        source_type: photoData.source || 'photo_analysis',
      },
    });
  }

  async analyzePhoto(photoId: string) {
    const photo = await this.prisma.equipment_analysis.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    try {
      // Get the photo file from the URL
      if (!photo.photo_url) {
        throw new Error('Photo URL is missing');
      }
      
      const response = await fetch(photo.photo_url);
      const buffer = await response.arrayBuffer();
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: `${photoId}.jpg`,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from(buffer),
        size: buffer.byteLength,
        stream: require('stream').Readable.from(buffer),
        destination: '',
        filename: '',
        path: ''
      };

      // Analyze the photo using the existing service
      const analysisResult = await this.photoAnalysisService.analyzePhoto(photo.project_id, file, 'default-model');

      if (analysisResult.success && analysisResult.analysis) {
        // Update photo with analysis results
        const updateData: any = {
          source_type: 'photo_analysis',
          confidence: analysisResult.analysis.confidence || 0,
        };
        
        // Only set equipment_type if equipment was detected
        if (analysisResult.analysis.equipment_type && 
            analysisResult.analysis.equipment_type !== 'Unknown' && 
            (analysisResult.analysis.confidence || 0) > 0.6) {
          updateData.equipment_type = analysisResult.analysis.equipment_type;
          updateData.category = analysisResult.analysis.category || undefined;
          updateData.manufacturer = analysisResult.analysis.manufacturer || undefined;
          updateData.serial_number = analysisResult.analysis.serial_number || undefined;
        } else {
          // Explicitly mark as non-equipment if no equipment detected with confidence
          updateData.equipment_type = 'Non-Equipment Photo';
          updateData.category = analysisResult.analysis.category || 'Other';
        }
        
        // Handle JSON fields safely
        if (analysisResult.analysis.specifications) {
          updateData.specifications = analysisResult.analysis.specifications;
        }
        
        if (analysisResult.analysis.condition) {
          updateData.condition = analysisResult.analysis.condition;
        }
        
        if (analysisResult.analysis.location) {
          updateData.location = analysisResult.analysis.location;
        }
        
        return await this.prisma.equipment_analysis.update({
          where: { id: photoId },
          data: updateData,
        });
      }

      throw new Error('Photo analysis failed');
    } catch (error) {
      throw new Error(`Failed to analyze photo: ${error.message}`);
    }
  }

  async updatePhotoMetadata(photoId: string, metadata: Record<string, any>) {
    const photo = await this.prisma.equipment_analysis.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    // Handle JSON fields safely
    const currentSpecifications = photo.specifications as Record<string, any> || {};
    const updatedSpecifications = { 
      ...currentSpecifications, 
      ...metadata 
    };

    return await this.prisma.equipment_analysis.update({
      where: { id: photoId },
      data: {
        specifications: updatedSpecifications,
      },
    });
  }

  async deletePhoto(photoId: string): Promise<void> {
    try {
      await this.prisma.equipment_analysis.delete({
        where: { id: photoId },
      });
    } catch (error) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }
  }
} 
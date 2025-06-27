import { Controller, Get, Post, Patch, Delete, Param, Body, UseInterceptors, UploadedFile, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SitePhotosService } from './site-photos.service';

@Controller('site-photos')
export class SitePhotosController {
  constructor(private readonly sitePhotosService: SitePhotosService) {}

  @Get('project/:projectId')
  async getProjectPhotos(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ) {
    return this.sitePhotosService.getProjectPhotos(projectId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @UploadedFile() _file: Express.Multer.File,
    @Body('project_id') projectId: string,
    @Body('metadata') metadata?: string,
  ) {
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};
    
    // TODO: Implement file upload to cloud storage with the file
    // This would typically upload the file and get a URL back
    const photoUrl = `https://placeholder.com/photo-${Date.now()}.jpg`; 
    
    return this.sitePhotosService.uploadPhoto(projectId, {
      photo_url: photoUrl,
      thumbnail_url: photoUrl.replace('.jpg', '-thumb.jpg'),
      specifications: parsedMetadata,
      source_type: 'field_notes',
    });
  }

  @Post(':id/analyze')
  async analyzePhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sitePhotosService.analyzePhoto(id);
  }

  @Patch(':id/metadata')
  async updatePhotoMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('metadata') metadata: Record<string, any>,
  ) {
    return this.sitePhotosService.updatePhotoMetadata(id, metadata);
  }

  // Add a direct PATCH endpoint to match frontend expectations
  @Patch(':id')
  async updatePhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Record<string, any>,
  ) {
    // If the update contains metadata, use the specialized function
    if (data.metadata) {
      return this.sitePhotosService.updatePhotoMetadata(id, data.metadata);
    }
    
    // For other fields, we would need to implement a more general update method
    // For now, just return the data without modifying
    const photo = await this.sitePhotosService.getProjectPhotos(data.project_id || '');
    return photo.find(p => p.id === id) || null;
  }

  @Delete(':id')
  async deletePhoto(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.sitePhotosService.deletePhoto(id);
  }
} 
import {
  Controller,
  Post,
  Delete,
  Get,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { FileMetadata } from './storage.entity';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to storage', description: 'Uploads a file to the specified bucket and path' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload',
        },
      },
    },
  })
  @ApiQuery({ name: 'path', required: false, description: 'Path within the bucket to store the file' })
  @ApiQuery({ name: 'bucket', required: false, description: 'Storage bucket name (defaults to the configured default bucket)' })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileMetadata,
  })
  @ApiResponse({ status: 400, description: 'Bad request - no file provided or invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('path') path?: string,
    @Query('bucket') bucket?: string,
  ): Promise<FileMetadata> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const config = {
      ...(path && { path }),
      ...(bucket && { bucket }),
    };

    const uploadedFile = await this.storageService.uploadFile(file, config);
    return {
      ...uploadedFile,
      bucket: bucket || 'default-bucket', // Replace 'default-bucket' with your actual default bucket name
      lastModified: new Date(), // Replace with actual last modified date if available
    };
  }

  @Delete(':bucket/:path(*)')
  @ApiOperation({ summary: 'Delete a file', description: 'Deletes a file from storage based on bucket and path' })
  @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
  @ApiParam({ name: 'path', description: 'File path within the bucket' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ): Promise<void> {
    await this.storageService.deleteFile(path, bucket);
  }

  @Get('url/:bucket/:path(*)')
  @ApiOperation({ summary: 'Get public URL for a file', description: 'Returns a public URL to access a stored file' })
  @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
  @ApiParam({ name: 'path', description: 'File path within the bucket' })
  @ApiResponse({
    status: 200,
    description: 'Public URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Public URL to access the file',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPublicUrl(
    @Param('bucket') bucket: string,
    @Param('path') path: string,
  ): Promise<{ url: string }> {
    const url = await this.storageService.getPublicUrl(path, bucket);
    return { url };
  }

  @Get('list/:bucket/:prefix(*)')
  @ApiOperation({ summary: 'List files with prefix', description: 'Lists all files in a bucket with a specified prefix' })
  @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
  @ApiParam({ name: 'prefix', description: 'File path prefix to filter by' })
  @ApiResponse({
    status: 200,
    description: 'Files list retrieved successfully',
    type: [FileMetadata],
  })
  async listFiles(
    @Param('bucket') bucket: string,
    @Param('prefix') prefix: string,
  ): Promise<FileMetadata[]> {
    return this.storageService.listFiles(prefix, bucket);
  }

  @Delete('prefix/:bucket/:prefix(*)')
  @ApiOperation({ summary: 'Delete files by prefix', description: 'Deletes all files in a bucket with a specified prefix' })
  @ApiParam({ name: 'bucket', description: 'Storage bucket name' })
  @ApiParam({ name: 'prefix', description: 'File path prefix to filter by' })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  async deleteFilesByPrefix(
    @Param('bucket') bucket: string,
    @Param('prefix') prefix: string,
  ): Promise<void> {
    await this.storageService.deleteFilesByPrefix(prefix, bucket);
  }
}

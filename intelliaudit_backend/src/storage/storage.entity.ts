import { ApiProperty } from '@nestjs/swagger';

export class FileUpload {
  @ApiProperty({ description: 'File path within the bucket' })
  path: string;

  @ApiProperty({ description: 'Storage bucket name' })
  bucket: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024 })
  size: number;

  @ApiProperty({ description: 'File MIME type', example: 'image/jpeg' })
  mimetype: string;

  @ApiProperty({ description: 'Additional file metadata', required: false, type: 'object' })
  metadata?: Record<string, any>;
}

export class FileMetadata {
  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'Storage bucket name' })
  bucket: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024 })
  size: number;

  @ApiProperty({ description: 'File MIME type', example: 'image/jpeg' })
  mimetype: string;

  @ApiProperty({ description: 'Public URL to access the file', required: false })
  url?: string;

  @ApiProperty({ description: 'Last modification date', type: Date })
  lastModified: Date;
}

export class StorageConfig {
  @ApiProperty({ description: 'Storage bucket name' })
  bucket: string;

  @ApiProperty({ description: 'File path within the bucket' })
  path: string;

  @ApiProperty({ description: 'List of allowed MIME types', required: false, type: [String], example: ['image/jpeg', 'image/png'] })
  allowedMimeTypes?: string[];

  @ApiProperty({ description: 'Maximum file size in bytes', required: false, example: 5242880 })
  maxSize?: number; // in bytes
}

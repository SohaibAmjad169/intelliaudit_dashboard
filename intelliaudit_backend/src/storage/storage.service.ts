import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { FileMetadata } from './storage.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

interface SupabaseFileItem {
  name: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    lastModified?: number;
  };
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(
    file: Express.Multer.File,
    options: {
      path?: string;
      bucket?: string;
      contentType?: string;
      upsert?: boolean;
    } = {}
  ) {
    const supabase = this.supabaseService.getClient();
    
    // 1. Verify the client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
  
    // 2. Generate a simple filename if none provided
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const uploadPath = options.path || fileName;
  
    try {
      // 3. Upload with error handling
      const { data, error } = await supabase.storage
        .from(options.bucket || 'equipment-photos')
        .upload(uploadPath, file.buffer, {
          contentType: options.contentType || file.mimetype,
          upsert: options.upsert || false,
          cacheControl: '3600',
        });
  
      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        throw new Error(`Upload failed: ${error.message}`);
      }
  
      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket || 'equipment-photos')
        .getPublicUrl(data.path);
  
      return {
        filename: data.path,
        url: publicUrl,
        size: file.size,
        mimetype: options.contentType || file.mimetype,
      };
    } catch (err) {
      this.logger.error(`Upload failed: ${err.message}`);
      throw new Error(`File upload error: ${err.message}`);
    }
  }

  async storeFile(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    try {
      // Upload to Supabase
      const { data, error } = await this.supabaseService.getClient().storage
        .from(bucket)
        .upload(fileName, fileBuffer, {
          contentType,
          cacheControl: '3600'
        });

      if (error) {
        throw new BadRequestException(`Failed to store file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.getClient().storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.log('====================================');
      console.log(error);
      console.log('====================================');
      this.logger.error(`Failed to store file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to store file: ${error.message}`);
    }
  }

  async deleteFile(path: string, bucket: string = 'equipment-photos'): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient().storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new BadRequestException(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async getPublicUrl(path: string, bucket: string = 'equipment-photos'): Promise<string> {
    try {
      const { data } = this.supabaseService.getClient().storage
        .from(bucket)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      this.logger.error(`Failed to get public URL: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get public URL: ${error.message}`);
    }
  }

  async listFiles(prefix: string, bucket: string = 'equipment-photos'): Promise<FileMetadata[]> {
    try {
      const { data, error } = await this.supabaseService.getClient().storage
        .from(bucket)
        .list(prefix);

      if (error) {
        throw new BadRequestException(`Failed to list files: ${error.message}`);
      }

      const files = await Promise.all(data.map(async (item: SupabaseFileItem) => {
        const url = await this.getPublicUrl(item.name, bucket);
        return {
          filename: item.name,
          bucket,
          size: item.metadata?.size || 0,
          mimetype: item.metadata?.mimetype || 'application/octet-stream',
          url,
          lastModified: new Date(item.metadata?.lastModified || Date.now())
        };
      }));

      return files;
    } catch (error) {
      this.logger.error(`Failed to list files: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }

  async deleteFilesByPrefix(prefix: string, bucket: string = 'equipment-photos'): Promise<void> {
    try {
      const { data, error: listError } = await this.supabaseService.getClient().storage
        .from(bucket)
        .list(prefix);

      if (listError) {
        throw new BadRequestException(`Failed to list files: ${listError.message}`);
      }

      if (data.length === 0) {
        return;
      }

      const { error: deleteError } = await this.supabaseService.getClient().storage
        .from(bucket)
        .remove(data.map((item: SupabaseFileItem) => `${prefix}/${item.name}`));

      if (deleteError) {
        throw new BadRequestException(`Failed to delete files: ${deleteError.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete files by prefix: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to delete files by prefix: ${error.message}`);
    }
  }
}

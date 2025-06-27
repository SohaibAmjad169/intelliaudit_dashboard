import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

@Injectable()
export class ImageConversionService {
  private readonly logger = new Logger(ImageConversionService.name);

  /**
   * Convert HEIC/HEIF image to JPEG format using native OS tools
   * This is a fallback method when Sharp+libheif fails
   */
  async convertHeicToJpegNative(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }> {
    try {
      // Create temp files
      const tmpDir = os.tmpdir();
      const originalExt = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, originalExt);
      const inputPath = path.join(tmpDir, `${baseName}-input${originalExt}`);
      const outputPath = path.join(tmpDir, `${baseName}-output.jpg`);

      // Write buffer to temp file
      fs.writeFileSync(inputPath, file.buffer);

      // Detect operating system and use appropriate command
      const platform = os.platform();
      let command = '';
      
      if (platform === 'darwin') {
        // macOS - use sips
        command = `sips -s format jpeg "${inputPath}" --out "${outputPath}"`;
      } else {
        // Linux/Ubuntu - use ImageMagick
        command = `convert "${inputPath}" "${outputPath}"`;
      }
      
      // Execute the conversion command
      await execPromise(command);

      // Read the converted file
      const outputBuffer = fs.readFileSync(outputPath);

      // Clean up temp files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      const newFilename = `${baseName}-converted-from-heic.jpg`;

      return {
        buffer: outputBuffer,
        filename: newFilename,
        mimetype: 'image/jpeg',
      };
    } catch (error) {
      this.logger.error(`Error converting HEIC to JPEG with native tools: ${error.message}`, error.stack);
      throw new Error(`Failed to convert HEIC file with native tools: ${error.message}`);
    }
  }

  /**
   * Convert HEIC/HEIF image to JPEG format
   * @param file The file to convert
   * @returns The converted file as a Buffer with file info
   */
  async convertHeicToJpeg(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
  }> {
    try {
      // Skip Sharp and directly use native tools
      this.logger.log('Using native tools for HEIC/HEIF conversion');
      return this.convertHeicToJpegNative(file);
    } catch (error) {
      this.logger.error(`Error converting HEIC to JPEG: ${error.message}`, error.stack);
      throw new Error(`Failed to convert HEIC file: ${error.message}`);
    }
  }

  /**
   * Check if a file is in HEIC/HEIF format
   * @param file The file to check
   * @returns boolean
   */
  isHeicFile(file: Express.Multer.File): boolean {
    const filename = file.originalname.toLowerCase();
    const mimetype = file.mimetype?.toLowerCase() || '';
    
    return (
      filename.endsWith('.heic') ||
      filename.endsWith('.heif') ||
      mimetype.includes('image/heic') ||
      mimetype.includes('image/heif')
    );
  }

  /**
   * Process a file, converting if necessary
   * @param file The file to process
   * @returns The processed file data
   */
  async processImageFile(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: string;
    originalname: string;
    size: number;
  }> {
    try {
      if (this.isHeicFile(file)) {
        const converted = await this.convertHeicToJpeg(file);
        return {
          buffer: converted.buffer,
          filename: converted.filename,
          mimetype: converted.mimetype,
          originalname: file.originalname,
          size: converted.buffer.length,
        };
      }
      
      // If not HEIC, return original file
      return {
        buffer: file.buffer,
        filename: file.originalname,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Error processing image file: ${error.message}`, error.stack);
      throw new Error(`Failed to process image file: ${error.message}`);
    }
  }
} 
import { Module } from '@nestjs/common';
import { PhotoMetadataController } from './controllers/photo-metadata.controller';
import { PhotoMetadataExtractionService } from './services/photo-metadata-extraction.service';
import { ImageConversionService } from './services/image-conversion.service';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { StorageModule } from '../../../../storage/storage.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, StorageModule, HttpModule],
  controllers: [PhotoMetadataController],
  providers: [PhotoMetadataExtractionService, ImageConversionService],
  exports: [PhotoMetadataExtractionService, ImageConversionService],
})
export class PhotoMetadataModule {} 
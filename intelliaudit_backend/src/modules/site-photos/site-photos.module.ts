import { Module } from '@nestjs/common';
import { SitePhotosController } from './site-photos.controller';
import { SitePhotosService } from './site-photos.service';
import { PhotoAnalysisPrismaService } from '../equipment/analysis/photo-analysis-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [SitePhotosController],
  providers: [
    SitePhotosService,
    PhotoAnalysisPrismaService,
    PrismaService,
    StorageService,
    ConfigService,
  ],
  exports: [SitePhotosService],
})
export class SitePhotosModule {} 
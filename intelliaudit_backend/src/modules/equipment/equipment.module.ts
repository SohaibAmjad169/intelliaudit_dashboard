import { Module } from '@nestjs/common';
import { EquipmentPrismaModule } from './core/equipment-prisma.module';
import { MeasuresPrismaModule } from './measures/measures-prisma.module';
import { PhotoMetadataModule } from './utility/photo-metadata/photo-metadata.module';
import { EquipmentPrismaService } from './core/equipment-prisma.service';
import { PhotoAnalysisQueueModule } from './analysis/photo-analysis-queue.module';

/**
 * Main Equipment Module
 * 
 * This module serves as the central aggregator for all equipment-related functionality.
 * It imports and re-exports all equipment sub-modules to provide a single entry point
 * for equipment features in the application.
 */
@Module({
  imports: [
    // Core equipment functionality
    EquipmentPrismaModule,
    
    // Measures-related functionality
    MeasuresPrismaModule,
    
    // Photo metadata extraction functionality
    PhotoMetadataModule,
    
    // Photo analysis queue functionality
    PhotoAnalysisQueueModule
  ],
  providers: [
    EquipmentPrismaService
  ],
  exports: [
    EquipmentPrismaModule,
    MeasuresPrismaModule,
    PhotoMetadataModule,
    PhotoAnalysisQueueModule
  ]
})
export class EquipmentModule {}

import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PhotoAnalysisWorker } from './photo-analysis.worker';
import { createPhotoAnalysisQueue } from './photo-analysis.queue';
import { PhotoAnalysisPrismaService } from './photo-analysis-prisma.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StorageModule } from '../../../storage/storage.module';
import { PhotoAnalysisQueueController } from './photo-analysis-queue.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
  ],
  controllers: [
    PhotoAnalysisQueueController
  ],
  providers: [
    PhotoAnalysisPrismaService,
    {
      provide: 'PHOTO_ANALYSIS_QUEUE',
      useFactory: (configService: ConfigService) => {
        return createPhotoAnalysisQueue(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: PhotoAnalysisWorker,
      useFactory: (photoAnalysisService: PhotoAnalysisPrismaService, configService: ConfigService) => {
        return new PhotoAnalysisWorker(photoAnalysisService, configService);
      },
      inject: [PhotoAnalysisPrismaService, ConfigService],
    },
  ],
  exports: [PhotoAnalysisPrismaService, 'PHOTO_ANALYSIS_QUEUE'],
})
export class PhotoAnalysisQueueModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly worker: PhotoAnalysisWorker) {}

  async onModuleInit() {
    // The worker is initialized when the module starts
    console.log('Photo Analysis Queue Module initialized');
  }

  async onModuleDestroy() {
    // Close the worker when the module is destroyed
    await this.worker.close();
    console.log('Photo Analysis Queue Module destroyed');
  }
}

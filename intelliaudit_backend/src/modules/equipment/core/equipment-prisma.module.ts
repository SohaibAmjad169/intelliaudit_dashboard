import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../../prisma/prisma.module';
import { EquipmentPrismaService } from './equipment-prisma.service';
import { FieldNotesAnalysisPrismaService } from '../analysis/field-notes-analysis-prisma.service';
import { PhotoAnalysisPrismaService } from '../analysis/photo-analysis-prisma.service';
import { OpenAI } from 'openai';
import { EquipmentPrismaController } from './equipment-prisma.controller';
import { StorageModule } from '../../../storage/storage.module';
import { PhotoAnalysisQueueModule } from '../analysis/photo-analysis-queue.module';
import { PhotoAnalysisQueueController } from '../analysis/photo-analysis-queue.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule,
    StorageModule,
    PhotoAnalysisQueueModule,
  ],
  controllers: [
    EquipmentPrismaController,
    PhotoAnalysisQueueController,
  ],
  providers: [
    EquipmentPrismaService,
    FieldNotesAnalysisPrismaService,
    PhotoAnalysisPrismaService,
    {
      provide: OpenAI,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
          console.warn('OPENAI_API_KEY not found in environment');
        }
        return new OpenAI({
          apiKey: apiKey,
        });
      },
    },
  ],
  exports: [
    EquipmentPrismaService,
    FieldNotesAnalysisPrismaService,
    PhotoAnalysisPrismaService
  ]
})
export class EquipmentPrismaModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiCommandPrismaService } from './ai-command-prisma.service';
import { EnergyUsageAnalysisService } from './energy-usage-analysis.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MeasuresPrismaModule } from '../equipment/measures/measures-prisma.module';
import { AiCommandController } from './ai-command.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MeasuresPrismaModule
  ],
  controllers: [AiCommandController],
  providers: [
    AiCommandPrismaService,
    EnergyUsageAnalysisService
  ],
  exports: [
    AiCommandPrismaService
  ]
})
export class AiCommandModule {}

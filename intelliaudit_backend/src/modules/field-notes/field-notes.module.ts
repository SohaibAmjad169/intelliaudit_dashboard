import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { FieldNotesController } from './controllers/field-notes.controller';
import { FieldNotesService } from './services/field-notes.service';
import { FieldNotesRepository } from './repositories/field-notes.repository';
import { EnergyBreakdownService } from './services/energy-breakdown.service';
import { EnergyBreakdownRepository } from './repositories/energy-breakdown.repository';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [FieldNotesController],
  providers: [
    FieldNotesService,
    FieldNotesRepository,
    EnergyBreakdownService,
    EnergyBreakdownRepository
  ],
  exports: [FieldNotesService, EnergyBreakdownService],
})
export class FieldNotesModule {} 
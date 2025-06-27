import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ProjectsModule } from './modules/projects/project.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { PortfolioManagerModule } from './modules/portfolio-manager/portfolio-manager.module';
import { UtilityDataModule } from './modules/utility-data/utility-data.module';
import { UtilityCalcsModule } from './modules/utility-calcs/utility-calcs.module';
import { WeatherModule } from './modules/weather/weather.module';
import { ECOModule } from './modules/eco/eco.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FieldNotesModule } from './modules/field-notes/field-notes.module';
import { SitePhotosModule } from './modules/site-photos/site-photos.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { StorageModule } from './storage/storage.module';
import { AiCommandModule } from './modules/ai-command/ai-command.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Prisma modules
    PrismaModule,
    ProjectsModule,
    PortfolioManagerModule,
    WeatherModule,
    UtilityDataModule,
    UtilityCalcsModule,
    // EnergyCostsPrismaModule removed - using constants for utility calcs
    // Using consolidated EquipmentModule instead of individual modules
    EquipmentModule,
    // UsersPrismaModule removed - no longer needed
    // EnergyAuditPrismaModule removed as part of code cleanup
    StorageModule,
    ECOModule,
    // EnergyCalculationPrismaModule removed as part of code cleanup
    // EndUseAnalysisPrismaModule removed as it uses a non-existent table
    // SharePrismaModule removed
    ReportsModule,
    
    // Keep only the modules that don't have Prisma versions yet
    AuthModule,
    // Added AiCommandModule
    AiCommandModule,
    SupabaseModule,
    // Field Notes module
    FieldNotesModule,
    SitePhotosModule,
    WebhookModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

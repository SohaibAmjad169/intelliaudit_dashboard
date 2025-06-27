import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Core services
import { PortfolioManagerPrismaService } from './core/portfolio-manager-prisma.service';
import { PortfolioManagerPrismaController } from './core/portfolio-manager-prisma.controller';

// Domain-specific services
import { PropertyDataService } from './property/property-data.service';
import { MetricsService } from './metrics/metrics.service';
import { UtilityDataPrismaService } from './utility/utility-data.service';
import { WeatherComparisonPrismaService } from './weather/weather-comparison.service';

// External modules
import { ProjectsModule } from '../projects/project.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilityCalcsPrismaService } from '../utility-calcs/utility-calcs-prisma.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HttpModule,
    // EndUseAnalysisModule,
    forwardRef(() => ProjectsModule)
  ],
  controllers: [PortfolioManagerPrismaController],
  providers: [
    PortfolioManagerPrismaService, 
    PropertyDataService, 
    MetricsService, 
    UtilityDataPrismaService,
    UtilityCalcsPrismaService,
    WeatherComparisonPrismaService
  ],
  exports: [
    PortfolioManagerPrismaService, 
    PropertyDataService, 
    MetricsService, 
    UtilityDataPrismaService,
    UtilityCalcsPrismaService,
    WeatherComparisonPrismaService
  ]
})
export class PortfolioManagerModule {}

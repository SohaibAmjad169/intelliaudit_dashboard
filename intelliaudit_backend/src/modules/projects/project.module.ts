import { Module } from '@nestjs/common';
import { ProjectsController } from './project.controller';
import { ProjectService } from './project.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeatherModule } from '../weather/weather.module';
// Removed PortfolioManagerPrismaModule import as it's no longer directly used

@Module({
  imports: [
    PrismaModule,
    WeatherModule,
    // Removed PortfolioManagerPrismaModule as it's no longer directly used
  ],
  controllers: [
    ProjectsController
  ],
  providers: [
    ProjectService
  ],
  exports: [ProjectService],
})
export class ProjectsModule {}

import { Module } from '@nestjs/common';
import { ReportsPrismaService } from './reports-prisma.service';
import { ProjectsModule } from '../projects/project.module';
// EnergyAuditPrismaModule removed as part of code cleanup
import { UtilityCalcsModule } from '../utility-calcs/utility-calcs.module';
import { StorageModule } from '../../storage/storage.module';
import { MeasuresPrismaModule } from '../equipment/measures/measures-prisma.module';
import { TableOfContentsComponent } from './components/table-of-contents.component';
import { CoverPageComponent } from './components/cover-page.component';
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { EnergyAuditComponent } from './components/energy-audit.component';
import { WaterAuditComponent } from './components/water-audit.component';
import { RetroCommissioningComponent } from './components/retro-commissioning.component';
import { ReportsController } from './reports.controller';
import { ReportTemplateService } from './services/report-template.service';
import { AppendicesReportComponent } from './components/appendices-report.component';
// Removed import for V2EquipmentModule as it doesn't exist in the Prisma schema

@Module({
  imports: [
    ProjectsModule,
    // EnergyAuditPrismaModule removed as part of code cleanup
    UtilityCalcsModule,
    StorageModule,
    MeasuresPrismaModule,
    // Removed V2EquipmentModule as it doesn't exist in the Prisma schema
  ],
  controllers: [ReportsController],
  providers: [
    ReportsPrismaService,
    ReportTemplateService,
    TableOfContentsComponent,
    CoverPageComponent,
    ExecutiveSummaryComponent,
    EnergyAuditComponent,
    WaterAuditComponent,
    RetroCommissioningComponent,
    AppendicesReportComponent,
    {
      provide: 'AXIOS',
      useFactory: async () => {
        const axios = await import('axios');
        return axios.default;
      },
    },
    {
      provide: 'FS',
      useFactory: () => {
        return require('fs');
      },
    },
  ],
  exports: [ReportsPrismaService, ReportTemplateService],
})
export class ReportsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { ECOService } from './eco.service';
import { ECOController } from './eco.controller';
import { UtilityCalcsModule } from '../utility-calcs/utility-calcs.module';
import { ProjectsModule } from '../projects/project.module';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UtilityCalcsModule,
    ProjectsModule,
    SupabaseModule
  ],
  providers: [ECOService],
  controllers: [ECOController],
  exports: [ECOService]
})
export class ECOModule {}

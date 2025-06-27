import { Module } from '@nestjs/common';
import { UtilityCalcsPrismaService } from './utility-calcs-prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
// EnergyCostsPrismaModule removed - using constants for utility calcs
import { UtilityCalcsPrismaController } from './utility-calcs-prisma.controller';

@Module({
  imports: [
    PrismaModule,
    // EnergyCostsPrismaModule removed - using constants for utility calcs
  ],
  controllers: [UtilityCalcsPrismaController],
  providers: [UtilityCalcsPrismaService],
  exports: [UtilityCalcsPrismaService]
})
export class UtilityCalcsModule {}

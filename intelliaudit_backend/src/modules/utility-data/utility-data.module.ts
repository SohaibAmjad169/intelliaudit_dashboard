import { Module } from '@nestjs/common';
import { UtilityDataPrismaService } from './utility-data-prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UtilityDataPrismaService],
  exports: [UtilityDataPrismaService]
})
export class UtilityDataModule {}

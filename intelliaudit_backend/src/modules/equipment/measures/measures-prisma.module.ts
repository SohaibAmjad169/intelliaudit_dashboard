import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MeasuresPrismaService } from './measures-prisma.service';
import { MeasuresController } from './measures.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule
  ],
  controllers: [MeasuresController],
  providers: [MeasuresPrismaService],
  exports: [MeasuresPrismaService]
})
export class MeasuresPrismaModule {}

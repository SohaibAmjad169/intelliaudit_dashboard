import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherPrismaService } from './weather-prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeatherController } from './weather.controller';

@Module({
  imports: [
    HttpModule,
    PrismaModule
  ],
  controllers: [WeatherController],
  providers: [WeatherPrismaService],
  exports: [WeatherPrismaService]
})
export class WeatherModule {}

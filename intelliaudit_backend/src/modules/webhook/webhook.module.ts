import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { FieldNotesModule } from '../field-notes/field-notes.module'; 
import { EquipmentModule } from '../equipment/equipment.module'; 

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    FieldNotesModule, 
    EquipmentModule, 
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
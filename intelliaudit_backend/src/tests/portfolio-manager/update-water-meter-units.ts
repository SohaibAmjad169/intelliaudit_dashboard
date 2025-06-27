import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function updateWaterMeterUnits() {
  const logger = new Logger('UpdateWaterMeterUnits');
  console.log('Starting water meter units update...');
  
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Get PrismaService
  const prisma = app.get(PrismaService);
  
  try {
    // Find all water meters with empty usage_units
    const waterMeters = await prisma.utility_data.findMany({
      where: { 
        meter_type: 'Water',
        usage_units: ''
      }
    });
    
    logger.log(`Found ${waterMeters.length} water meters with empty usage units`);
    
    if (waterMeters.length > 0) {
      // Update water meters with correct usage units
      const updatePromises = waterMeters.map(meter => 
        prisma.utility_data.update({
          where: { id: meter.id },
          data: { usage_units: 'kgal' }
        })
      );
      
      // Execute updates in batches to avoid overwhelming the database
      const batchSize = 10;
      let updatedCount = 0;
      
      for (let i = 0; i < updatePromises.length; i += batchSize) {
        const batch = updatePromises.slice(i, i + batchSize);
        const results = await Promise.all(batch);
        updatedCount += results.length;
        logger.log(`Updated batch ${Math.floor(i/batchSize) + 1} (${results.length} records)`);
      }
      
      logger.log(`Successfully updated ${updatedCount} of ${waterMeters.length} water meters`);
      
      // Verify the update
      const updatedWaterMeters = await prisma.utility_data.findMany({
        where: { 
          meter_type: 'Water',
          usage_units: 'kgal'
        },
        take: 3
      });
      
      logger.log(`Verification: Found ${updatedWaterMeters.length} water meters with 'kgal' units`);
      
      if (updatedWaterMeters.length > 0) {
        logger.log('Sample updated water meter:');
        logger.log(JSON.stringify({
          id: updatedWaterMeters[0].id,
          meter_type: updatedWaterMeters[0].meter_type,
          usage: updatedWaterMeters[0].usage,
          usage_units: updatedWaterMeters[0].usage_units,
          cost: updatedWaterMeters[0].cost
        }, null, 2));
      }
    } else {
      logger.log('No water meters need updating');
    }
    
    logger.log('Water meter units update completed');
  } catch (error) {
    logger.error(`Error updating water meter units: ${error.message}`, error.stack);
  } finally {
    await app.close();
  }
}

// Run the function
updateWaterMeterUnits().catch(e => {
  console.error(e);
  process.exit(1);
});

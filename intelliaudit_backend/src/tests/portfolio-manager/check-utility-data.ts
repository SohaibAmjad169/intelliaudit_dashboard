import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

async function checkUtilityData() {
  console.log('Starting utility data check...');
  
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Get PrismaService
  const prisma = app.get(PrismaService);
  
  try {
    console.log('Checking utility data by meter type...');
    
    // Check water meters
    const waterMeters = await prisma.utility_data.findMany({
      where: { meter_type: 'Water' },
      orderBy: { start_date: 'desc' }
    });
    console.log('Water meters found:', waterMeters.length);
    
    if (waterMeters.length > 0) {
      console.log('\nWater meter cost analysis:');
      let nonZeroCostCount = 0;
      let totalCost = 0;
      let maxCost = 0;
      let minCost = Number.MAX_SAFE_INTEGER;
      
      waterMeters.forEach(meter => {
        // Handle Decimal or string or null types safely
        const costValue = meter.cost ? meter.cost.toString() : '0';
        const cost = parseFloat(costValue);
        if (cost > 0) {
          nonZeroCostCount++;
          totalCost += cost;
          maxCost = Math.max(maxCost, cost);
          minCost = Math.min(minCost, cost);
        }
      });
      
      console.log(`Total water meters: ${waterMeters.length}`);
      console.log(`Water meters with non-zero cost: ${nonZeroCostCount}`);
      console.log(`Average cost (of non-zero): ${nonZeroCostCount > 0 ? (totalCost / nonZeroCostCount).toFixed(2) : 'N/A'}`);
      console.log(`Max cost: ${maxCost}`);
      console.log(`Min cost (non-zero): ${minCost !== Number.MAX_SAFE_INTEGER ? minCost : 'N/A'}`);
      
      console.log('\nSample water meter data (most recent):');
      console.log(JSON.stringify({
        id: waterMeters[0].id,
        meter_type: waterMeters[0].meter_type,
        start_date: waterMeters[0].start_date,
        usage: waterMeters[0].usage,
        usage_units: waterMeters[0].usage_units,
        cost: waterMeters[0].cost,
        property_name: waterMeters[0].property_name
      }, null, 2));
      
      // Show a few more samples
      console.log('\nMore water meter samples:');
      for (let i = 1; i < Math.min(5, waterMeters.length); i++) {
        console.log(JSON.stringify({
          id: waterMeters[i].id,
          start_date: waterMeters[i].start_date,
          usage: waterMeters[i].usage,
          cost: waterMeters[i].cost
        }, null, 2));
      }
    }
    
    // Check electric meters
    const electricMeters = await prisma.utility_data.findMany({
      where: { meter_type: 'Electric' },
      take: 3
    });
    console.log('\nElectric meters found:', electricMeters.length);
    if (electricMeters.length > 0) {
      console.log('Sample electric meter data:');
      console.log(JSON.stringify({
        id: electricMeters[0].id,
        meter_type: electricMeters[0].meter_type,
        usage: electricMeters[0].usage,
        usage_units: electricMeters[0].usage_units,
        cost: electricMeters[0].cost
      }, null, 2));
    }
    
    // Check gas meters
    const gasMeters = await prisma.utility_data.findMany({
      where: { meter_type: 'Natural Gas' },
      take: 3
    });
    console.log('\nGas meters found:', gasMeters.length);
    if (gasMeters.length > 0) {
      console.log('Sample gas meter data:');
      console.log(JSON.stringify({
        id: gasMeters[0].id,
        meter_type: gasMeters[0].meter_type,
        usage: gasMeters[0].usage,
        usage_units: gasMeters[0].usage_units,
        cost: gasMeters[0].cost
      }, null, 2));
    }
    
    console.log('\nUtility data check completed.');
  } catch (error) {
    console.error('Error checking utility data:', error);
  } finally {
    await app.close();
  }
}

// Run the function
checkUtilityData().catch(e => {
  console.error(e);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PropertyDataService } from '../../modules/portfolio-manager/property/property-data.service';
import { testConfig } from './test-config';

async function testPropertyData() {
  console.log('Starting property data test...');
  const app = await NestFactory.create(AppModule);
  const propertyDataService = app.get(PropertyDataService);
  
  try {
    // Using IDs from the test config
    const { projectId, propertyId } = testConfig;
    
    console.log(`Testing property data service with projectId=${projectId}, propertyId=${propertyId}`);
    
    // Test 1: Fetch property data from API
    console.log('\n--- Test 1: Fetch property data from API ---');
    try {
      const propertyData = await propertyDataService.fetchPropertyFromApi(propertyId);
      console.log('Property data fetched successfully:');
      console.log(JSON.stringify(propertyData, null, 2));
    } catch (error) {
      console.error('Error fetching property data:', error.message);
    }
    
    // Test 2: Import property data (fetch and store)
    console.log('\n--- Test 2: Import property data (fetch and store) ---');
    try {
      const importResult = await propertyDataService.importPropertyData(projectId, propertyId);
      console.log('Import result:');
      console.log(JSON.stringify(importResult, null, 2));
    } catch (error) {
      console.error('Error importing property data:', error.message);
    }
    
    console.log('\nProperty data tests completed successfully.');
  } catch (error) {
    console.error('Error in property data test:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testPropertyData().catch(err => {
  console.error('Unhandled error in test script:', err);
});

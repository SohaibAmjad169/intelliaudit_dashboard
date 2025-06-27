import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UtilityDataPrismaService } from '../../modules/portfolio-manager/utility/utility-data.service';
import { PropertyDataService } from '../../modules/portfolio-manager/property/property-data.service';
import { testConfig } from './test-config';

async function testUtilityData() {
  console.log('Starting utility data test...');
  const app = await NestFactory.create(AppModule);
  const utilityDataService = app.get(UtilityDataPrismaService);
  const propertyDataService = app.get(PropertyDataService);
  
  try {
    // Using IDs from the test config
    const { projectId, propertyId } = testConfig;
    
    console.log(`Testing utility data service with projectId=${projectId}, propertyId=${propertyId}`);
    
    // Test 1: Fetch property data first (we need this for the utility data test)
    console.log('\n--- Test 1: Fetch property data ---');
    let propertyData;
    try {
      propertyData = await propertyDataService.fetchPropertyFromApi(propertyId);
      console.log('Property data fetched successfully:');
      console.log(JSON.stringify(propertyData, null, 2));
    } catch (error) {
      console.error('Error fetching property data:', error.message);
      return; // Exit if we can't get property data
    }
    
    // Test 2: Store sample utility data
    console.log('\n--- Test 2: Store sample utility data ---');
    try {
      // Create sample utility data (simulating data from Portfolio Manager)
      const sampleUtilityData = [
        {
          meterId: '12345',
          meterType: 'Electric',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          usage: 10000,
          cost: 1200
        },
        {
          meterId: '67890',
          meterType: 'Natural Gas',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          usage: 500,
          cost: 600
        }
      ];
      
      const storeResult = await utilityDataService.storeRawUtilityData(
        projectId,
        propertyId,
        sampleUtilityData,
        propertyData
      );
      
      console.log('Store utility data result:');
      console.log(JSON.stringify(storeResult, null, 2));
    } catch (error) {
      console.error('Error storing utility data:', error.message);
    }
    
    // Test 3: Fetch utility data for the project
    console.log('\n--- Test 3: Fetch utility data for the project ---');
    try {
      const utilityData = await utilityDataService.getUtilityDataForProject(projectId);
      console.log('Utility data fetched successfully:');
      console.log(`Found ${utilityData.count} utility data records`);
      if (utilityData.data && utilityData.data.length > 0) {
        console.log('Sample record:');
        console.log(JSON.stringify(utilityData.data[0], null, 2));
      }
    } catch (error) {
      console.error('Error fetching utility data:', error.message);
    }
    
    console.log('\nUtility data tests completed.');
  } catch (error) {
    console.error('Error in utility data test:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testUtilityData().catch(err => {
  console.error('Unhandled error in test script:', err);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UtilityDataPrismaService } from '../../modules/portfolio-manager/utility/utility-data.service';
import { testConfig } from './test-config';

/**
 * Test script for UtilityDataPrismaService
 * Tests fetching and storing utility data from Portfolio Manager
 */
async function testUtilityDataFetch() {
  console.log('Starting utility data fetch test...');
  
  // Create a NestJS application context to get the service
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the UtilityDataPrismaService from the application context
  const utilityDataService = app.get(UtilityDataPrismaService);
  
  // Get test configuration
  const { projectId, propertyId } = testConfig;
  console.log(`Testing utility data fetch with projectId=${projectId}, propertyId=${propertyId}`);
  
  try {
    // Test 1: Fetch meters
    console.log('\n--- Test 1: Fetch meters ---');
    const metersResult = await utilityDataService.fetchMeters(propertyId);
    
    if (metersResult.success) {
      console.log(`Meters fetched successfully:`);
      console.log(`Found ${metersResult.count} meters`);
      if (metersResult.data.length > 0) {
        console.log('Sample meter:', metersResult.data[0]);
      }
    } else {
      console.error(`Error fetching meters: ${metersResult.error}`);
    }
    
    // Test 2: Fetch utility data
    console.log('\n--- Test 2: Fetch utility data ---');
    // Fetch data for Dec 2023 - Dec 2024
    const startDate = '2023-12-01';
    const endDate = '2024-12-31';
    
    const utilityDataResult = await utilityDataService.fetchUtilityData(propertyId, startDate, endDate);
    
    if (utilityDataResult.success) {
      console.log(`Utility data fetched successfully:`);
      console.log(`Found ${utilityDataResult.count} utility data records`);
      if (utilityDataResult.data.length > 0) {
        console.log('Sample utility data record:', utilityDataResult.data[0]);
      }
    } else {
      console.error(`Error fetching utility data: ${utilityDataResult.error}`);
    }
    
    // Test 3: Fetch and store utility data
    console.log('\n--- Test 3: Fetch and store utility data ---');
    const fetchAndStoreResult = await utilityDataService.fetchAndStoreUtilityData(
      projectId,
      propertyId,
      startDate,
      endDate
    );
    
    console.log('Fetch and store utility data result:');
    console.log(fetchAndStoreResult);
    
    // Test 4: Retrieve stored utility data
    console.log('\n--- Test 4: Retrieve stored utility data ---');
    const storedDataResult = await utilityDataService.getUtilityDataForProject(projectId);
    
    if (storedDataResult.success) {
      console.log(`Utility data retrieved successfully:`);
      console.log(`Found ${storedDataResult.count} utility data records`);
      if (storedDataResult.data.length > 0) {
        console.log('Sample stored utility data record:', storedDataResult.data[0]);
      }
    } else {
      console.error(`Error retrieving utility data: ${storedDataResult.error}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nUtility data fetch tests completed.');
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testUtilityDataFetch();

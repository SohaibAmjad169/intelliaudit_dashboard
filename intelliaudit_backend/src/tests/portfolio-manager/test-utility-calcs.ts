import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UtilityCalcsPrismaService } from '../../modules/utility-calcs/utility-calcs-prisma.service';
import { UtilityDataPrismaService } from '../../modules/portfolio-manager/utility/utility-data.service';
import { testConfig } from './test-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test script for UtilityCalcsPrismaService
 * Tests processing utility calculations from utility data
 */
async function testUtilityCalcs() {
  console.log('Starting utility calculations test...');
  
  // Create a NestJS application context to get the services
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the services from the application context
  const utilityCalcsService = app.get(UtilityCalcsPrismaService);
  const utilityDataService = app.get(UtilityDataPrismaService);
  
  // Get test configuration
  const { projectId, propertyId } = testConfig;
  console.log(`Testing utility calculations with projectId=${projectId}, propertyId=${propertyId}`);
  
  try {
    // Test 1: Make sure we have utility data to process
    console.log('\n--- Test 1: Verify utility data exists ---');
    const utilityDataResult = await utilityDataService.getUtilityDataForProject(projectId);
    
    if (utilityDataResult.success && utilityDataResult.count > 0) {
      console.log(`Utility data exists: Found ${utilityDataResult.count} records`);
      console.log('Sample utility data record:', utilityDataResult.data[0]);
    } else {
      console.log('No utility data found. Fetching and storing utility data first...');
      
      // Fetch and store utility data for Dec 2023 - Dec 2024
      const startDate = '2023-12-01';
      const endDate = '2024-12-31';
      
      const fetchAndStoreResult = await utilityDataService.fetchAndStoreUtilityData(
        projectId,
        propertyId,
        startDate,
        endDate
      );
      
      console.log('Fetch and store utility data result:');
      console.log(fetchAndStoreResult);
      
      if (!fetchAndStoreResult.success) {
        throw new Error('Failed to fetch and store utility data. Cannot proceed with calculations.');
      }
    }
    
    // Test 2: Process utility calculations
    console.log('\n--- Test 2: Process utility calculations ---');
    const processResult = await utilityCalcsService.processUtilityCalculations(projectId, propertyId);
    
    console.log('Process utility calculations result:');
    console.log(processResult);
    
    if (!processResult.success) {
      throw new Error('Failed to process utility calculations.');
    }
    
    // Test 3: Get utility calculations directly from the database
    console.log('\n--- Test 3: Get utility calculations ---');
    const calculationsData = await prisma.utility_calcs.findMany({
      where: { project_id: projectId }
    });
    
    console.log(`Utility calculations retrieved successfully:`);
    console.log(`Found ${calculationsData.length} utility calculation records`);
    if (calculationsData.length > 0) {
      console.log('Sample utility calculation record:', calculationsData[0]);
    }
    
    // Test 4: Get total utility cost
    console.log('\n--- Test 4: Get total utility cost ---');
    const costResult = await utilityCalcsService.getTotalUtilityCost(projectId);
    
    console.log('Total utility cost:');
    console.log(costResult);
    
    // Test 5: Get monthly data by meter type
    console.log('\n--- Test 5: Get monthly data by meter type ---');
    const monthlyData = await utilityCalcsService.getMonthlyDataByType(projectId, 'Electric');
    
    console.log(`Monthly electric data retrieved successfully:`);
    console.log(`Found ${monthlyData.length} monthly records`);
    if (monthlyData.length > 0) {
      console.log('First few monthly records:');
      console.log(monthlyData.slice(0, 3));
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nUtility calculations tests completed.');
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testUtilityCalcs();

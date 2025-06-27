import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UtilityDataPrismaService } from '../../modules/portfolio-manager/utility/utility-data.service';
import { UtilityCalcsPrismaService } from '../../modules/utility-calcs/utility-calcs-prisma.service';
import { WeatherComparisonPrismaService } from '../../modules/portfolio-manager/weather/weather-comparison.service';
import { testConfig } from './test-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive test script for all Portfolio Manager Prisma services
 * Tests the entire flow from fetching utility data to calculating metrics and comparing weather
 */
async function testAllServices() {
  console.log('Starting comprehensive test of all Portfolio Manager Prisma services...');
  console.log('This test will run through the entire flow of data processing:');
  console.log('1. Fetch and store utility data');
  console.log('2. Process utility calculations');
  console.log('3. Fetch and compare weather data');
  console.log('-----------------------------------------------------------');
  
  // Create a NestJS application context to get the services
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the services from the application context
  const utilityDataService = app.get(UtilityDataPrismaService);
  const utilityCalcsService = app.get(UtilityCalcsPrismaService);
  const weatherComparisonService = app.get(WeatherComparisonPrismaService);
  
  // Get test configuration
  const { projectId, propertyId } = testConfig;
  console.log(`Testing with projectId=${projectId}, propertyId=${propertyId}`);
  
  try {
    // Step 1: Fetch and store utility data
    console.log('\n=== STEP 1: FETCH AND STORE UTILITY DATA ===');
    const startDate = '2023-12-01';
    const endDate = '2024-12-31';
    
    console.log(`Fetching utility data from ${startDate} to ${endDate}...`);
    const utilityDataResult = await utilityDataService.fetchAndStoreUtilityData(
      projectId,
      propertyId,
      startDate,
      endDate
    );
    
    console.log('Utility data fetch and store result:');
    console.log(utilityDataResult);
    
    if (!utilityDataResult.success) {
      throw new Error('Failed to fetch and store utility data. Cannot proceed with further steps.');
    }
    
    // Verify the stored data
    const storedDataResult = await utilityDataService.getUtilityDataForProject(projectId);
    console.log(`Verified stored utility data: Found ${storedDataResult.count} records`);
    
    // Step 2: Process utility calculations
    console.log('\n=== STEP 2: PROCESS UTILITY CALCULATIONS ===');
    console.log('Processing utility calculations...');
    const utilityCalcsResult = await utilityCalcsService.processUtilityCalculations(projectId, propertyId);
    
    console.log('Utility calculations processing result:');
    console.log(utilityCalcsResult);
    
    if (!utilityCalcsResult.success) {
      throw new Error('Failed to process utility calculations. Cannot proceed with further steps.');
    }
    
    // Get utility calculations - now needs to fetch directly from the database
    const calculationsData = await prisma.utility_calcs.findMany({
      where: { project_id: projectId }
    });
    console.log(`Retrieved utility calculations: Found ${calculationsData.length} records`);
    
    // Get total utility cost
    const costResult = await utilityCalcsService.getTotalUtilityCost(projectId);
    console.log('Total utility cost:');
    console.log(costResult);
    
    // Get monthly data by meter type
    const monthlyDataResult = await utilityCalcsService.getMonthlyDataByType(projectId, 'Electric');
    console.log(`Retrieved monthly electric data: Found ${monthlyDataResult.length} records`);
    
    // Step 3: Fetch and compare weather data
    console.log('\n=== STEP 3: FETCH AND COMPARE WEATHER DATA ===');
    const years = [2023, 2024];
    
    // Get ZIP code from the property data
    const zipCode = '90210'; // Example ZIP code, would be retrieved from property data in a real implementation
    
    console.log(`Fetching weather data for years: ${years.join(', ')}...`);
    const weatherDataResult = await weatherComparisonService.fetchAndStoreWeatherData(
      projectId,
      zipCode,
      years
    );
    
    console.log('Weather data fetch and store result:');
    console.log(weatherDataResult);
    
    if (!weatherDataResult.success) {
      throw new Error('Failed to fetch and store weather data. Cannot proceed with comparison.');
    }
    
    // Compare weather data
    console.log('Comparing weather data between 2023 and 2024...');
    const comparisonResult = await weatherComparisonService.compareWeatherData(
      projectId,
      zipCode,
      2023,
      2024
    );
    
    if (comparisonResult.success && comparisonResult.data) {
      console.log('Weather comparison completed successfully');
      console.log('Annual comparison summary:');
      
      const annualComparison = comparisonResult.data.annualComparison;
      
      // Format the annual comparison data for better readability
      console.log('Heating Degree Days:');
      console.log(`  2023: ${Math.round(annualComparison.heatingDegreeDays.year1)}`);
      console.log(`  2024: ${Math.round(annualComparison.heatingDegreeDays.year2)}`);
      console.log(`  Change: ${Math.round(annualComparison.heatingDegreeDays.difference)} (${annualComparison.heatingDegreeDays.percentChange.toFixed(1)}%)`);
      
      console.log('Cooling Degree Days:');
      console.log(`  2023: ${Math.round(annualComparison.coolingDegreeDays.year1)}`);
      console.log(`  2024: ${Math.round(annualComparison.coolingDegreeDays.year2)}`);
      console.log(`  Change: ${Math.round(annualComparison.coolingDegreeDays.difference)} (${annualComparison.coolingDegreeDays.percentChange.toFixed(1)}%)`);
      
      console.log('Total Degree Days:');
      console.log(`  2023: ${Math.round(annualComparison.totalDegreeDays.year1)}`);
      console.log(`  2024: ${Math.round(annualComparison.totalDegreeDays.year2)}`);
      console.log(`  Change: ${Math.round(annualComparison.totalDegreeDays.difference)} (${annualComparison.totalDegreeDays.percentChange.toFixed(1)}%)`);
    } else {
      console.error(`Error comparing weather data: ${comparisonResult.message}`);
    }
    
    // Step 4: Summary and integration test
    console.log('\n=== STEP 4: SUMMARY AND INTEGRATION TEST ===');
    console.log('Testing integration between utility data and weather data...');
    
    // Get the monthly electric data
    const electricData = await utilityCalcsService.getMonthlyDataByType(projectId, 'Electric');
    
    if (electricData.length > 0 && comparisonResult.success && comparisonResult.data) {
      console.log('Correlating electric usage with weather data...');
      
      // Simple correlation analysis between electric usage and cooling degree days
      // In a real implementation, this would be more sophisticated
      const correlationData: Array<{month: number; coolingDegreeDays: number; electricUsage: number}> = [];
      
      for (const monthlyComparison of comparisonResult.data.monthlyComparison) {
        const month = monthlyComparison.month;
        const year = 2024; // Using 2024 data for this example
        
        // Find the corresponding electric data
        const matchingElectricData = electricData.find(
          (data: {month: number; year: number; usage: any}) => data.month === month && data.year === year
        );
        
        if (matchingElectricData) {
          correlationData.push({
            month,
            coolingDegreeDays: monthlyComparison.coolingDegreeDays.year2,
            electricUsage: Number(matchingElectricData.usage)
          });
        }
      }
      
      console.log('Sample correlation data (first 3 months):');
      console.log(correlationData.slice(0, 3));
      
      // Calculate a simple correlation coefficient
      // This is a very basic implementation
      if (correlationData.length > 0) {
        const cddValues = correlationData.map(item => item.coolingDegreeDays);
        const usageValues = correlationData.map(item => item.electricUsage);
        
        // Calculate means
        const cddMean = cddValues.reduce((sum, val) => sum + val, 0) / cddValues.length;
        const usageMean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
        
        // Calculate correlation coefficient
        let numerator = 0;
        let cddDenominator = 0;
        let usageDenominator = 0;
        
        for (let i = 0; i < correlationData.length; i++) {
          const cddDiff = cddValues[i] - cddMean;
          const usageDiff = usageValues[i] - usageMean;
          
          numerator += cddDiff * usageDiff;
          cddDenominator += cddDiff * cddDiff;
          usageDenominator += usageDiff * usageDiff;
        }
        
        const correlation = numerator / Math.sqrt(cddDenominator * usageDenominator);
        
        console.log(`Correlation between cooling degree days and electric usage: ${correlation.toFixed(2)}`);
        console.log('Interpretation:');
        console.log('  1.0: Perfect positive correlation');
        console.log('  0.0: No correlation');
        console.log(' -1.0: Perfect negative correlation');
        
        if (correlation > 0.7) {
          console.log('Strong positive correlation: Electric usage increases with cooling degree days');
        } else if (correlation > 0.3) {
          console.log('Moderate positive correlation: Some relationship between electric usage and cooling degree days');
        } else if (correlation > -0.3) {
          console.log('Weak or no correlation: Little relationship between electric usage and cooling degree days');
        } else if (correlation > -0.7) {
          console.log('Moderate negative correlation: Electric usage decreases as cooling degree days increase');
        } else {
          console.log('Strong negative correlation: Electric usage strongly decreases as cooling degree days increase');
        }
      }
    }
    
    console.log('\nAll tests completed successfully!');
    console.log('Summary:');
    console.log(`- Utility Data: ${storedDataResult.count} records`);
    console.log(`- Utility Calculations: ${calculationsData.length} records`);
    console.log(`- Weather Data: ${weatherDataResult.count} records`);
    console.log(`- Weather Comparison: ${comparisonResult.success ? 'Completed' : 'Failed'}`);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nComprehensive test completed.');
    await app.close();
  }
}

// Run the test
testAllServices();

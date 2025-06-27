import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WeatherComparisonPrismaService } from '../../modules/portfolio-manager/weather/weather-comparison.service';
import { testConfig } from './test-config';

/**
 * Test script for WeatherComparisonPrismaService
 * Tests fetching weather data and comparing between years
 */
async function testWeatherComparison() {
  console.log('Starting weather comparison test...');
  
  // Create a NestJS application context to get the service
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the WeatherComparisonPrismaService from the application context
  const weatherComparisonService = app.get(WeatherComparisonPrismaService);
  
  // Get test configuration
  const { projectId } = testConfig;
  const zipCode = '90210'; // Use ZIP code for Beverly Hills as an example
  console.log(`Testing weather comparison with projectId=${projectId}, zipCode=${zipCode}`);
  
  try {
    // Test 1: Fetch and store weather data for 2023 and 2024
    console.log('\n--- Test 1: Fetch and store weather data ---');
    const years = [2023, 2024];
    
    const fetchAndStoreResult = await weatherComparisonService.fetchAndStoreWeatherData(
      projectId,
      zipCode,
      years
    );
    
    console.log('Fetch and store weather data result:');
    console.log(fetchAndStoreResult);
    
    if (!fetchAndStoreResult.success) {
      throw new Error('Failed to fetch and store weather data. Cannot proceed with comparison.');
    }
    
    // Test 2: Compare weather data between 2023 and 2024
    console.log('\n--- Test 2: Compare weather data ---');
    const comparisonResult = await weatherComparisonService.compareWeatherData(
      projectId,
      zipCode,
      2023,
      2024
    );
    
    if (comparisonResult.success && comparisonResult.data) {
      console.log('Weather comparison result:');
      console.log('Annual comparison:');
      console.log(comparisonResult.data.annualComparison);
      
      console.log('\nMonthly comparison sample (first month):');
      if (comparisonResult.data.monthlyComparison && comparisonResult.data.monthlyComparison.length > 0) {
        console.log(comparisonResult.data.monthlyComparison[0]);
      }
    } else {
      console.error(`Error comparing weather data: ${comparisonResult.message}`);
    }
    
    // Test 3: Retrieve stored weather comparison
    console.log('\n--- Test 3: Retrieve stored weather comparison ---');
    const retrieveResult = await weatherComparisonService.getWeatherComparison(
      projectId,
      zipCode,
      2023,
      2024
    );
    
    if (retrieveResult.success && retrieveResult.data) {
      console.log('Retrieved weather comparison:');
      console.log('Annual comparison:');
      console.log(retrieveResult.data.annualComparison);
    } else {
      console.error(`Error retrieving weather comparison: ${retrieveResult.message}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nWeather comparison tests completed.');
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testWeatherComparison();

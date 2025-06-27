import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Script to check the weather_comparison table data
 */
async function checkWeatherData() {
  console.log('Checking weather_comparison table data...');
  
  // Create a NestJS application context to get the service
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the PrismaService from the application context
  const prisma = app.get(PrismaService);
  
  try {
    // Get all records from the weather_comparison table
    const allRecords = await prisma.weather_comparison.findMany({
      orderBy: [
        { project_id: 'asc' },
        { zip_code: 'asc' },
        { base_year: 'asc' },
        { month: 'asc' }
      ]
    });
    
    console.log(`Found ${allRecords.length} records in the weather_comparison table`);
    
    // Group records by project_id
    const projectGroups: Record<string, typeof allRecords> = {};
    for (const record of allRecords) {
      if (!projectGroups[record.project_id]) {
        projectGroups[record.project_id] = [];
      }
      projectGroups[record.project_id].push(record);
    }
    
    // Print summary for each project
    console.log('\nSummary by project:');
    for (const projectId in projectGroups) {
      const records = projectGroups[projectId];
      const zipCodes = new Set(records.map((r) => r.zip_code));
      const baseYears = new Set(records.map((r) => r.base_year));
      const comparisonYears = new Set(records.map((r) => r.comparison_year).filter((y) => y !== null));
      
      console.log(`\nProject ID: ${projectId}`);
      console.log(`  Records: ${records.length}`);
      console.log(`  ZIP Codes: ${Array.from(zipCodes).join(', ')}`);
      console.log(`  Base Years: ${Array.from(baseYears).join(', ')}`);
      console.log(`  Comparison Years: ${Array.from(comparisonYears).join(', ')}`);
      
      // Print sample record
      if (records.length > 0) {
        console.log('\nSample record:');
        const sample = records[0];
        console.log({
          id: sample.id,
          project_id: sample.project_id,
          zip_code: sample.zip_code,
          station_id: sample.station_id,
          month: sample.month,
          base_year: sample.base_year,
          comparison_year: sample.comparison_year,
          base_year_hdd: sample.base_year_hdd,
          comparison_year_hdd: sample.comparison_year_hdd
        });
      }
    }
    
    // Check for our specific project and years
    const testConfig = require('./test-config');
    const projectId = testConfig.projectId;
    const zipCode = '90210'; // The ZIP code we're using in tests
    
    console.log(`\nChecking for our test project (${projectId}) and ZIP code (${zipCode}):`);
    
    const projectRecords = await prisma.weather_comparison.findMany({
      where: {
        project_id: projectId,
        zip_code: zipCode
      }
    });
    
    console.log(`Found ${projectRecords.length} records for our test project and ZIP code`);
    
    if (projectRecords.length > 0) {
      const baseYears = new Set(projectRecords.map(r => r.base_year));
      const comparisonYears = new Set(projectRecords.map(r => r.comparison_year).filter(y => y !== null));
      
      console.log(`  Base Years: ${Array.from(baseYears).join(', ')}`);
      console.log(`  Comparison Years: ${Array.from(comparisonYears).join(', ')}`);
    }
    
    // Check for 2023 data specifically
    const year2023Records = await prisma.weather_comparison.findMany({
      where: {
        project_id: projectId,
        zip_code: zipCode,
        base_year: 2023
      }
    });
    
    console.log(`\nFound ${year2023Records.length} records for 2023 as base_year`);
    
    // Check for 2023 as comparison_year
    const year2023ComparisonRecords = await prisma.weather_comparison.findMany({
      where: {
        project_id: projectId,
        zip_code: zipCode,
        comparison_year: 2023
      }
    });
    
    console.log(`Found ${year2023ComparisonRecords.length} records for 2023 as comparison_year`);
    
  } catch (error) {
    console.error('Error checking weather data:', error);
  } finally {
    await app.close();
    console.log('\nCheck completed.');
  }
}

// Run the check
checkWeatherData();

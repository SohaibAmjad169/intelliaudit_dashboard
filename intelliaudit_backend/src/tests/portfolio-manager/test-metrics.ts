import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MetricsService } from '../../modules/portfolio-manager/metrics/metrics.service';
import { testConfig } from './test-config';

async function testMetrics() {
  console.log('Starting metrics test...');
  const app = await NestFactory.create(AppModule);
  const metricsService = app.get(MetricsService);
  
  try {
    // Using IDs from the test config
    const { projectId, propertyId } = testConfig;
    
    console.log(`Testing syncMetricsFromPortfolioManager with projectId=${projectId}, propertyId=${propertyId}`);
    
    const result = await metricsService.syncMetricsFromPortfolioManager(
      projectId, 
      propertyId
    );
    
    console.log('Metrics sync successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error syncing metrics:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await app.close();
    console.log('Test completed.');
  }
}

// Run the test
testMetrics().catch(err => {
  console.error('Unhandled error in test script:', err);
});

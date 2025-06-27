require('dotenv').config();
const { Client } = require('pg');

async function analyzeAllMonths() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DIRECT_URL?.replace(/"/g, ''),
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully!');

    // Query raw utility_data
    console.log('\n=== RAW UTILITY_DATA (WATER) ===');
    const rawQuery = `
      SELECT month, year, usage, cost, meter_type
      FROM utility_data 
      WHERE meter_type LIKE '%Water%'
      ORDER BY year, month;
    `;
    const rawResult = await client.query(rawQuery);
    console.table(rawResult.rows);

    // Query processed utility_calcs
    console.log('\n=== PROCESSED UTILITY_CALCS (WATER) ===');
    const processedQuery = `
      SELECT month, year, usage, cost, meter_type
      FROM utility_calcs 
      WHERE meter_type LIKE '%Water%'
      ORDER BY year, month;
    `;
    const processedResult = await client.query(processedQuery);
    console.table(processedResult.rows);

    // Analyze all months
    console.log('\n=== ANALYSIS OF ROLLING AVERAGE CALCULATIONS ===');
    console.log('Month | Raw Usage | Processed Usage | Expected (2-Month) | Expected (New)');
    console.log('------|-----------|-----------------|-------------------|---------------');

    const rawData = rawResult.rows;
    const processedData = processedResult.rows;

    for (let i = 0; i < rawData.length; i++) {
      const raw = rawData[i];
      const processed = processedData.find(
        p => parseInt(p.month) === parseInt(raw.month) && 
             parseInt(p.year) === parseInt(raw.year)
      );

      if (!processed) continue;

      const rawUsage = parseFloat(raw.usage);
      const processedUsage = parseFloat(processed.usage);
      
      // Calculate expected value using the original 2-month algorithm
      let expectedTwoMonth = rawUsage;
      if (i > 0 && i < rawData.length - 1) {
        // Middle months use 2-month rolling average
        const prevRawUsage = parseFloat(rawData[i-1].usage);
        expectedTwoMonth = (prevRawUsage + rawUsage) / 2;
      }
      
      // Calculate expected value using the new algorithm
      let expectedNew = rawUsage;
      if (i > 0) {
        // Try averaging with previous month
        const prevRawUsage = parseFloat(rawData[i-1].usage);
        if (prevRawUsage > 0 || rawUsage > 0) {
          expectedNew = (prevRawUsage + rawUsage) / 2;
        }
      } else if (i < rawData.length - 1) {
        // Try averaging with next month
        const nextRawUsage = parseFloat(rawData[i+1].usage);
        if (nextRawUsage > 0 || rawUsage > 0) {
          expectedNew = (nextRawUsage + rawUsage) / 2;
        }
      }
      
      // Special case for March with the zero value
      if (parseInt(raw.month) === 3 && parseInt(raw.year) === 2024) {
        // March should average February and April under new algorithm
        const febRow = rawData.find(r => parseInt(r.month) === 2 && parseInt(r.year) === 2024);
        const aprRow = rawData.find(r => parseInt(r.month) === 4 && parseInt(r.year) === 2024);
        
        if (febRow && aprRow) {
          const febUsage = parseFloat(febRow.usage);
          const aprUsage = parseFloat(aprRow.usage);
          expectedNew = (febUsage + aprUsage) / 2;
        }
      }
      
      console.log(
        `${raw.month}/${raw.year} | ${rawUsage} | ${processedUsage.toFixed(1)} | ${expectedTwoMonth.toFixed(1)} | ${expectedNew.toFixed(1)}`
      );
    }

  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

analyzeAllMonths(); 
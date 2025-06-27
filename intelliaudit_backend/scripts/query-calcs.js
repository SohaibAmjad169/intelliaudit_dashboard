require('dotenv').config();
const { Client } = require('pg');

async function queryUtilityCalcs() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DIRECT_URL?.replace(/"/g, ''),
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully!');

    // Query utility_calcs for water data
    console.log('\n=== UTILITY_CALCS WATER DATA ===');
    const waterQuery = `
      SELECT month, year, usage, cost, meter_type, id
      FROM utility_calcs 
      WHERE meter_type LIKE '%Water%'
      ORDER BY year, month;
    `;
    const waterResult = await client.query(waterQuery);
    console.table(waterResult.rows);

    // Calculate what March should be with the new algorithm
    console.log('\n=== ANALYSIS OF MARCH DATA ===');
    
    // Find the rows by month and year with appropriate type conversion
    const marchRow = waterResult.rows.find(row => parseInt(row.month) === 3 && parseInt(row.year) === 2024);
    const febRow = waterResult.rows.find(row => parseInt(row.month) === 2 && parseInt(row.year) === 2024);
    const aprRow = waterResult.rows.find(row => parseInt(row.month) === 4 && parseInt(row.year) === 2024);
    
    if (marchRow && febRow && aprRow) {
      console.log(`February Usage: ${febRow.usage}`);
      console.log(`March Usage: ${marchRow.usage}`);
      console.log(`April Usage: ${aprRow.usage}`);
      
      const expectedMarchUsage = (parseFloat(febRow.usage) + parseFloat(aprRow.usage)) / 2;
      const actualMarchUsage = parseFloat(marchRow.usage);
      
      console.log(`\nExpected March usage with new algorithm: ${expectedMarchUsage.toFixed(1)}`);
      console.log(`Actual March usage in database: ${actualMarchUsage.toFixed(1)}`);
      
      if (Math.abs(expectedMarchUsage - actualMarchUsage) < 1) {
        console.log('\n✅ March data appears to be using the new algorithm (average of Feb and Apr)');
      } else {
        const oldAlgorithmValue = parseFloat(febRow.usage) / 2;
        if (Math.abs(oldAlgorithmValue - actualMarchUsage) < 1) {
          console.log('\n❌ March data appears to still be using the old algorithm (just half of Feb)');
        } else {
          console.log('\n❓ March data doesn\'t match either algorithm');
        }
      }
    } else {
      console.log("Could not find all required month data. Available months:");
      waterResult.rows.forEach(row => {
        console.log(`Month: ${row.month}, Year: ${row.year}`);
      });
    }

  } catch (error) {
    console.error('Error executing query:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

queryUtilityCalcs(); 
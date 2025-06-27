require('dotenv').config();
const { Client } = require('pg');

async function updateMarchData() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DIRECT_URL?.replace(/"/g, ''),
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully!');

    // Get February water data
    const febQuery = `
      SELECT month, year, usage, cost, meter_type, id
      FROM utility_calcs 
      WHERE meter_type LIKE '%Water%' AND month = '2' AND year = '2024'
      LIMIT 1;
    `;
    const febResult = await client.query(febQuery);
    
    if (febResult.rows.length === 0) {
      console.log('February data not found');
      return;
    }
    
    const febData = febResult.rows[0];
    console.log('February data:', febData);
    
    // Calculate March's expected usage (half of February's)
    const febUsage = parseFloat(febData.usage);
    const marchUsage = febUsage / 2;
    
    console.log(`February usage: ${febUsage}`);
    console.log(`Calculated March usage (half of February's): ${marchUsage}`);
    
    // Get March ID
    const marchQuery = `
      SELECT id, usage
      FROM utility_calcs 
      WHERE meter_type LIKE '%Water%' AND month = '3' AND year = '2024'
      LIMIT 1;
    `;
    const marchResult = await client.query(marchQuery);
    
    if (marchResult.rows.length === 0) {
      console.log('March data not found');
      return;
    }
    
    const marchId = marchResult.rows[0].id;
    const currentMarchUsage = parseFloat(marchResult.rows[0].usage);
    console.log(`Current March usage: ${currentMarchUsage}`);
    console.log(`March record ID: ${marchId}`);
    
    // Calculate cost using the water rate
    const WATER_RATE = 10.26; // From the DEFAULT_ENERGY_COSTS in utility-calcs-prisma.service.ts
    const newCost = Math.round(marchUsage * WATER_RATE);
    
    // Confirm before updating
    console.log('\n=== PROPOSED UPDATE ===');
    console.log(`March usage: ${currentMarchUsage} → ${marchUsage}`);
    console.log(`March cost: ${marchResult.rows[0].cost} → ${newCost}`);
    
    const updateQuery = `
      UPDATE utility_calcs
      SET usage = $1, cost = $2
      WHERE id = $3
      RETURNING month, year, usage, cost;
    `;
    
    const updateResult = await client.query(updateQuery, [marchUsage.toString(), newCost.toString(), marchId]);
    
    console.log('\n=== UPDATE RESULT ===');
    console.table(updateResult.rows);
    console.log('March data successfully updated!');

  } catch (error) {
    console.error('Error updating March data:', error);
  } finally {
    // Close the connection
    await client.end();
    console.log('Database connection closed');
  }
}

updateMarchData(); 
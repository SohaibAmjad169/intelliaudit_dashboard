require('dotenv').config();
const { Client } = require('pg');

async function runQuery() {
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DIRECT_URL?.replace(/"/g, ''),
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database successfully!');

    // First, let's check the table columns
    console.log('\n=== PROJECTS TABLE COLUMNS ===');
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects';
    `;
    const columnsResult = await client.query(columnsQuery);
    console.table(columnsResult.rows);

    // Query projects data for Hobart
    console.log('\n=== HOBART PROJECT DATA ===');
    const projectQuery = `
      SELECT 
        id, 
        property_name, 
        property_address, 
        property_year_built,
        property_gross_floor_area,
        building_address,
        building_type,
        total_units,
        building_info,
        unit_types,
        ec_o
      FROM projects 
      WHERE property_address LIKE '%Hobart%'
      OR building_address LIKE '%Hobart%'
      OR property_name LIKE '%Hobart%';
    `;
    const projectResult = await client.query(projectQuery);
    
    // Since results might be large, just show the project IDs first
    console.log(`Found ${projectResult.rows.length} matching projects`);
    
    if (projectResult.rows.length > 0) {
      // Display key info for each project
      projectResult.rows.forEach((row, index) => {
        console.log(`\n--- Project ${index + 1} ---`);
        console.log(`ID: ${row.id}`);
        console.log(`Name: ${row.property_name || row.name || 'Unknown'}`);
        console.log(`Address: ${row.property_address || row.building_address || 'Unknown'}`);
        console.log(`Year Built: ${row.property_year_built || 'Unknown'}`);
        console.log(`Gross Floor Area: ${row.property_gross_floor_area || 'Unknown'} sq ft`);
        console.log(`Total Units: ${row.total_units || 'Unknown'}`);
        
        // Check for unit_types
        if (row.unit_types) {
          console.log('\nUnit Types:');
          const unitTypes = typeof row.unit_types === 'string' 
            ? JSON.parse(row.unit_types) 
            : row.unit_types;
          
          console.log(JSON.stringify(unitTypes, null, 2));
        }
        
        // Check for building_info
        if (row.building_info) {
          console.log('\nBuilding Info:');
          const buildingInfo = typeof row.building_info === 'string' 
            ? JSON.parse(row.building_info) 
            : row.building_info;
          
          console.log(JSON.stringify(buildingInfo, null, 2));
        }
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

runQuery(); 
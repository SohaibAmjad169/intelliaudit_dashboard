// Script to run Prisma migrations
const { exec } = require('child_process');

// Run the migration command
exec('npx prisma migrate dev --name add_suggested_matches', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Migration output: ${stdout}`);
}); 
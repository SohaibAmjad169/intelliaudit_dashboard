// Script to check environment variables
require('dotenv').config();

console.log('Checking environment variables...');

// Required environment variables
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'OPENAI_API_KEY'
];

// Optional but recommended variables
const recommendedVars = [
  'PORT',
  'NODE_ENV'
];

// Check required variables
let missingRequired = false;
console.log('\nRequired variables:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName} is missing`);
    missingRequired = true;
  } else {
    // Show first few characters for security
    const displayValue = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${varName} is set (${displayValue})`);
  }
}

// Check recommended variables
console.log('\nRecommended variables:');
for (const varName of recommendedVars) {
  const value = process.env[varName];
  if (!value) {
    console.warn(`⚠️ ${varName} is not set (optional)`);
  } else {
    console.log(`✅ ${varName} is set (${value})`);
  }
}

// Check Supabase URL format
if (process.env.SUPABASE_URL) {
  const url = process.env.SUPABASE_URL;
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    console.warn(`⚠️ SUPABASE_URL format looks unusual: ${url}`);
    console.warn('   Expected format: https://your-project-id.supabase.co');
  }
}

// Summary
console.log('\nSummary:');
if (missingRequired) {
  console.error('❌ Some required environment variables are missing. Please check your .env file.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set.');
}

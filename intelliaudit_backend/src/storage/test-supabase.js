// Test script to verify Supabase storage connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testSupabaseStorage() {
  console.log('Testing Supabase storage connection...');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase environment variables');
    console.error('Required: SUPABASE_URL, SUPABASE_KEY');
    process.exit(1);
  }
  
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by listing buckets
    console.log('Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('ERROR: Failed to list buckets:', bucketsError.message);
      process.exit(1);
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public ? 'yes' : 'no'})`);
    });
    
    // Check if equipment-photos bucket exists
    const equipmentBucket = buckets.find(b => b.name === 'equipment-photos');
    if (!equipmentBucket) {
      console.error('ERROR: equipment-photos bucket not found');
      console.log('Please create this bucket in the Supabase dashboard');
      process.exit(1);
    }
    
    // Test uploading a small test file
    console.log('\nTesting file upload to equipment-photos bucket...');
    
    // Create a small test file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for Supabase storage upload.');
    
    // Read the file
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Upload to Supabase
    const testFilename = `test-upload-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('equipment-photos')
      .upload(testFilename, fileBuffer, {
        contentType: 'text/plain',
        cacheControl: '3600'
      });
    
    // Clean up the local test file
    fs.unlinkSync(testFilePath);
    
    if (uploadError) {
      console.error('ERROR: Failed to upload test file:', uploadError.message);
      process.exit(1);
    }
    
    console.log('Test file uploaded successfully:', uploadData.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('equipment-photos')
      .getPublicUrl(uploadData.path);
    
    console.log('Public URL:', urlData.publicUrl);
    
    // Clean up by deleting the test file
    console.log('\nCleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('equipment-photos')
      .remove([uploadData.path]);
    
    if (deleteError) {
      console.error('WARNING: Failed to delete test file:', deleteError.message);
    } else {
      console.log('Test file deleted successfully');
    }
    
    console.log('\nSUCCESS: Supabase storage connection and operations verified!');
  } catch (error) {
    console.error('ERROR: Unexpected error during Supabase storage test:', error);
    process.exit(1);
  }
}

testSupabaseStorage();

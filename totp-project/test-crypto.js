#!/usr/bin/env node

// Test crypto polyfill
console.log('Testing crypto polyfill...');

try {
  // Try to require crypto-browserify directly
  const crypto = require('crypto-browserify');
  console.log('✅ crypto-browserify loaded successfully');
  
  // Test basic crypto functionality
  const randomBytes = crypto.randomBytes(32);
  console.log('✅ randomBytes working:', randomBytes.length, 'bytes');
  
  // Test HMAC
  const hmac = crypto.createHmac('sha1', 'secret');
  hmac.update('test');
  const digest = hmac.digest('hex');
  console.log('✅ HMAC working:', digest);
  
  console.log('✅ Basic crypto functionality is working!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('❌ Crypto polyfill failed');
}

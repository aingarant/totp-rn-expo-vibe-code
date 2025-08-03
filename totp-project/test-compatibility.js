#!/usr/bin/env node

// Test script to validate React Native compatibility fixes
console.log('🧪 Testing React Native compatibility...');

try {
  // Test polyfill import
  require('./src/polyfills');
  console.log('✅ Polyfills loaded successfully');

  // Test crypto availability
  if (global.crypto && global.crypto.getRandomValues) {
    const testArray = new Uint8Array(16);
    global.crypto.getRandomValues(testArray);
    console.log('✅ crypto.getRandomValues working');
  } else {
    console.log('⚠️  crypto.getRandomValues not available');
  }

  // Test TOTPService initialization
  const { TOTPService } = require('./src/services/TOTPService');
  const totpService = TOTPService.getInstance();
  const testSecret = totpService.generateTestSecret();
  console.log('✅ TOTPService working, generated test secret:', testSecret);

  // Test TOTP generation
  const code = totpService.generateTOTP(testSecret);
  console.log('✅ TOTP generation working, code:', code);

  console.log('🎉 All React Native compatibility tests passed!');
} catch (error) {
  console.error('❌ Compatibility test failed:', error.message);
  process.exit(1);
}

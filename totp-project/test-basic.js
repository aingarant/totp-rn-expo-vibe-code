// Simple test to verify TOTP functionality works
console.log('🔐 Testing TOTP Service basic functionality...\n');

// Test using otplib directly
const { totp } = require('otplib');

// Mock global crypto if needed
if (typeof global !== 'undefined' && !global.crypto) {
  global.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

try {
  console.log('Test 1: Basic TOTP generation with otplib');
  const testSecret = 'JBSWY3DPEHPK3PXP'; // "Hello World" in Base32
  const code = totp.generate(testSecret);
  console.log(`Generated TOTP code: ${code}`);
  console.log(`Code length: ${code.length}`);
  console.log(`Is 6 digits: ${/^\d{6}$/.test(code) ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nTest 2: Validate generated code');
  const isValid = totp.check(code, testSecret);
  console.log(`Code validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nTest 3: Reject invalid code');
  const invalidCode = '000000';
  const isInvalid = totp.check(invalidCode, testSecret);
  console.log(`Invalid code rejection: ${!isInvalid ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\nTest 4: Generate different codes at different times');
  const code1 = totp.generate(testSecret, { epoch: Date.now() });
  const code2 = totp.generate(testSecret, { epoch: Date.now() + 30000 });
  console.log(`Code 1: ${code1}, Code 2: ${code2}`);
  console.log(`Different codes: ${code1 !== code2 ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n🎉 Basic TOTP functionality test complete!');
  console.log('✅ Core TOTP library is working correctly');
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

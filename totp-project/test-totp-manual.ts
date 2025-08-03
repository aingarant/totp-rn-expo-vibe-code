import { TOTPService } from './src/services/TOTPService';

// Mock crypto for Node.js environment
(global as any).crypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

async function testTOTPService() {
  console.log('🔐 Testing TOTP Service...\n');

  const totpService = TOTPService.getInstance();
  
  // Test 1: Generate TOTP code
  console.log('Test 1: Generate TOTP code');
  const testSecret = 'JBSWY3DPEHPK3PXP'; // "Hello World" in Base32
  const code = totpService.generateTOTP(testSecret);
  console.log(`Generated TOTP code: ${code}`);
  console.log(`Code length: ${code.length}`);
  console.log(`Is 6 digits: ${/^\d{6}$/.test(code)}`);
  
  // Test 2: Validate the generated code
  console.log('\nTest 2: Validate TOTP code');
  const isValid = totpService.validateTOTP(code, testSecret);
  console.log(`Code validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 3: Reject invalid code
  console.log('\nTest 3: Reject invalid code');
  const invalidCode = '000000';
  const isInvalid = totpService.validateTOTP(invalidCode, testSecret);
  console.log(`Invalid code rejection: ${!isInvalid ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 4: Secret validation
  console.log('\nTest 4: Secret validation');
  const validSecret = 'JBSWY3DPEHPK3PXP';
  const isSecretValid = totpService.validateSecret(validSecret);
  console.log(`Valid secret check: ${isSecretValid ? '✅ PASS' : '❌ FAIL'}`);
  
  const invalidSecret = 'InvalidSecret123!';
  const isSecretInvalid = totpService.validateSecret(invalidSecret);
  console.log(`Invalid secret rejection: ${!isSecretInvalid ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 5: Generate test secret
  console.log('\nTest 5: Generate test secret');
  const generatedSecret = totpService.generateTestSecret();
  console.log(`Generated secret: ${generatedSecret}`);
  console.log(`Secret validation: ${totpService.validateSecret(generatedSecret) ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test 6: Create OTPAuth URL
  console.log('\nTest 6: Create OTPAuth URL');
  const otpAuthURL = totpService.createOTPAuthURL(
    'TestApp',
    'user@example.com',
    testSecret
  );
  console.log(`OTPAuth URL: ${otpAuthURL}`);
  console.log(`Contains required parts: ${
    otpAuthURL.includes('otpauth://totp/') &&
    otpAuthURL.includes('TestApp') &&
    otpAuthURL.includes('user@example.com') &&
    otpAuthURL.includes(`secret=${testSecret}`)
      ? '✅ PASS' : '❌ FAIL'
  }`);
  
  // Test 7: Parse OTPAuth URL
  console.log('\nTest 7: Parse OTPAuth URL');
  try {
    const parseResult = totpService.parseOTPAuthURL(otpAuthURL);
    console.log(`Parse result:`, parseResult);
    console.log(`Parse success: ${parseResult.secret === testSecret ? '✅ PASS' : '❌ FAIL'}`);
  } catch (error) {
    console.log(`Parse failed: ❌ FAIL - ${error}`);
  }
  
  console.log('\n🎉 TOTP Service testing complete!');
}

testTOTPService().catch(console.error);

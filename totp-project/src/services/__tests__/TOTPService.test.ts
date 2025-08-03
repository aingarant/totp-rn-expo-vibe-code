import { TOTPService } from '../TOTPService';

// Import polyfills for test environment
import '../../polyfills';

// Mock crypto for testing environment
declare global {
  namespace NodeJS {
    interface Global {
      crypto: any;
    }
  }
}

(global as any).crypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};

describe('TOTPService', () => {
  let totpService: TOTPService;

  beforeAll(() => {
    totpService = TOTPService.getInstance();
  });

  describe('Basic functionality', () => {
    test('should generate a 6-digit TOTP code by default', () => {
      const secret = 'JBSWY3DPEHPK3PXP'; // "Hello World" in Base32
      const code = totpService.generateTOTP(secret);

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
    });

    test('should validate a correct TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = totpService.generateTOTP(secret);

      const isValid = totpService.validateTOTP(code, secret);
      expect(isValid).toBe(true);
    });

    test('should reject an incorrect TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const wrongCode = '000000';

      const isValid = totpService.validateTOTP(wrongCode, secret);
      expect(isValid).toBe(false);
    });

    test('should validate a correct Base32 secret', () => {
      const validSecret = 'JBSWY3DPEHPK3PXP';
      expect(totpService.validateSecret(validSecret)).toBe(true);
    });

    test('should generate test secrets', () => {
      const secret = totpService.generateTestSecret();

      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
      expect(totpService.validateSecret(secret)).toBe(true);
    });

    test('should create OTPAuth URLs', () => {
      const url = totpService.createOTPAuthURL(
        'TestApp',
        'user@example.com',
        'JBSWY3DPEHPK3PXP'
      );

      expect(url).toContain('otpauth://totp/');
      expect(url).toContain('TestApp');
      expect(url).toContain('user%40example.com'); // @ is URL encoded as %40
      expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
    });
  });
});

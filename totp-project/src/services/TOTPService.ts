import { totp, authenticator } from '@otplib/preset-browser';
import * as thirtyTwo from 'thirty-two';
import * as Crypto from 'expo-crypto';
import { TOTPOptions, TOTPAccount, QRCodeResult } from '@/types';

// Define algorithm constants for React Native compatibility
const HashAlgorithms = {
  SHA1: 'sha1',
  SHA256: 'sha256',
  SHA512: 'sha512',
} as const;

// Define proper algorithm types
type HashAlgorithm = 'sha1' | 'sha256' | 'sha512';

/**
 * TOTP Service for generating and validating Time-based One-Time Passwords
 * Supports multiple algorithms, digit lengths, and periods as per RFC 6238
 */
export class TOTPService {
  private static instance: TOTPService;

  private readonly defaultOptions = {
    period: 30,
    digits: 6 as const,
    step: 30,
    algorithm: HashAlgorithms.SHA1,
    window: 1,
  };

  private constructor() {
    // Configure default settings for otplib
    authenticator.options = {
      digits: this.defaultOptions.digits,
      step: this.defaultOptions.step,
      algorithm: this.defaultOptions.algorithm,
    };
  }

  /**
   * Get singleton instance of TOTPService
   */
  public static getInstance(): TOTPService {
    if (!TOTPService.instance) {
      TOTPService.instance = new TOTPService();
    }
    return TOTPService.instance;
  }

  /**
   * Generate TOTP code for a given secret
   */
  public generateTOTP(secret: string, options?: TOTPOptions): string {
    try {
      // Validate and clean the secret
      const cleanSecret = this.validateAndCleanSecret(secret);

      // Map algorithm to otplib format
      const algorithm = this.mapAlgorithm(options?.algorithm);

      // Configure TOTP options
      const totpOptions = {
        digits: options?.digits || 6,
        step: options?.period || 30,
        algorithm,
        window: options?.window || 1,
      };

      // Set options for this generation
      totp.options = totpOptions;

      // Generate the TOTP code
      const code = totp.generate(cleanSecret);

      return code;
    } catch (error) {
      console.error('TOTP generation failed:', error);
      throw new Error(
        `Failed to generate TOTP: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate a TOTP code against a secret
   */
  public validateTOTP(
    code: string,
    secret: string,
    options?: TOTPOptions & { window?: number }
  ): boolean {
    try {
      const cleanSecret = this.validateAndCleanSecret(secret);
      const algorithm = this.mapAlgorithm(options?.algorithm);

      const totpOptions = {
        digits: options?.digits || 6,
        step: options?.period || 30,
        algorithm,
        window: options?.window || 1,
      };

      totp.options = totpOptions;

      return totp.check(code, cleanSecret);
    } catch (error) {
      console.error('TOTP validation failed:', error);
      return false;
    }
  }

  /**
   * Validate and clean a Base32 secret
   */
  public validateSecret(secret: string): boolean {
    try {
      const cleaned = this.validateAndCleanSecret(secret);
      return cleaned.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Parse an OTPAuth URL into account details
   * Supports formats: otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
   */
  public parseOTPAuthURL(url: string): QRCodeResult {
    try {
      const urlObj = new URL(url);

      if (urlObj.protocol !== 'otpauth:') {
        throw new Error('Invalid OTPAuth URL protocol');
      }

      const type = urlObj.hostname.toLowerCase();
      if (type !== 'totp' && type !== 'hotp') {
        throw new Error(
          'Unsupported OTP type. Only TOTP and HOTP are supported'
        );
      }

      const params = urlObj.searchParams;
      const secret = params.get('secret');

      if (!secret) {
        throw new Error('Secret parameter is required');
      }

      if (!this.validateSecret(secret)) {
        throw new Error('Invalid secret format');
      }

      // Parse the label (path without leading slash)
      const pathLabel = decodeURIComponent(urlObj.pathname.substring(1));
      let issuer = params.get('issuer') || '';
      let accountName = pathLabel;

      // Handle issuer:account format in label
      if (pathLabel.includes(':') && !issuer) {
        const parts = pathLabel.split(':', 2);
        issuer = parts[0];
        accountName = parts[1];
      } else if (pathLabel.includes(':') && issuer) {
        // If issuer is in params and label has colon, use the part after colon
        const parts = pathLabel.split(':', 2);
        accountName = parts[1] || parts[0];
      }

      const result: QRCodeResult = {
        type: type as 'totp' | 'hotp',
        label: pathLabel,
        secret: secret,
        issuer: issuer || undefined,
        algorithm: params.get('algorithm')?.toUpperCase() || 'SHA1',
        digits: parseInt(params.get('digits') || '6', 10),
        period: parseInt(params.get('period') || '30', 10),
      };

      // Add counter for HOTP
      if (type === 'hotp') {
        const counter = params.get('counter');
        if (counter) {
          result.counter = parseInt(counter, 10);
        }
      }

      // Validate parsed values
      if (![6, 7, 8].includes(result.digits!)) {
        result.digits = 6;
      }

      if (!['SHA1', 'SHA256', 'SHA512'].includes(result.algorithm!)) {
        result.algorithm = 'SHA1';
      }

      if (result.period! < 1 || result.period! > 300) {
        result.period = 30;
      }

      return result;
    } catch (error) {
      console.error('OTPAuth URL parsing failed:', error);
      throw new Error(
        `Invalid OTPAuth URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the current time slot for TOTP
   */
  public getCurrentTimeSlot(period: number = 30): number {
    return Math.floor(Date.now() / 1000 / period);
  }

  /**
   * Get remaining time in current TOTP period
   */
  public getTimeRemaining(period: number = 30): number {
    const now = Math.floor(Date.now() / 1000);
    const currentSlot = Math.floor(now / period);
    const nextSlotStart = (currentSlot + 1) * period;
    return nextSlotStart - now;
  }

  /**
   * Generate TOTP codes for a given time range (useful for debugging)
   */
  public generateTOTPRange(
    secret: string,
    periods: number = 3,
    options?: TOTPOptions
  ): Array<{ code: string; timeSlot: number; validFrom: Date; validTo: Date }> {
    const results = [];
    const period = options?.period || 30;
    const currentTimeSlot = this.getCurrentTimeSlot(period);

    for (let i = -Math.floor(periods / 2); i <= Math.floor(periods / 2); i++) {
      const timeSlot = currentTimeSlot + i;
      const timestamp = timeSlot * period;

      // Temporarily set time for generation
      const originalNow = Date.now;
      Date.now = () => timestamp * 1000;

      try {
        const code = this.generateTOTP(secret, options);
        results.push({
          code,
          timeSlot,
          validFrom: new Date(timestamp * 1000),
          validTo: new Date((timestamp + period) * 1000),
        });
      } finally {
        Date.now = originalNow;
      }
    }

    return results;
  }

  /**
   * Generate a test secret for development/testing using expo-crypto
   */
  public generateTestSecret(): string {
    const randomBytes = Crypto.getRandomBytes(20); // 160 bits for secure TOTP secret
    return thirtyTwo.encode(randomBytes).toString().replace(/=/g, '');
  }

  /**
   * Create an OTPAuth URL from account details
   */
  public createOTPAuthURL(
    issuer: string,
    accountName: string,
    secret: string,
    options?: TOTPOptions
  ): string {
    const cleanSecret = this.validateAndCleanSecret(secret);
    const label = issuer ? `${issuer}:${accountName}` : accountName;

    const params = new URLSearchParams({
      secret: cleanSecret,
      issuer: issuer,
      algorithm: options?.algorithm || 'SHA1',
      digits: (options?.digits || 6).toString(),
      period: (options?.period || 30).toString(),
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  /**
   * Private method to validate and clean Base32 secrets
   */
  private validateAndCleanSecret(secret: string): string {
    if (!secret || typeof secret !== 'string') {
      throw new Error('Secret must be a non-empty string');
    }

    // Remove spaces and convert to uppercase
    const cleaned = secret.replace(/\s/g, '').toUpperCase();

    // Validate Base32 format
    if (!/^[A-Z2-7]+=*$/.test(cleaned)) {
      throw new Error('Secret must be valid Base32 encoded string');
    }

    // Remove padding if present and validate length
    const withoutPadding = cleaned.replace(/=+$/, '');
    if (withoutPadding.length < 8) {
      throw new Error(
        'Secret is too short (minimum 8 characters without padding)'
      );
    }

    return cleaned;
  }

  /**
   * Get time synchronization offset (for future NTP sync implementation)
   */
  public getTimeSyncOffset(): number {
    // For now, return 0. In a full implementation, this would
    // calculate offset from NTP servers for accurate time sync
    return 0;
  }

  /**
   * Check if current time is synchronized (for future implementation)
   */
  public isTimeSynchronized(): boolean {
    // For now, assume time is synchronized
    // In a full implementation, this would check against NTP servers
    return true;
  }

  /**
   * Map our algorithm enum to otplib's expected format
   */
  private mapAlgorithm(
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512'
  ): typeof HashAlgorithms[keyof typeof HashAlgorithms] {
    switch (algorithm) {
      case 'SHA1':
        return HashAlgorithms.SHA1;
      case 'SHA256':
        return HashAlgorithms.SHA256;
      case 'SHA512':
        return HashAlgorithms.SHA512;
      default:
        return HashAlgorithms.SHA1;
    }
  }
}

// Export singleton instance
export const totpService = TOTPService.getInstance();

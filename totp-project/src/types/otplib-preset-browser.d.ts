// Type declarations for @otplib/preset-browser
declare module '@otplib/preset-browser' {
  export interface TOTPOptions {
    algorithm?: string;
    digits?: number;
    period?: number;
    step?: number;
    window?: number;
  }

  export const HashAlgorithms: {
    SHA1: 'sha1';
    SHA256: 'sha256';
    SHA512: 'sha512';
  };

  export const totp: {
    generate: (secret: string, options?: TOTPOptions) => string;
    verify: (token: string, secret: string, options?: TOTPOptions) => boolean;
    check: (token: string, secret: string, options?: TOTPOptions) => boolean;
    timeRemaining: () => number;
    timeUsed: () => number;
    options: TOTPOptions;
  };

  export const authenticator: {
    generate: (secret: string) => string;
    verify: (token: string, secret: string) => boolean;
    check: (token: string, secret: string) => boolean;
    keyuri: (user: string, service: string, secret: string, options?: any) => string;
    options: TOTPOptions;
  };
}

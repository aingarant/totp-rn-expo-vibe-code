/**
 * Application constants
 */

// App configuration
export const APP_CONFIG = {
  name: 'TOTP Authenticator',
  version: '1.0.0',
  description: 'Secure TOTP authentication with cloud sync',
} as const;

// Performance targets
export const PERFORMANCE = {
  APP_LAUNCH_TARGET: 2000, // 2 seconds
  TOTP_GENERATION_TARGET: 100, // 100ms
  SYNC_LATENCY_TARGET: 3000, // 3 seconds
  MAX_ACCOUNTS: 100,
  MEMORY_TARGET: 50 * 1024 * 1024, // 50MB
} as const;

// TOTP configuration
export const TOTP_CONFIG = {
  DEFAULT_DIGITS: 6,
  DEFAULT_PERIOD: 30,
  DEFAULT_ALGORITHM: 'SHA1',
  SUPPORTED_ALGORITHMS: ['SHA1', 'SHA256', 'SHA512'],
  SUPPORTED_DIGITS: [6, 7, 8],
  MIN_PERIOD: 15,
  MAX_PERIOD: 300,
} as const;

// Security configuration
export const SECURITY = {
  AUTO_LOCK_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  CLIPBOARD_CLEAR_DELAY: 30 * 1000, // 30 seconds
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 8,
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  KEY_DERIVATION_ITERATIONS: 100000,
} as const;

// Network configuration
export const NETWORK = {
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  OFFLINE_RETRY_INTERVAL: 30000, // 30 seconds
} as const;

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  CACHED_ACCOUNTS: 'cached_accounts',
  ENCRYPTION_KEY: 'encryption_key',
  APP_STATE: 'app_state',
  LAST_SYNC: 'last_sync',
  OFFLINE_QUEUE: 'offline_queue',
} as const;

// Keychain service identifiers
export const KEYCHAIN = {
  SERVICE_NAME: 'com.totp.authenticator',
  ENCRYPTION_KEY: 'encryption_key',
  BIOMETRIC_KEY: 'biometric_key',
  PIN_KEY: 'pin_key',
} as const;

// API endpoints (Firebase configuration will override these)
export const API = {
  AUTH_TIMEOUT: 30000,
  FIRESTORE_TIMEOUT: 10000,
  MAX_BATCH_SIZE: 500,
} as const;

// UI configuration
export const UI = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  SEARCH_MIN_LENGTH: 2,
  REFRESH_INDICATOR_DURATION: 1000,
  TOAST_DURATION: 3000,
} as const;

// Validation patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  BASE32: /^[A-Z2-7]+=*$/,
  OTPAUTH_URL: /^otpauth:\/\/(totp|hotp)\/(.+)\?(.+)$/,
} as const;

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'auth/invalid-credentials',
  USER_NOT_FOUND: 'auth/user-not-found',
  WEAK_PASSWORD: 'auth/weak-password',
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  
  // TOTP errors
  INVALID_SECRET: 'totp/invalid-secret',
  INVALID_ALGORITHM: 'totp/invalid-algorithm',
  INVALID_DIGITS: 'totp/invalid-digits',
  INVALID_PERIOD: 'totp/invalid-period',
  
  // Storage errors
  STORAGE_ERROR: 'storage/error',
  ENCRYPTION_ERROR: 'storage/encryption-error',
  KEYCHAIN_ERROR: 'storage/keychain-error',
  
  // Network errors
  CONNECTION_ERROR: 'network/connection-error',
  TIMEOUT_ERROR: 'network/timeout-error',
  SERVER_ERROR: 'network/server-error',
  
  // App errors
  PERMISSION_DENIED: 'app/permission-denied',
  CAMERA_ERROR: 'app/camera-error',
  QR_CODE_ERROR: 'app/qr-code-error',
} as const;

// Theme configuration
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Development configuration
export const DEV_CONFIG = {
  ENABLE_LOGGING: __DEV__,
  ENABLE_REDUX_DEVTOOLS: __DEV__,
  MOCK_NETWORK_DELAY: __DEV__ ? 1000 : 0,
} as const;

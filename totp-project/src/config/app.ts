import Constants from 'expo-constants';

interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  app: {
    environment: 'development' | 'staging' | 'production';
    version: string;
    enableLogging: boolean;
    mockData: boolean;
  };
  security: {
    sessionTimeout: number;
    autoLockEnabled: boolean;
    biometricEnabled: boolean;
  };
}

// Helper function to get environment variable with validation
function getEnvVar(key: string, defaultValue?: string): string {
  const value =
    Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

// Helper function to get boolean environment variable
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
}

// Helper function to get number environment variable
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Validate Firebase configuration
function validateFirebaseConfig(): void {
  const required = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing = required.filter(key => !getEnvVar(key, undefined));

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration. Please check your .env file for: ${missing.join(', ')}\n\n` +
        'Run the setup script: npm run setup:firebase\n' +
        'Or see FIREBASE_SETUP.md for manual setup instructions.'
    );
  }
}

// Get app configuration
export function getAppConfig(): AppConfig {
  // Validate Firebase config first
  validateFirebaseConfig();

  return {
    firebase: {
      apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
      authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
      measurementId: getEnvVar(
        'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
        undefined
      ),
    },
    app: {
      environment: getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as any,
      version: getEnvVar('EXPO_PUBLIC_VERSION', '1.0.0'),
      enableLogging: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_LOGGING', true),
      mockData: getBooleanEnvVar('EXPO_PUBLIC_MOCK_DATA', false),
    },
    security: {
      sessionTimeout: getNumberEnvVar(
        'EXPO_PUBLIC_SESSION_TIMEOUT',
        15 * 60 * 1000
      ), // 15 minutes
      autoLockEnabled: getBooleanEnvVar('EXPO_PUBLIC_AUTO_LOCK_ENABLED', true),
      biometricEnabled: getBooleanEnvVar('EXPO_PUBLIC_BIOMETRIC_ENABLED', true),
    },
  };
}

// Export individual configs for convenience
export const config = getAppConfig();
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isStaging = config.app.environment === 'staging';

// Debug helper - only log in development
export function debugLog(...args: any[]): void {
  if (config.app.enableLogging && isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
}

// Error reporting helper
export function reportError(error: Error, context?: string): void {
  if (isProduction) {
    // In production, send to crash reporting service
    // Example: Crashlytics.recordError(error);
    console.error('Production Error:', { error: error.message, context });
  } else {
    // In development, log to console
    console.error('Development Error:', { error, context });
  }
}

// Performance timing helper
export function performanceTimer(label: string) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      debugLog(`Performance [${label}]: ${duration}ms`);
      return duration;
    },
  };
}

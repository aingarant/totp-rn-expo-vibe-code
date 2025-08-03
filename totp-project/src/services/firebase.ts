import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, debugLog, reportError, isDevelopment } from '@/config/app';

// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | undefined;

try {
  debugLog('Initializing Firebase with config:', {
    projectId: config.firebase.projectId,
    authDomain: config.firebase.authDomain,
    environment: config.app.environment,
  });

  if (getApps().length === 0) {
    app = initializeApp(config.firebase);
    debugLog('Firebase app initialized successfully');
  } else {
    app = getApps()[0];
    debugLog('Using existing Firebase app instance');
  }

  // Initialize Analytics (web only)
  if (typeof window !== 'undefined' && config.firebase.measurementId) {
    isSupported()
      .then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
          debugLog('Firebase Analytics initialized');
        }
      })
      .catch(error => {
        debugLog('Analytics not supported:', error);
      });
  }
} catch (error) {
  reportError(error as Error, 'Firebase initialization');
  throw new Error(
    'Failed to initialize Firebase. Please check your configuration.'
  );
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let auth: Auth;

try {
  debugLog('Initializing Firebase Auth with AsyncStorage persistence');

  // Initialize auth with AsyncStorage persistence for React Native
  // This is the recommended approach per Firebase documentation
  auth = initializeAuth(app, {
    persistence: AsyncStorage as any,
  });

  debugLog('Firebase Auth initialized successfully');
} catch (error) {
  // If auth is already initialized, get the existing instance
  debugLog('Auth already initialized, using existing instance');
  auth = getAuth(app);
}

// Initialize Firestore
let db: Firestore;
try {
  db = getFirestore(app);

  // Connect to Firestore emulator in development if configured
  if (
    isDevelopment &&
    process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
  ) {
    const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
    const port = parseInt(
      process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_PORT || '8080',
      10
    );

    try {
      connectFirestoreEmulator(db, host, port);
      debugLog(`Connected to Firestore emulator at ${host}:${port}`);
    } catch (emulatorError) {
      debugLog(
        'Failed to connect to Firestore emulator, using production:',
        emulatorError
      );
    }
  }

  debugLog('Firestore initialized successfully');
} catch (error) {
  reportError(error as Error, 'Firestore initialization');
  throw new Error('Failed to initialize Firestore');
}

// Export instances
export { auth, db, analytics };
export default app;

// Firestore collections
export const COLLECTIONS = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
} as const;

// Security rules helper (for reference)
export const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // TOTP accounts subcollection
      match /accounts/{accountId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
`;

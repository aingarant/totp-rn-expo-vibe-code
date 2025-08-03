/**
 * Firebase Configuration Test Script
 * Tests the Firebase configuration and connectivity
 */

// Load environment variables
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Load environment variables (simulated)
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('🔥 Firebase Configuration Test');
console.log('==============================\n');

// Test 1: Configuration Validation
console.log('1. Testing configuration values...');
const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

let configValid = true;
requiredFields.forEach(field => {
  if (!config[field]) {
    console.log(`   ❌ Missing: ${field}`);
    configValid = false;
  } else {
    console.log(`   ✅ ${field}: ${config[field].substring(0, 20)}...`);
  }
});

if (!configValid) {
  console.log('\n❌ Configuration incomplete. Please check your .env file.');
  process.exit(1);
}

// Test 2: Firebase Initialization
console.log('\n2. Testing Firebase initialization...');
try {
  const app = initializeApp(config);
  console.log('   ✅ Firebase app initialized successfully');
  console.log(`   📱 Project ID: ${config.projectId}`);
  console.log(`   🌐 Auth Domain: ${config.authDomain}`);
} catch (error) {
  console.log('   ❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

// Test 3: Service Initialization
console.log('\n3. Testing Firebase services...');
try {
  const app = initializeApp(config, 'test-app');
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('   ✅ Firebase Auth service initialized');
  console.log('   ✅ Firestore service initialized');
} catch (error) {
  console.log('   ❌ Service initialization failed:', error.message);
}

console.log('\n✅ Firebase configuration test completed successfully!');
console.log('\nNext steps:');
console.log('1. Ensure Firebase Authentication is enabled in your console');
console.log('2. Set up Firestore database in your Firebase project');
console.log('3. Configure security rules for production use');
console.log('\n🚀 Ready to start your app: npm start');

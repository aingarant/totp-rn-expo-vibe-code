import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: '', password: '' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  setGenericPassword: jest.fn(() => Promise.resolve()),
  getGenericPassword: jest.fn(() => Promise.resolve({ username: '', password: '' })),
  resetGenericPassword: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-camera', () => ({
  Camera: {
    useCameraPermissions: jest.fn(() => [null, jest.fn()]),
  },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    usePermissions: jest.fn(() => [null, jest.fn()]),
    scanFromURLAsync: jest.fn(),
  },
}));

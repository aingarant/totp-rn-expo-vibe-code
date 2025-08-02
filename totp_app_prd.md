# TOTP Authenticator App - Product Requirements Document & Technical Documentation

## Table of Contents

1. [Product Requirements Document](#product-requirements-document)
2. [Technical Documentation](#technical-documentation)
3. [AI IDE Implementation Prompts](#ai-ide-implementation-prompts)

---

# Product Requirements Document

## 1. Executive Summary

### Product Vision

A simple, secure, cross-platform TOTP (Time-based One-Time Password) authenticator app for personal use, enabling users to manage and sync their two-factor authentication codes across multiple devices.

### Problem Statement

- Need a reliable, personal TOTP authenticator that syncs across devices
- Existing solutions often lack cross-platform sync or are overly complex
- Desire for a simple, MVP solution that can be extended over time

### Success Metrics

- Successfully generate accurate TOTP codes for all major services
- Seamless sync between iOS and Android devices
- Zero data loss during device transitions
- Sub-2-second app launch time

## 2. Product Overview

### Target Users

- **Primary**: Individual user managing personal accounts
- **Secondary**: Tech-savvy users who want control over their authentication data

### Platform Strategy

- **Phase 1**: iOS and Android mobile apps
- **Phase 2**: macOS, Windows, Linux desktop support
- **Future**: Web interface for emergency access

### Core Value Proposition

Simple, secure, synced TOTP authentication across all your devices with full data ownership.

## 3. Feature Requirements

### 3.1 MVP Features (Phase 1)

#### Authentication & Security

- **User Registration/Login**
  - Email/password authentication
  - Secure session management
  - Password reset functionality
- **App Security**
  - App lock with PIN/biometric
  - Automatic logout after inactivity
  - Secure clipboard operations

#### TOTP Management

- **Add Accounts**
  - QR code scanning (otpauth:// URLs)
  - Manual secret entry
  - Service name and account customization
- **View Codes**
  - Real-time 6-digit TOTP display
  - 30-second countdown timer
  - Copy to clipboard functionality
- **Account Management**
  - Edit account names/services
  - Delete accounts
  - Search/filter accounts

#### Data & Sync

- **Cloud Sync**
  - Real-time synchronization via Firebase
  - Offline functionality with local storage
  - Conflict resolution
- **Backup & Recovery**
  - Automatic cloud backup
  - Account recovery via authentication

### 3.2 Future Features (Phase 2+)

#### Enhanced Security

- Export/import encrypted backups
- Multi-device management dashboard
- Breach monitoring integration

#### User Experience

- Dark/light theme toggle
- Custom icons for services
- Account categories/folders
- Bulk operations

#### Platform Extensions

- Desktop applications
- Browser extension
- Apple Watch/Wear OS companions

## 4. User Stories

### Core User Journey

1. **Setup**: User downloads app, creates account, scans first QR code
2. **Daily Use**: User opens app, views codes, copies needed code
3. **Adding Accounts**: User scans QR codes or manually enters secrets
4. **Multi-Device**: User logs into same account on second device, sees synced accounts

### Detailed User Stories

#### Authentication

- As a user, I want to create an account so I can sync my data across devices
- As a user, I want to log in quickly so I can access my codes immediately
- As a user, I want app lock protection so my codes are secure if someone accesses my phone

#### TOTP Management

- As a user, I want to scan QR codes so I can quickly add new accounts
- As a user, I want to see live TOTP codes so I know they're current
- As a user, I want to copy codes easily so I can paste them into login forms
- As a user, I want to search my accounts so I can find codes quickly

#### Sync & Backup

- As a user, I want my codes to sync automatically so I don't lose them
- As a user, I want offline access so I can get codes without internet
- As a user, I want to recover my accounts if I lose my device

## 5. Non-Functional Requirements

### Performance

- App launch: < 2 seconds cold start
- TOTP generation: < 100ms
- Sync latency: < 3 seconds when online
- Offline mode: Full functionality without network

### Security

- End-to-end encryption for sensitive data
- Secure local storage using platform keychains
- No plaintext secret storage
- Regular security audits of dependencies

### Reliability

- 99.9% uptime for sync service
- Accurate time synchronization
- Graceful handling of network failures
- Data consistency across devices

### Usability

- Intuitive interface requiring no onboarding
- Accessibility compliance (WCAG 2.1 AA)
- Support for system dark/light modes
- Responsive design for various screen sizes

## 6. Technical Constraints

### Platform Requirements

- iOS 12+ / Android API 21+
- Network connectivity for sync (offline mode available)
- Camera access for QR scanning
- Secure storage capabilities

### External Dependencies

- Firebase (Auth, Firestore)
- Device camera and keychain access
- System time synchronization

### Compliance

- GDPR compliance for EU users
- Platform store requirements (App Store, Play Store)
- No collection of unnecessary personal data

---

# Technical Documentation

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Firebase       │    │   User Devices  │
│  (iOS/Android)  │◄──►│   Backend        │◄──►│   (Multiple)    │
│                 │    │                  │    │                 │
│ • React Native  │    │ • Authentication │    │ • Sync Clients  │
│ • Local Storage │    │ • Firestore DB   │    │ • Offline Cache │
│ • TOTP Engine   │    │ • Real-time Sync │    │ • Security Layer│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────┐
│                 Presentation Layer          │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Screens │ │Components│ │ Navigation  │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
├─────────────────────────────────────────────┤
│                Business Logic Layer         │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Context │ │ Hooks   │ │ Utils       │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
├─────────────────────────────────────────────┤
│                 Service Layer               │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ TOTP    │ │Firebase │ │ Storage     │   │
│  │ Service │ │ Service │ │ Service     │   │
│  └─────────┘ └─────────┘ └─────────────┘   │
├─────────────────────────────────────────────┤
│                  Data Layer                 │
│  ┌─────────────┐ ┌─────────────────────┐   │
│  │ Local Cache │ │ Firebase Firestore  │   │
│  │ (Encrypted) │ │ (Cloud Database)    │   │
│  └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────┘
```

## 2. Technology Stack

### Frontend

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context + Hooks
- **UI Components**: Native Base / React Native Elements
- **Storage**: AsyncStorage + React Native Keychain

### Backend & Services

- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Real-time Sync**: Firestore real-time listeners
- **File Storage**: Firebase Storage (for future features)

### Security & Crypto

- **TOTP Generation**: otplib
- **Encryption**: React Native Crypto
- **Secure Storage**: React Native Keychain
- **Base32 Operations**: thirty-two

### Development & Deployment

- **Build Tool**: Expo CLI
- **Testing**: Jest + React Native Testing Library
- **Code Quality**: ESLint + Prettier
- **CI/CD**: Expo EAS Build

## 3. Data Models

### User Document

```typescript
interface User {
  uid: string
  email: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
  preferences: {
    theme: "light" | "dark" | "system"
    autoLock: boolean
    autoLockTimeout: number // minutes
  }
}
```

### TOTP Account Document

```typescript
interface TOTPAccount {
  id: string
  userId: string
  serviceName: string
  accountName: string
  encryptedSecret: string // AES encrypted
  algorithm: "SHA1" | "SHA256" | "SHA512"
  digits: 6 | 7 | 8
  period: number // seconds, typically 30
  iconUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  lastUsed?: Timestamp
}
```

### Local Storage Schema

```typescript
interface LocalTOTPAccount {
  id: string
  serviceName: string
  accountName: string
  secret: string // Decrypted for local use
  algorithm: string
  digits: number
  period: number
  iconUrl?: string
  syncStatus: "synced" | "pending" | "error"
  lastModified: number
}
```

## 4. API Specifications

### Firebase Firestore Collections

#### Users Collection: `/users/{userId}`

```javascript
// Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /accounts/{accountId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

#### TOTP Accounts Subcollection: `/users/{userId}/accounts/{accountId}`

### Core Service Methods

#### TOTPService

```typescript
class TOTPService {
  generateTOTP(secret: string, options?: TOTPOptions): string
  validateSecret(secret: string): boolean
  parseOTPAuthURL(url: string): TOTPAccount
  getCurrentTimeSlot(): number
  getTimeRemaining(): number
}
```

#### FirebaseService

```typescript
class FirebaseService {
  // Authentication
  signUp(email: string, password: string): Promise<User>
  signIn(email: string, password: string): Promise<User>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>

  // TOTP Accounts
  createAccount(account: TOTPAccount): Promise<string>
  updateAccount(id: string, updates: Partial<TOTPAccount>): Promise<void>
  deleteAccount(id: string): Promise<void>
  subscribeToAccounts(callback: (accounts: TOTPAccount[]) => void): () => void
}
```

#### StorageService

```typescript
class StorageService {
  // Local Storage
  saveAccounts(accounts: LocalTOTPAccount[]): Promise<void>
  loadAccounts(): Promise<LocalTOTPAccount[]>
  clearAccounts(): Promise<void>

  // Secure Storage
  saveEncryptionKey(key: string): Promise<void>
  getEncryptionKey(): Promise<string>
  saveBiometricPreference(enabled: boolean): Promise<void>
}
```

## 5. Security Architecture

### Data Encryption Flow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   User      │    │   Device     │    │   Firebase      │
│   Input     │    │   Storage    │    │   Firestore     │
│             │    │              │    │                 │
│ TOTP Secret │───►│ AES Encrypt  │───►│ Encrypted Blob  │
│             │    │ Local Key    │    │                 │
│             │    │              │    │                 │
│ App Unlock  │───►│ Keychain     │    │ User Auth       │
│ PIN/Bio     │    │ Protection   │    │ Token           │
└─────────────┘    └──────────────┘    └─────────────────┘
```

### Security Measures

1. **At Rest**: AES-256 encryption for TOTP secrets
2. **In Transit**: HTTPS/TLS for all network communications
3. **Access Control**: Firebase Authentication + Firestore rules
4. **Local Security**: Keychain storage for sensitive data
5. **App Protection**: PIN/Biometric lock, auto-logout

### Threat Model

- **Device Compromise**: Protected by keychain and encryption
- **Network Interception**: Protected by TLS
- **Cloud Breach**: Encrypted data, minimal exposure
- **App Reverse Engineering**: Secrets not in app bundle

## 6. Performance Specifications

### Response Time Requirements

- App Launch: < 2 seconds (cold start)
- TOTP Generation: < 100ms
- Account Search: < 200ms
- Sync Operation: < 3 seconds
- QR Code Scan: < 1 second recognition

### Scalability Targets

- Support for 100+ TOTP accounts per user
- Efficient rendering with virtualized lists
- Minimal memory footprint (< 50MB baseline)
- Battery optimization for background sync

### Caching Strategy

- Local SQLite for account metadata
- In-memory cache for active TOTP codes
- Firestore offline persistence enabled
- Smart prefetching of frequently used accounts

## 7. Error Handling & Monitoring

### Error Categories

1. **Network Errors**: Offline mode, retry logic
2. **Authentication Errors**: Re-login prompts, token refresh
3. **TOTP Errors**: Invalid secrets, time sync issues
4. **Storage Errors**: Fallback mechanisms, data recovery
5. **Permission Errors**: Graceful degradation, user guidance

### Monitoring & Analytics

- Crash reporting (Sentry/Crashlytics)
- Performance monitoring (Firebase Performance)
- User flow analytics (minimal, privacy-focused)
- Error rate tracking and alerting

### Logging Strategy

```typescript
enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  userId?: string
  context?: Record<string, any>
}
```

## 8. Testing Strategy

### Testing Pyramid

```
┌─────────────────────┐
│    E2E Tests        │ ← Critical user flows
│  (Detox/Maestro)    │
├─────────────────────┤
│  Integration Tests  │ ← Service interactions
│    (Jest + RTL)     │
├─────────────────────┤
│    Unit Tests       │ ← Core business logic
│      (Jest)         │
└─────────────────────┘
```

### Test Coverage Requirements

- **Unit Tests**: 80%+ coverage for utils and services
- **Integration Tests**: All Firebase operations
- **E2E Tests**: Core user journeys (add account, sync, login)
- **Security Tests**: Encryption/decryption, secure storage

### Testing Environments

- **Development**: Local Firebase emulator
- **Staging**: Dedicated Firebase project
- **Production**: Live Firebase project with monitoring

---

# AI IDE Implementation Prompts

## Prompt 1: Project Initialization

```
Initialize a React Native Expo project for a TOTP authenticator app following the technical specifications:

Setup requirements:
- TypeScript configuration
- Expo SDK 49+
- React Navigation 6
- Firebase integration (Auth, Firestore)
- ESLint and Prettier with React Native configs
- Folder structure: src/{components, screens, services, utils, types, contexts}

Configure package.json with the following key dependencies:
- expo, react-native, typescript
- @react-navigation/native, @react-navigation/stack
- @react-native-firebase/app, @react-native-firebase/auth, @react-native-firebase/firestore
- @react-native-async-storage/async-storage
- react-native-keychain
- otplib, thirty-two
- expo-camera, expo-barcode-scanner

Create basic project structure and initial configuration files.
```

## Prompt 2: Authentication System

```
Implement the complete authentication system based on the technical documentation:

Required components:
1. AuthContext with TypeScript interfaces
2. AuthScreen with login/register toggle
3. Firebase Auth integration with error handling
4. Secure token management and auto-login
5. Password reset functionality

Follow the User interface from the data models:
- User document structure
- Preferences management
- Session handling with automatic logout

Include proper TypeScript types, loading states, and form validation.
Create reusable hooks for authentication state management.
```

## Prompt 3: TOTP Core Engine

```
Build the TOTP generation engine following the TOTPService specification:

Implementation requirements:
1. TOTPService class with all specified methods
2. Support for SHA1/SHA256/SHA512 algorithms
3. Configurable digits (6,7,8) and periods
4. OTPAuth URL parsing (otpauth://totp/...)
5. Real-time countdown timer with auto-refresh
6. Base32 secret validation and encoding

Use otplib library and implement proper error handling for:
- Invalid secrets
- Time synchronization issues
- Malformed OTPAuth URLs

Include comprehensive unit tests for TOTP generation accuracy.
```

## Prompt 4: Data Layer & Firebase Integration

```
Implement the complete data layer with Firebase integration:

Components needed:
1. FirebaseService class with all CRUD operations
2. StorageService for local encrypted storage
3. Real-time sync with conflict resolution
4. Offline mode with local fallback

Follow the data models:
- TOTPAccount interface
- LocalTOTPAccount for offline storage
- Firestore security rules implementation

Include:
- AES encryption for secrets before cloud storage
- React Native Keychain for secure local storage
- Firestore offline persistence
- Error handling and retry logic
```

## Prompt 5: Main UI Components

```
Create the main user interface following the component architecture:

Required screens and components:
1. HomeScreen: Account list with live TOTP codes
2. AddAccountScreen: QR scanner + manual entry
3. AccountItem: Individual TOTP display component
4. SettingsScreen: User preferences and account management

UI Requirements:
- Real-time TOTP updates with countdown
- Copy to clipboard functionality
- Pull-to-refresh for sync
- Search/filter capabilities
- Loading states and error boundaries
- Accessibility compliance

Use Native Base or React Native Elements for consistent styling.
Implement proper navigation and state management.
```

## Prompt 6: Security Implementation

```
Implement comprehensive security measures:

Security features required:
1. AES-256 encryption for TOTP secrets
2. React Native Keychain integration
3. App lock with PIN/biometric authentication
4. Secure clipboard operations with auto-clear
5. Session management with timeout

Follow the security architecture:
- Encryption key management
- Secure storage patterns
- Protection against screenshots
- Background app hiding

Include security utilities and proper key derivation.
Test encryption/decryption thoroughly with different secret formats.
```

## Prompt 7: QR Code Scanner & Account Management

```
Build QR code scanning and account management features:

QR Scanner requirements:
1. expo-barcode-scanner integration
2. Camera permission handling
3. OTPAuth URL parsing and validation
4. Error handling for invalid QR codes
5. Manual entry fallback

Account Management:
1. Add/edit/delete accounts
2. Account search and filtering
3. Bulk operations support
4. Import/export functionality (future)

Follow the TOTPAccount data model and include proper validation.
Implement smooth camera transitions and user feedback.
```

## Prompt 8: Sync & Offline Management

```
Implement synchronization and offline capabilities:

Sync features:
1. Real-time Firestore listeners
2. Offline queue for pending changes
3. Conflict resolution algorithm
4. Background sync optimization

Offline management:
1. Local SQLite storage setup
2. Cache invalidation strategy
3. Graceful offline mode
4. Sync status indicators

Include network connectivity detection and proper error recovery.
Implement exponential backoff for failed sync attempts.
Follow the caching strategy from performance specifications.
```

## Prompt 9: Testing & Quality Assurance

```
Set up comprehensive testing infrastructure:

Testing setup:
1. Jest configuration for React Native
2. React Native Testing Library setup
3. Firebase emulator for integration tests
4. E2E test framework (Detox or Maestro)
5. Security testing for encryption

Test coverage requirements:
- Unit tests for TOTP generation (accuracy critical)
- Integration tests for Firebase operations
- Component tests for UI interactions
- E2E tests for critical user flows

Include performance testing and monitoring setup.
Create mock services for offline testing scenarios.
```

## Prompt 10: Build & Deployment

```
Configure build and deployment pipeline:

Build configuration:
1. Expo EAS Build setup for iOS/Android
2. Environment-specific configurations
3. Code signing and provisioning profiles
4. Store deployment preparation

Deployment pipeline:
1. Development/staging/production environments
2. Automated testing in CI/CD
3. Security scanning and dependency audits
4. Performance monitoring integration

Include build optimization for app size and startup time.
Set up crash reporting and analytics (privacy-focused).
Create deployment scripts and documentation.
```

Each prompt builds upon the previous ones and can be used iteratively with your AI IDE to create a complete, production-ready TOTP authenticator app.

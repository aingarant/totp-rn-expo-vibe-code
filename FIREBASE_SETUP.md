# Firebase Setup Guide

This guide will help you set up Firebase for the TOTP Authenticator app.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `totp-authenticator` (or your preferred name)
4. Choose whether to enable Google Analytics (optional)
5. Wait for project creation to complete

### 2. Enable Authentication

1. In the Firebase console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Optional: Enable **Email link (passwordless sign-in)** for enhanced UX

### 3. Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select a location close to your users
5. Wait for database creation

### 4. Configure Security Rules

Replace the default Firestore rules with our secure rules:

```javascript
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
```

### 5. Get Configuration Values

1. Go to **Project settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** > **Web app** (</> icon)
4. Enter app nickname: `TOTP Authenticator`
5. Copy the configuration object

## 📱 App Configuration

### 1. Create Environment File

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

### 2. Add Firebase Configuration

Update `.env` with your Firebase config values:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_ENABLE_LOGGING=true
```

### 3. Test the Configuration

Run the app to test Firebase integration:

```bash
# Install Expo CLI globally if not already installed
npm install -g @expo/cli

# Start the development server
npm start

# Or run on specific platform
npm run ios
npm run android
npm run web
```

## 🔒 Authentication Persistence (AsyncStorage)

The app automatically configures Firebase Auth to persist authentication state using AsyncStorage. This means users will remain logged in between app sessions.

**Key Implementation Details:**

- Uses `initializeAuth` with AsyncStorage persistence for React Native
- Falls back gracefully if auth instance already exists
- Properly handles React Native-specific authentication requirements
- No additional configuration needed - works out of the box

**What this solves:**

- ✅ Authentication state persists between app sessions
- ✅ Users don't need to re-login every time they open the app
- ✅ Eliminates Firebase Auth warning about missing AsyncStorage
- ✅ Follows Firebase best practices for React Native apps

## 🧪 Testing Authentication

### Test Cases to Verify

1. **Sign Up**: Create a new account with email/password
2. **Sign In**: Login with existing credentials
3. **Password Reset**: Test forgot password flow
4. **Sign Out**: Logout and verify state clears
5. **Auto-login**: Close and reopen app, should stay logged in
6. **Error Handling**: Test with invalid credentials

### Expected Behavior

- ✅ New users can create accounts
- ✅ Users can sign in with valid credentials
- ✅ Invalid credentials show appropriate error messages
- ✅ Password reset emails are sent
- ✅ User data is saved to Firestore
- ✅ App remembers login state between sessions
- ✅ Sign out clears authentication state

## 🔒 Security Verification

### Firestore Rules Testing

Test that security rules work correctly:

1. Try accessing another user's data (should fail)
2. Try accessing data without authentication (should fail)
3. Verify authenticated users can only access their own data

### Authentication Security

- Users can only access their own data
- Passwords are handled securely by Firebase Auth
- Authentication tokens are managed automatically
- Session persistence works correctly

## 🚀 Next Steps

Once Firebase is configured and working:

1. **TOTP Core Engine**: Implement TOTP generation
2. **QR Code Scanner**: Add camera functionality for QR codes
3. **Account Management**: Create, edit, delete TOTP accounts
4. **Data Encryption**: Add local encryption for sensitive data
5. **Sync Management**: Implement real-time sync

## 🐛 Troubleshooting

### Common Issues

#### "Firebase not initialized"

- Check that `.env` file exists and has correct values
- Verify `EXPO_PUBLIC_` prefix on all environment variables
- Restart the development server after changing `.env`

#### "Permission denied" in Firestore

- Check Firestore security rules are correctly configured
- Verify user is authenticated before accessing Firestore
- Check that document paths match the security rules

#### Authentication errors

- Verify Email/Password is enabled in Firebase Auth
- Check network connection
- Look for specific error codes in the console

#### TypeScript errors

- Run `npx tsc --noEmit` to check for type errors
- Ensure all imports are correct
- Verify Firebase types are properly imported

---

## 📞 Support

If you encounter issues:

1. Check the [Firebase documentation](https://firebase.google.com/docs)
2. Review the console for error messages
3. Test with Firebase emulator for development
4. Check that all dependencies are correctly installed

**Status**: 📋 Ready for Firebase Configuration

# TOTP Authenticator App

A simple, secure, cross-platform TOTP (Time-based One-Time Password) authenticator app for personal use, enabling users to manage and sync their two-factor authentication codes across multiple devices.

## 🚀 Features

### MVP Features (Phase 1)

- ✅ User registration/login with Firebase Auth
- ✅ Email/password authentication with password reset
- ✅ App security with PIN/biometric lock
- ✅ QR code scanning for easy account setup
- ✅ Manual secret entry for accounts
- ✅ Real-time 6-digit TOTP code generation
- ✅ 30-second countdown timer
- ✅ Copy to clipboard functionality
- ✅ Account management (edit/delete)
- ✅ Search and filter accounts
- ✅ Real-time Firebase sync across devices
- ✅ Offline functionality with local storage
- ✅ Automatic cloud backup

### Coming Soon (Phase 2+)

- 🔄 Dark/light theme toggle
- 🔄 Custom icons for services
- 🔄 Account categories/folders
- 🔄 Export/import encrypted backups
- 🔄 Multi-device management dashboard
- 🔄 Desktop applications (macOS, Windows, Linux)

## 🛠 Technology Stack

### Frontend

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context + Hooks
- **UI Components**: Native Base / React Native Elements

### Backend & Services

- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Real-time Sync**: Firestore real-time listeners

### Security & Crypto

- **TOTP Generation**: otplib
- **Encryption**: React Native Crypto
- **Secure Storage**: React Native Keychain
- **Base32 Operations**: thirty-two

## 📱 Platform Support

- **Current**: iOS 12+ / Android API 21+
- **Planned**: macOS, Windows, Linux desktop support
- **Future**: Web interface for emergency access

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # Business logic and API calls
├── utils/              # Helper functions and utilities
├── types/              # TypeScript type definitions
├── contexts/           # React Context providers
└── hooks/              # Custom React hooks
```

## 🚦 Getting Started

### Prerequisites

- Node.js 16+
- Expo CLI
- iOS Simulator / Android Emulator
- Firebase project setup

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd totp
```

2. Install dependencies:

```bash
npm install
```

3. Configure Firebase:

   - Create a Firebase project
   - Enable Authentication and Firestore
   - Download and place configuration files
   - Update environment variables

4. Start the development server:

```bash
npx expo start
```

### Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npx expo build
```

## 🔒 Security

This app implements multiple layers of security:

- **End-to-end encryption** for TOTP secrets
- **AES-256 encryption** for cloud storage
- **React Native Keychain** for secure local storage
- **App lock** with PIN/biometric authentication
- **Automatic logout** after inactivity
- **Secure clipboard operations** with auto-clear

## 📊 Performance Targets

- **App Launch**: < 2 seconds (cold start)
- **TOTP Generation**: < 100ms
- **Sync Latency**: < 3 seconds when online
- **Offline Mode**: Full functionality without network

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Core business logic (80%+ coverage)
- **Integration Tests**: Firebase operations
- **E2E Tests**: Critical user flows
- **Security Tests**: Encryption/decryption

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📈 Monitoring & Analytics

- **Crash Reporting**: Sentry/Crashlytics
- **Performance Monitoring**: Firebase Performance
- **Error Tracking**: Real-time error alerts
- **Privacy-focused**: Minimal data collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [otplib](https://github.com/yeojz/otplib) for TOTP generation
- [React Native](https://reactnative.dev/) for cross-platform development
- [Expo](https://expo.dev/) for streamlined development
- [Firebase](https://firebase.google.com/) for backend services

## 📞 Support

For support, please open an issue or contact [your-email@example.com].

---

**Built with ❤️ for secure authentication**

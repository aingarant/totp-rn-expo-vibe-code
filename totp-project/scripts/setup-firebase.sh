#!/bin/bash

# Firebase Setup Helper Script
# This script helps you configure Firebase for the TOTP Authenticator app

echo "🔥 Firebase Configuration Setup"
echo "==============================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ $overwrite != "y" && $overwrite != "Y" ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

echo "Please follow these steps to get your Firebase configuration:"
echo ""
echo "1. Go to https://console.firebase.google.com/"
echo "2. Create a new project or select an existing one"
echo "3. Go to Project Settings (gear icon)"
echo "4. Scroll down to 'Your apps' section"
echo "5. Click 'Add app' and select the Web platform"
echo "6. Register your app and copy the configuration values"
echo ""

# Collect Firebase configuration
echo "Enter your Firebase configuration values:"
echo ""

read -p "Firebase API Key: " api_key
read -p "Auth Domain (project-id.firebaseapp.com): " auth_domain
read -p "Project ID: " project_id
read -p "Storage Bucket (project-id.appspot.com): " storage_bucket
read -p "Messaging Sender ID: " sender_id
read -p "App ID: " app_id

# Optional analytics
read -p "Measurement ID (optional, for Analytics): " measurement_id

echo ""
echo "Creating .env file..."

# Create .env file
cat > .env << EOL
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=${api_key}
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${auth_domain}
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${project_id}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${storage_bucket}
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${sender_id}
EXPO_PUBLIC_FIREBASE_APP_ID=${app_id}

# Optional: Analytics
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=${measurement_id}

# App Configuration
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_VERSION=1.0.0

# Development flags
EXPO_PUBLIC_ENABLE_LOGGING=true
EXPO_PUBLIC_MOCK_DATA=false

# Security Settings
EXPO_PUBLIC_SESSION_TIMEOUT=900000
EXPO_PUBLIC_AUTO_LOCK_ENABLED=true
EXPO_PUBLIC_BIOMETRIC_ENABLED=true
EOL

echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "1. Enable Authentication in Firebase Console:"
echo "   - Go to Authentication > Sign-in method"
echo "   - Enable Email/Password authentication"
echo ""
echo "2. Set up Firestore Database:"
echo "   - Go to Firestore Database"
echo "   - Create database in test mode"
echo "   - Update security rules (see FIREBASE_SETUP.md)"
echo ""
echo "3. Test your configuration:"
echo "   npm start"
echo ""
echo "🔒 Security reminder: Never commit .env file to git!"

# Add .env to .gitignore if not already there
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi

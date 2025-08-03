const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove crypto polyfills since we're using expo-crypto
// Keep basic resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Transform additional node_modules for React Native
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { APP_CONFIG } from '@/utils/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_CONFIG.name}</Text>
      <Text style={styles.subtitle}>Version {APP_CONFIG.version}</Text>
      <Text style={styles.description}>{APP_CONFIG.description}</Text>
      <Text style={styles.status}>🚀 Project Setup Complete!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  status: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

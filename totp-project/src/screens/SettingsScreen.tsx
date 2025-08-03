import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { StorageService } from '@/services/StorageService';
import { FirebaseService } from '@/services/FirebaseService';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  autoLock: boolean;
  autoLockTimeout: number;
  biometricEnabled: boolean;
  syncEnabled: boolean;
  backgroundRefresh: boolean;
}

const SettingsScreen: React.FC = () => {
  const { user, logOut } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    autoLock: false,
    autoLockTimeout: 5,
    biometricEnabled: false,
    syncEnabled: true,
    backgroundRefresh: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const storageService = StorageService.getInstance();
  const firebaseService = FirebaseService.getInstance();

  useEffect(() => {
    loadPreferences();
    loadSyncStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await storageService.loadUserPreferences();
      if (savedPreferences) {
        setPreferences(savedPreferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadSyncStatus = async () => {
    if (user) {
      try {
        const result = await firebaseService.getSyncStatus(user.uid);
        if (result.success) {
          setSyncStatus(result.data);
        }
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await storageService.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const handleTogglePreference = (key: keyof UserPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    savePreferences(newPreferences);
  };

  const handleThemeChange = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(preferences.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];

    const newPreferences = { ...preferences, theme: newTheme };
    savePreferences(newPreferences);
  };

  const handleAutoLockTimeout = () => {
    const timeouts = [1, 5, 10, 30];
    const currentIndex = timeouts.indexOf(preferences.autoLockTimeout);
    const nextIndex = (currentIndex + 1) % timeouts.length;
    const newTimeout = timeouts[nextIndex];

    const newPreferences = { ...preferences, autoLockTimeout: newTimeout };
    savePreferences(newPreferences);
  };

  const handleSync = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await firebaseService.syncAccounts(user.uid);
      if (result.success) {
        Alert.alert('Sync Complete', 'Your accounts have been synchronized successfully.');
        await loadSyncStatus();
      } else {
        Alert.alert('Sync Failed', result.message || 'Failed to sync accounts');
      }
    } catch (error) {
      Alert.alert('Sync Error', 'An error occurred while syncing accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const accounts = await storageService.loadAccounts();
      const exportData = {
        accounts: accounts.map(acc => ({
          serviceName: acc.serviceName,
          accountName: acc.accountName,
          secret: acc.secret,
          algorithm: acc.algorithm,
          digits: acc.digits,
          period: acc.period,
        })),
        exportedAt: new Date().toISOString(),
      };

      // For now, just show the data - in production, you'd implement file sharing
      Alert.alert(
        'Export Data',
        `Found ${accounts.length} accounts. In production, this would export to a secure file.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data');
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await storageService.clearAllData();
      firebaseService.unsubscribeAll();
      Alert.alert('Data Deleted', 'All local data has been deleted. You will be signed out.', [
        { text: 'OK', onPress: () => logOut() }
      ]);
    } catch (error) {
      Alert.alert('Delete Error', 'Failed to delete data');
    }
  };

  const formatSyncTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Email</Text>
              <Text style={styles.itemValue}>{user?.email}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.item} onPress={handleSync} disabled={isLoading}>
              <Text style={styles.itemLabel}>Sync Now</Text>
              <Text style={styles.itemValue}>{isLoading ? 'Syncing...' : 'Tap to sync'}</Text>
            </TouchableOpacity>
            {syncStatus && (
              <>
                <View style={styles.divider} />
                <View style={styles.item}>
                  <Text style={styles.itemLabel}>Last Sync</Text>
                  <Text style={styles.itemValue}>{formatSyncTime(syncStatus.lastSync)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.item}>
                  <Text style={styles.itemLabel}>Accounts</Text>
                  <Text style={styles.itemValue}>
                    {syncStatus.totalAccounts} local, {syncStatus.cloudAccounts} cloud
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.item} onPress={handleThemeChange}>
              <Text style={styles.itemLabel}>Theme</Text>
              <Text style={styles.itemValue}>{preferences.theme}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.card}>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Auto Lock</Text>
              <Switch
                value={preferences.autoLock}
                onValueChange={(value) => handleTogglePreference('autoLock', value)}
                trackColor={{ false: '#e0e0e0', true: '#3742fa' }}
                thumbColor={preferences.autoLock ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            {preferences.autoLock && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.item} onPress={handleAutoLockTimeout}>
                  <Text style={styles.itemLabel}>Auto Lock Timeout</Text>
                  <Text style={styles.itemValue}>{preferences.autoLockTimeout} min</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Biometric Authentication</Text>
              <Switch
                value={preferences.biometricEnabled}
                onValueChange={(value) => handleTogglePreference('biometricEnabled', value)}
                trackColor={{ false: '#e0e0e0', true: '#3742fa' }}
                thumbColor={preferences.biometricEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronization</Text>
          <View style={styles.card}>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Cloud Sync</Text>
              <Switch
                value={preferences.syncEnabled}
                onValueChange={(value) => handleTogglePreference('syncEnabled', value)}
                trackColor={{ false: '#e0e0e0', true: '#3742fa' }}
                thumbColor={preferences.syncEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Background Refresh</Text>
              <Switch
                value={preferences.backgroundRefresh}
                onValueChange={(value) => handleTogglePreference('backgroundRefresh', value)}
                trackColor={{ false: '#e0e0e0', true: '#3742fa' }}
                thumbColor={preferences.backgroundRefresh ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.item} onPress={handleExportData}>
              <Text style={styles.itemLabel}>Export Data</Text>
              <Text style={styles.itemValue}>Backup accounts</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.item}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Text style={[styles.itemLabel, styles.dangerText]}>Delete All Data</Text>
              <Text style={styles.itemValue}>Cannot be undone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={() => logOut()}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete All Data?</Text>
            <Text style={styles.modalText}>
              This will permanently delete all your TOTP accounts and settings.
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteAllData();
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 48,
  },
  itemLabel: {
    fontSize: 16,
    color: '#2c2c2c',
    flex: 1,
  },
  itemValue: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 16,
  },
  dangerText: {
    color: '#ff4757',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 16,
  },
  signOutButton: {
    backgroundColor: '#ff4757',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    backgroundColor: '#ff4757',
  },
  cancelButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;

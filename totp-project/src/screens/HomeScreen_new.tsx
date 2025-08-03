import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { TOTPItem } from '@/components/TOTPItem';
import { AddAccountForm } from '@/components/AddAccountForm';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { LocalTOTPAccount, QRCodeResult } from '@/types';
import { TOTPService } from '@/services/TOTPService';

const HomeScreen: React.FC = () => {
  const { user, logOut } = useAuth();
  const [accounts, setAccounts] = useState<LocalTOTPAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LocalTOTPAccount | null>(null);

  const totpService = TOTPService.getInstance();

  // Sample data for demonstration - In production, this would come from storage/Firebase
  useEffect(() => {
    loadSampleAccounts();
  }, []);

  const loadSampleAccounts = () => {
    const sampleAccounts: LocalTOTPAccount[] = [
      {
        id: '1',
        serviceName: 'Google',
        accountName: 'user@gmail.com',
        secret: 'JBSWY3DPEHPK3PXP', // This is a test secret
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        syncStatus: 'synced',
        lastModified: Date.now(),
      },
      {
        id: '2',
        serviceName: 'GitHub',
        accountName: 'developer',
        secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ', // This is a test secret
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        syncStatus: 'synced',
        lastModified: Date.now(),
      },
    ];
    setAccounts(sampleAccounts);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await logOut();
            if (!result.success) {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const handleAddAccount = (accountData: Omit<LocalTOTPAccount, 'id' | 'lastModified' | 'syncStatus'>) => {
    const newAccount: LocalTOTPAccount = {
      ...accountData,
      id: Date.now().toString(),
      lastModified: Date.now(),
      syncStatus: 'pending',
    };

    setAccounts(prev => [...prev, newAccount]);
    setShowAddForm(false);
    Alert.alert('Success', 'Account added successfully!');
  };

  const handleEditAccount = (accountData: Omit<LocalTOTPAccount, 'id' | 'lastModified' | 'syncStatus'>) => {
    if (editingAccount) {
      const updatedAccount: LocalTOTPAccount = {
        ...accountData,
        id: editingAccount.id,
        lastModified: Date.now(),
        syncStatus: 'pending',
      };

      setAccounts(prev =>
        prev.map(account => account.id === editingAccount.id ? updatedAccount : account)
      );
      setEditingAccount(null);
      Alert.alert('Success', 'Account updated successfully!');
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAccounts(prev => prev.filter(account => account.id !== accountId));
            Alert.alert('Success', 'Account deleted successfully!');
          },
        },
      ]
    );
  };

  const handleQRScanSuccess = (result: QRCodeResult) => {
    setShowQRScanner(false);

    const accountData: Omit<LocalTOTPAccount, 'id' | 'lastModified' | 'syncStatus'> = {
      serviceName: result.label.split(':')[0] || 'Unknown Service',
      accountName: result.label.split(':')[1] || result.label,
      secret: result.secret,
      algorithm: result.algorithm || 'SHA1',
      digits: result.digits || 6,
      period: result.period || 30,
    };

    handleAddAccount(accountData);
  };

  const filteredAccounts = accounts.filter(account =>
    account.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.accountName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAccountItem = ({ item }: { item: LocalTOTPAccount }) => (
    <TOTPItem
      account={item}
      onPress={() => {
        // Handle account selection if needed
      }}
      onLongPress={() => {
        Alert.alert(
          'Account Options',
          `What would you like to do with ${item.serviceName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => setEditingAccount(item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAccount(item.id) },
          ]
        );
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Authenticator</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {accounts.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search accounts..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <View style={styles.content}>
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Accounts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first authenticator account to get started
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addButtonText}>Add Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, styles.scanButton]}
              onPress={() => setShowQRScanner(true)}
            >
              <Text style={styles.addButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredAccounts}
              renderItem={renderAccountItem}
              keyExtractor={item => item.id}
              style={styles.accountsList}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.fab}>
              <TouchableOpacity
                style={styles.fabButton}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.fabText}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Add Account Modal */}
      <Modal
        visible={showAddForm || editingAccount !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AddAccountForm
          onSave={editingAccount ? handleEditAccount : handleAddAccount}
          onCancel={() => {
            setShowAddForm(false);
            setEditingAccount(null);
          }}
          initialData={editingAccount || undefined}
        />
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRCodeScanner
          onScanSuccess={handleQRScanSuccess}
          onCancel={() => setShowQRScanner(false)}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#2c2c2c',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: '#3742fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#2ed573',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountsList: {
    flex: 1,
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3742fa',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomeScreen;

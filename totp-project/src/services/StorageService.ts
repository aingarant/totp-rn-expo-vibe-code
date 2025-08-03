import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'react-native-crypto-js';
import { LocalTOTPAccount } from '@/types';

const STORAGE_KEYS = {
  ACCOUNTS: '@totp_accounts',
  ENCRYPTION_KEY: 'totp_encryption_key',
  USER_PREFERENCES: '@user_preferences',
} as const;

/**
 * Secure Storage Service for TOTP accounts and sensitive data
 * Uses react-native-keychain for encryption keys and AsyncStorage for encrypted data
 */
export class StorageService {
  private static instance: StorageService;
  private encryptionKey: string | null = null;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage service and get/create encryption key
   */
  public async initialize(): Promise<void> {
    try {
      await this.getOrCreateEncryptionKey();
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw new Error('Storage service initialization failed');
    }
  }

  /**
   * Get or create encryption key stored in secure keychain
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to retrieve existing key
      const credentials = await Keychain.getInternetCredentials(
        STORAGE_KEYS.ENCRYPTION_KEY
      );

      if (credentials && credentials.password) {
        this.encryptionKey = credentials.password;
        return this.encryptionKey;
      }
    } catch (error) {
      console.log('No existing encryption key found, creating new one');
    }

    // Create new encryption key
    const newKey = this.generateEncryptionKey();
    await this.saveEncryptionKey(newKey);
    this.encryptionKey = newKey;
    return newKey;
  }

  /**
   * Generate a new encryption key
   */
  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Save encryption key to secure storage
   */
  private async saveEncryptionKey(key: string): Promise<void> {
    await Keychain.setInternetCredentials(
      STORAGE_KEYS.ENCRYPTION_KEY,
      'encryption_key',
      key
    );
  }

  /**
   * Encrypt data using AES
   */
  private encrypt(data: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt data using AES
   */
  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Save TOTP accounts to encrypted storage
   */
  public async saveAccounts(accounts: LocalTOTPAccount[]): Promise<void> {
    try {
      await this.initialize();

      // Encrypt secrets in accounts before storage
      const encryptedAccounts = accounts.map(account => ({
        ...account,
        secret: this.encrypt(account.secret),
      }));

      const encryptedData = this.encrypt(JSON.stringify(encryptedAccounts));
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, encryptedData);
    } catch (error) {
      console.error('Failed to save accounts:', error);
      throw new Error('Failed to save accounts to storage');
    }
  }

  /**
   * Load TOTP accounts from encrypted storage
   */
  public async loadAccounts(): Promise<LocalTOTPAccount[]> {
    try {
      await this.initialize();

      const encryptedData = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!encryptedData) {
        return [];
      }

      const decryptedData = this.decrypt(encryptedData);
      const encryptedAccounts = JSON.parse(decryptedData);

      // Decrypt secrets in accounts after loading
      const accounts: LocalTOTPAccount[] = encryptedAccounts.map(
        (account: any) => ({
          ...account,
          secret: this.decrypt(account.secret),
        })
      );

      return accounts;
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return [];
    }
  }

  /**
   * Clear all stored accounts
   */
  public async clearAccounts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    } catch (error) {
      console.error('Failed to clear accounts:', error);
      throw new Error('Failed to clear accounts from storage');
    }
  }

  /**
   * Save user preferences
   */
  public async saveUserPreferences(preferences: any): Promise<void> {
    try {
      const data = JSON.stringify(preferences);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, data);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  /**
   * Load user preferences
   */
  public async loadUserPreferences(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return null;
    }
  }

  /**
   * Save biometric preference
   */
  public async saveBiometricPreference(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('@biometric_enabled', enabled.toString());
    } catch (error) {
      console.error('Failed to save biometric preference:', error);
    }
  }

  /**
   * Get biometric preference
   */
  public async getBiometricPreference(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem('@biometric_enabled');
      return value === 'true';
    } catch (error) {
      console.error('Failed to get biometric preference:', error);
      return false;
    }
  }

  /**
   * Clear all data (for logout/reset)
   */
  public async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCOUNTS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.removeItem('@biometric_enabled'),
      ]);

      // Clear keychain separately
      try {
        await Keychain.resetInternetCredentials(STORAGE_KEYS.ENCRYPTION_KEY);
      } catch (keychainError) {
        // The resetInternetCredentials might have different signature, try alternative
        try {
          await Keychain.setInternetCredentials(
            STORAGE_KEYS.ENCRYPTION_KEY,
            '',
            ''
          );
        } catch (altError) {
          console.log(
            'Keychain reset failed with both methods:',
            keychainError,
            altError
          );
        }
      }

      this.encryptionKey = null;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear all data');
    }
  }

  /**
   * Check if storage is properly initialized
   */
  public async isInitialized(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        STORAGE_KEYS.ENCRYPTION_KEY
      );
      return credentials !== false;
    } catch (error) {
      return false;
    }
  }
}

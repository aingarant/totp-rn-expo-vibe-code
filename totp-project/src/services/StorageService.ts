import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import * as Crypto from 'expo-crypto';
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
    const newKey = await this.generateEncryptionKey();
    await this.saveEncryptionKey(newKey);
    this.encryptionKey = newKey;
    return newKey;
  }

  /**
   * Generate a new encryption key using expo-crypto
   */
  private async generateEncryptionKey(): Promise<string> {
    const randomBytes = Crypto.getRandomBytes(32); // 256 bits
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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
   * Encrypt data using a simple XOR cipher with expo-crypto generated key
   * Note: This is a simplified approach for React Native compatibility
   */
  public async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      
      // Convert hex key to bytes
      const keyBytes = new Uint8Array(
        this.encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Generate a random IV
      const iv = Crypto.getRandomBytes(16);
      
      // Simple XOR encryption with key stretching
      const encrypted = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        const keyIndex = i % keyBytes.length;
        const ivIndex = i % iv.length;
        encrypted[i] = dataBytes[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
      }

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.length);
      combined.set(iv);
      combined.set(encrypted, iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      throw new Error('Failed to encrypt data: ' + (error as Error).message);
    }
  }

  /**
   * Decrypt data using the same XOR cipher
   */
  public async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 16);
      const encrypted = combined.slice(16);

      // Convert hex key to bytes
      const keyBytes = new Uint8Array(
        this.encryptionKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Decrypt using XOR
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        const keyIndex = i % keyBytes.length;
        const ivIndex = i % iv.length;
        decrypted[i] = encrypted[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
      }

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data: ' + (error as Error).message);
    }
  }

  /**
   * Save TOTP accounts to encrypted storage
   */
  public async saveAccounts(accounts: LocalTOTPAccount[]): Promise<void> {
    try {
      await this.initialize();

      // Encrypt secrets in accounts before storage
      const encryptedAccounts = await Promise.all(
        accounts.map(async account => ({
          ...account,
          secret: await this.encrypt(account.secret),
        }))
      );

      const encryptedData = await this.encrypt(JSON.stringify(encryptedAccounts));
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

      const decryptedData = await this.decrypt(encryptedData);
      const encryptedAccounts = JSON.parse(decryptedData);

      // Decrypt secrets in accounts after loading
      const accounts: LocalTOTPAccount[] = await Promise.all(
        encryptedAccounts.map(async (account: any) => ({
          ...account,
          secret: await this.decrypt(account.secret),
        }))
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
        // Delete the encryption key from keychain - use resetGenericPassword instead
        await Keychain.resetGenericPassword({ service: STORAGE_KEYS.ENCRYPTION_KEY });
      } catch (keychainError) {
        // If reset fails, try resetGenericPassword without service
        try {
          await Keychain.resetGenericPassword();
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
   * Get last sync timestamp
   */
  public async getLastSyncTime(): Promise<number> {
    try {
      const timestamp = await AsyncStorage.getItem('@last_sync_time');
      return timestamp ? parseInt(timestamp) : 0;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return 0;
    }
  }

  /**
   * Set last sync timestamp
   */
  public async setLastSyncTime(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem('@last_sync_time', timestamp.toString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
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

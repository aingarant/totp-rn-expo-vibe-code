import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { TOTPAccount, LocalTOTPAccount, ApiResponse } from '@/types';
import { StorageService } from './StorageService';

/**
 * Firebase Firestore service for TOTP account synchronization
 * Handles cloud storage, real-time sync, and offline persistence
 */
export class FirebaseService {
  private static instance: FirebaseService;
  private storageService: StorageService;
  private unsubscribeCallbacks: Array<() => void> = [];

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Create a new TOTP account in Firestore
   */
  public async createAccount(
    userId: string,
    account: Omit<TOTPAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<string>> {
    try {
      const accountId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const accountData: TOTPAccount = {
        ...account,
        id: accountId,
        userId,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const accountRef = doc(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.ACCOUNTS,
        accountId
      );
      await setDoc(accountRef, accountData);

      return {
        success: true,
        data: accountId,
        message: 'Account created successfully',
      };
    } catch (error) {
      console.error('Error creating account:', error);
      return {
        success: false,
        error: 'Failed to create account',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update an existing TOTP account in Firestore
   */
  public async updateAccount(
    userId: string,
    accountId: string,
    updates: Partial<Omit<TOTPAccount, 'id' | 'userId' | 'createdAt'>>
  ): Promise<ApiResponse> {
    try {
      const accountRef = doc(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.ACCOUNTS,
        accountId
      );
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(accountRef, updateData);

      return {
        success: true,
        message: 'Account updated successfully',
      };
    } catch (error) {
      console.error('Error updating account:', error);
      return {
        success: false,
        error: 'Failed to update account',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a TOTP account from Firestore
   */
  public async deleteAccount(
    userId: string,
    accountId: string
  ): Promise<ApiResponse> {
    try {
      const accountRef = doc(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.ACCOUNTS,
        accountId
      );
      await deleteDoc(accountRef);

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      return {
        success: false,
        error: 'Failed to delete account',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all TOTP accounts for a user
   */
  public async getAccounts(
    userId: string
  ): Promise<ApiResponse<TOTPAccount[]>> {
    try {
      const accountsRef = collection(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.ACCOUNTS
      );
      const accountsQuery = query(accountsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(accountsQuery);

      const accounts: TOTPAccount[] = [];
      snapshot.forEach(doc => {
        accounts.push({ id: doc.id, ...doc.data() } as TOTPAccount);
      });

      return {
        success: true,
        data: accounts,
        message: 'Accounts retrieved successfully',
      };
    } catch (error) {
      console.error('Error getting accounts:', error);
      return {
        success: false,
        error: 'Failed to get accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set up real-time listener for user's TOTP accounts
   */
  public subscribeToAccounts(
    userId: string,
    callback: (accounts: TOTPAccount[]) => void
  ): () => void {
    try {
      const accountsRef = collection(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.ACCOUNTS
      );
      const accountsQuery = query(accountsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        accountsQuery,
        snapshot => {
          const accounts: TOTPAccount[] = [];
          snapshot.forEach(doc => {
            accounts.push({ id: doc.id, ...doc.data() } as TOTPAccount);
          });
          callback(accounts);
        },
        error => {
          console.error('Error in accounts subscription:', error);
          callback([]);
        }
      );

      this.unsubscribeCallbacks.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up accounts subscription:', error);
      return () => {};
    }
  }

  /**
   * Sync local accounts with Firestore
   */
  public async syncAccounts(userId: string): Promise<ApiResponse> {
    try {
      // Get local accounts
      const localAccounts = await this.storageService.loadAccounts();

      // Get cloud accounts
      const cloudResult = await this.getAccounts(userId);
      if (!cloudResult.success) {
        throw new Error(cloudResult.error || 'Failed to get cloud accounts');
      }

      const cloudAccounts = cloudResult.data || [];
      const conflicts = await this.resolveConflicts(
        userId,
        localAccounts,
        cloudAccounts
      );

      return {
        success: true,
        data: conflicts,
        message: 'Accounts synced successfully',
      };
    } catch (error) {
      console.error('Error syncing accounts:', error);
      return {
        success: false,
        error: 'Failed to sync accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Resolve conflicts between local and cloud accounts
   */
  private async resolveConflicts(
    userId: string,
    localAccounts: LocalTOTPAccount[],
    cloudAccounts: TOTPAccount[]
  ): Promise<{ uploaded: number; downloaded: number; conflicts: number }> {
    let uploaded = 0;
    let downloaded = 0;
    let conflicts = 0;

    // Create maps for easier lookup
    const localMap = new Map(localAccounts.map(acc => [acc.id, acc]));
    const cloudMap = new Map(cloudAccounts.map(acc => [acc.id, acc]));

    // Handle accounts that exist locally but not in cloud (upload)
    for (const localAccount of localAccounts) {
      if (
        !cloudMap.has(localAccount.id) &&
        localAccount.syncStatus === 'pending'
      ) {
        try {
          // Encrypt secret before uploading
          const encryptedSecret = await this.storageService.encrypt(
            localAccount.secret
          );

          await this.createAccount(userId, {
            serviceName: localAccount.serviceName,
            accountName: localAccount.accountName,
            encryptedSecret,
            algorithm: localAccount.algorithm as any,
            digits: localAccount.digits as any,
            period: localAccount.period,
            iconUrl: localAccount.iconUrl,
          });

          // Update local sync status
          const updatedLocal = {
            ...localAccount,
            syncStatus: 'synced' as const,
          };
          localMap.set(localAccount.id, updatedLocal);
          uploaded++;
        } catch (error) {
          console.error('Error uploading account:', error);
          conflicts++;
        }
      }
    }

    // Handle accounts that exist in cloud but not locally (download)
    for (const cloudAccount of cloudAccounts) {
      if (!localMap.has(cloudAccount.id)) {
        try {
          // Decrypt secret after downloading
          const decryptedSecret = await this.storageService.decrypt(
            cloudAccount.encryptedSecret
          );

          const localAccount: LocalTOTPAccount = {
            id: cloudAccount.id,
            serviceName: cloudAccount.serviceName,
            accountName: cloudAccount.accountName,
            secret: decryptedSecret,
            algorithm: cloudAccount.algorithm,
            digits: cloudAccount.digits,
            period: cloudAccount.period,
            iconUrl: cloudAccount.iconUrl,
            syncStatus: 'synced',
            lastModified: Date.now(),
          };

          localMap.set(cloudAccount.id, localAccount);
          downloaded++;
        } catch (error) {
          console.error('Error downloading account:', error);
          conflicts++;
        }
      }
    }

    // Handle conflicts (accounts exist in both but are different)
    for (const localAccount of localAccounts) {
      const cloudAccount = cloudMap.get(localAccount.id);
      if (cloudAccount && this.hasConflict(localAccount, cloudAccount)) {
        // Use "last modified wins" strategy
        const localTime = localAccount.lastModified;
        const cloudTime = cloudAccount.updatedAt?.toMillis?.() || 0;

        if (localTime > cloudTime) {
          // Local is newer, upload
          try {
            const encryptedSecret = await this.storageService.encrypt(
              localAccount.secret
            );
            await this.updateAccount(userId, localAccount.id, {
              serviceName: localAccount.serviceName,
              accountName: localAccount.accountName,
              encryptedSecret,
              algorithm: localAccount.algorithm as any,
              digits: localAccount.digits as any,
              period: localAccount.period,
              iconUrl: localAccount.iconUrl,
            });
            uploaded++;
          } catch (error) {
            console.error('Error resolving conflict (upload):', error);
            conflicts++;
          }
        } else {
          // Cloud is newer, download
          try {
            const decryptedSecret = await this.storageService.decrypt(
              cloudAccount.encryptedSecret
            );
            const updatedLocal: LocalTOTPAccount = {
              ...localAccount,
              serviceName: cloudAccount.serviceName,
              accountName: cloudAccount.accountName,
              secret: decryptedSecret,
              algorithm: cloudAccount.algorithm,
              digits: cloudAccount.digits,
              period: cloudAccount.period,
              iconUrl: cloudAccount.iconUrl,
              syncStatus: 'synced',
              lastModified: Date.now(),
            };
            localMap.set(localAccount.id, updatedLocal);
            downloaded++;
          } catch (error) {
            console.error('Error resolving conflict (download):', error);
            conflicts++;
          }
        }
      }
    }

    // Save updated local accounts
    await this.storageService.saveAccounts(Array.from(localMap.values()));

    return { uploaded, downloaded, conflicts };
  }

  /**
   * Check if there's a conflict between local and cloud account
   */
  private hasConflict(local: LocalTOTPAccount, cloud: TOTPAccount): boolean {
    return (
      local.serviceName !== cloud.serviceName ||
      local.accountName !== cloud.accountName ||
      local.algorithm !== cloud.algorithm ||
      local.digits !== cloud.digits ||
      local.period !== cloud.period
    );
  }

  /**
   * Enable offline persistence
   */
  public async enableOffline(): Promise<void> {
    try {
      await disableNetwork(db);
    } catch (error) {
      console.error('Error enabling offline mode:', error);
    }
  }

  /**
   * Disable offline persistence
   */
  public async disableOffline(): Promise<void> {
    try {
      await enableNetwork(db);
    } catch (error) {
      console.error('Error disabling offline mode:', error);
    }
  }

  /**
   * Clean up all subscriptions
   */
  public unsubscribeAll(): void {
    this.unsubscribeCallbacks.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.unsubscribeCallbacks = [];
  }

  /**
   * Get sync status and statistics
   */
  public async getSyncStatus(userId: string): Promise<
    ApiResponse<{
      lastSync: number;
      pendingUploads: number;
      totalAccounts: number;
      cloudAccounts: number;
    }>
  > {
    try {
      const localAccounts = await this.storageService.loadAccounts();
      const cloudResult = await this.getAccounts(userId);

      const pendingUploads = localAccounts.filter(
        acc => acc.syncStatus === 'pending'
      ).length;
      const lastSync = await this.storageService.getLastSyncTime();

      return {
        success: true,
        data: {
          lastSync,
          pendingUploads,
          totalAccounts: localAccounts.length,
          cloudAccounts: cloudResult.success
            ? cloudResult.data?.length || 0
            : 0,
        },
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        success: false,
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { StorageService } from './StorageService';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: 'fingerprint' | 'face' | 'iris' | 'none';
}

/**
 * Biometric Authentication Service
 * Handles fingerprint, face recognition, and other biometric authentication
 */
export class BiometricService {
  private static instance: BiometricService;
  private storageService: StorageService;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Check if biometric authentication is available on the device
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  public async getSupportedTypes(): Promise<
    LocalAuthentication.AuthenticationType[]
  > {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting supported biometric types:', error);
      return [];
    }
  }

  /**
   * Get the primary biometric type for display purposes
   */
  public async getPrimaryBiometricType(): Promise<
    'fingerprint' | 'face' | 'iris' | 'none'
  > {
    try {
      const types = await this.getSupportedTypes();

      if (
        types.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
        )
      ) {
        return 'face';
      } else if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        return 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }

      return 'none';
    } catch (error) {
      console.error('Error getting primary biometric type:', error);
      return 'none';
    }
  }

  /**
   * Authenticate using biometrics
   */
  public async authenticate(reason?: string): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available',
          biometricType: 'none',
        };
      }

      const biometricType = await this.getPrimaryBiometricType();
      const defaultReason = this.getDefaultReason(biometricType);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || defaultReason,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType,
        };
      } else {
        let error = 'Authentication failed';

        if (result.error === 'user_cancel') {
          error = 'Authentication was cancelled';
        } else if (result.error === 'user_fallback') {
          error = 'User chose to use fallback authentication';
        } else if (result.error === 'system_cancel') {
          error = 'Authentication was cancelled by the system';
        } else if (result.error === 'app_cancel') {
          error = 'Authentication was cancelled by the app';
        } else if (result.error === 'invalid_context') {
          error = 'Invalid authentication context';
        } else if (result.error === 'biometry_not_available') {
          error = 'Biometric authentication is not available';
        } else if (result.error === 'biometry_not_enrolled') {
          error = 'No biometric data is enrolled';
        } else if (result.error === 'biometry_lockout') {
          error = 'Biometric authentication is locked out';
        }

        return {
          success: false,
          error,
          biometricType,
        };
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        biometricType: 'none',
      };
    }
  }

  /**
   * Get default authentication reason based on biometric type
   */
  private getDefaultReason(biometricType: string): string {
    switch (biometricType) {
      case 'face':
        return 'Use Face ID to access your authenticator codes';
      case 'fingerprint':
        return 'Use your fingerprint to access your authenticator codes';
      case 'iris':
        return 'Use iris recognition to access your authenticator codes';
      default:
        return 'Authenticate to access your authenticator codes';
    }
  }

  /**
   * Check if biometric authentication is enabled in user preferences
   */
  public async isEnabled(): Promise<boolean> {
    try {
      return await this.storageService.getBiometricPreference();
    } catch (error) {
      console.error('Error checking biometric preference:', error);
      return false;
    }
  }

  /**
   * Enable biometric authentication
   */
  public async enable(): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      // Test authentication before enabling
      const authResult = await this.authenticate(
        'Enable biometric authentication'
      );
      if (authResult.success) {
        await this.storageService.saveBiometricPreference(true);
        return {
          success: true,
          biometricType: authResult.biometricType,
        };
      } else {
        return authResult;
      }
    } catch (error) {
      console.error('Error enabling biometric authentication:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to enable biometric authentication',
      };
    }
  }

  /**
   * Disable biometric authentication
   */
  public async disable(): Promise<void> {
    try {
      await this.storageService.saveBiometricPreference(false);
    } catch (error) {
      console.error('Error disabling biometric authentication:', error);
      throw new Error('Failed to disable biometric authentication');
    }
  }

  /**
   * Show biometric setup prompt
   */
  public async promptSetup(): Promise<void> {
    const biometricType = await this.getPrimaryBiometricType();
    const message = this.getSetupMessage(biometricType);

    Alert.alert('Biometric Authentication', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Enable',
        onPress: async () => {
          const result = await this.enable();
          if (!result.success) {
            Alert.alert(
              'Setup Failed',
              result.error || 'Failed to enable biometric authentication'
            );
          }
        },
      },
    ]);
  }

  /**
   * Get setup message based on biometric type
   */
  private getSetupMessage(biometricType: string): string {
    switch (biometricType) {
      case 'face':
        return 'Enable Face ID to quickly and securely access your authenticator codes without entering your password.';
      case 'fingerprint':
        return 'Enable fingerprint authentication to quickly and securely access your authenticator codes without entering your password.';
      case 'iris':
        return 'Enable iris recognition to quickly and securely access your authenticator codes without entering your password.';
      default:
        return 'Enable biometric authentication to quickly and securely access your authenticator codes without entering your password.';
    }
  }

  /**
   * Handle authentication with fallback to password
   */
  public async authenticateWithFallback(
    reason?: string,
    onPasswordFallback?: () => void
  ): Promise<BiometricAuthResult> {
    try {
      const isEnabled = await this.isEnabled();
      if (!isEnabled) {
        // Biometric auth is disabled, use password fallback
        onPasswordFallback?.();
        return {
          success: false,
          error: 'Biometric authentication is disabled',
        };
      }

      const result = await this.authenticate(reason);

      if (!result.success && result.error?.includes('fallback')) {
        // User chose password fallback
        onPasswordFallback?.();
      }

      return result;
    } catch (error) {
      console.error('Error in biometric authentication with fallback:', error);
      onPasswordFallback?.();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}

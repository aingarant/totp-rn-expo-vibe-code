import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for managing authentication state and operations
 * Provides convenience methods and state management for auth-related components
 */
export const useAuthState = () => {
  const auth = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Clear error when auth state changes
  useEffect(() => {
    if (auth.isAuthenticated) {
      setAuthError(null);
    }
  }, [auth.isAuthenticated]);

  // Sign in with error handling
  const handleSignIn = async (email: string, password: string) => {
    setAuthError(null);
    const result = await auth.signIn(email, password);

    if (!result.success) {
      setAuthError(result.message || 'Sign in failed');
      return false;
    }

    return true;
  };

  // Sign up with error handling
  const handleSignUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    setAuthError(null);
    const result = await auth.signUp(email, password, displayName);

    if (!result.success) {
      setAuthError(result.message || 'Sign up failed');
      return false;
    }

    return true;
  };

  // Password reset with error handling
  const handlePasswordReset = async (email: string) => {
    setAuthError(null);
    const result = await auth.resetPassword(email);

    if (!result.success) {
      setAuthError(result.message || 'Password reset failed');
      return false;
    }

    return true;
  };

  // Sign out with error handling
  const handleSignOut = async () => {
    setAuthError(null);
    const result = await auth.logOut();

    if (!result.success) {
      setAuthError(result.message || 'Sign out failed');
      return false;
    }

    return true;
  };

  // Clear any auth errors
  const clearError = () => {
    setAuthError(null);
  };

  return {
    // Auth state
    user: auth.user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    authError,

    // Auth actions
    signIn: handleSignIn,
    signUp: handleSignUp,
    resetPassword: handlePasswordReset,
    signOut: handleSignOut,
    updateProfile: auth.updateUserProfile,
    clearError,
  };
};

/**
 * Hook for user preferences management
 * Handles user settings and preferences updates
 */
export const useUserPreferences = () => {
  const { user, updateUserProfile } = useAuth();

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    if (!user) return { success: false, message: 'User not authenticated' };

    return await updateUserProfile({
      preferences: {
        ...user.preferences,
        theme,
      },
    });
  };

  const updateAutoLock = async (autoLock: boolean, timeout?: number) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    const preferences = {
      ...user.preferences,
      autoLock,
    };

    if (timeout !== undefined) {
      preferences.autoLockTimeout = timeout;
    }

    return await updateUserProfile({ preferences });
  };

  const updateAutoLockTimeout = async (timeout: number) => {
    if (!user) return { success: false, message: 'User not authenticated' };

    return await updateUserProfile({
      preferences: {
        ...user.preferences,
        autoLockTimeout: timeout,
      },
    });
  };

  return {
    preferences: user?.preferences,
    updateTheme,
    updateAutoLock,
    updateAutoLockTimeout,
  };
};

/**
 * Hook for authentication status monitoring
 * Useful for debugging and status monitoring
 */
export const useAuthStatus = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'checking'
  >('checking');

  useEffect(() => {
    // For React Native, we'll assume connected by default
    // In a full implementation, you'd use NetInfo from @react-native-community/netinfo
    setConnectionStatus('connected');
  }, []);

  return {
    isLoading,
    isAuthenticated,
    connectionStatus,
    userEmail: user?.email,
    userId: user?.uid,
    lastLogin: user?.lastLoginAt,
    accountCreated: user?.createdAt,
  };
};

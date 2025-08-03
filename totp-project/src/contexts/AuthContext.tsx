import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '@/services/firebase';
import { User, AuthState, ApiResponse } from '@/types';
import { SessionManager } from '@/services/SessionManager';

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<ApiResponse<User>>;
  signUp: (email: string, password: string, displayName?: string) => Promise<ApiResponse<User>>;
  logOut: () => Promise<ApiResponse>;
  resetPassword: (email: string) => Promise<ApiResponse>;
  updateUserProfile: (updates: Partial<User>) => Promise<ApiResponse<User>>;
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sessionManagerRef = useRef<SessionManager | null>(null);

  // Convert Firebase user to our User type
  const createUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));

    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      // Create new user profile
      const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        createdAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any,
        preferences: {
          theme: 'system',
          autoLock: true,
          autoLockTimeout: 5, // 5 minutes
        },
      };

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
      return newUser;
    }
  };

  // Update last login time
  const updateLastLogin = async (userId: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Failed to update last login time:', error);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<ApiResponse<User>> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await createUserProfile(userCredential.user);
      await updateLastLogin(userProfile.uid);

      return {
        success: true,
        data: userProfile,
        message: 'Successfully signed in',
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.code || 'auth/unknown-error',
        message: getAuthErrorMessage(error.code),
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string): Promise<ApiResponse<User>> => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      const userProfile = await createUserProfile(userCredential.user);

      return {
        success: true,
        data: userProfile,
        message: 'Account created successfully',
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.code || 'auth/unknown-error',
        message: getAuthErrorMessage(error.code),
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logOut = async (): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      await signOut(auth);
      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.code || 'auth/unknown-error',
        message: 'Failed to sign out',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<ApiResponse> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.code || 'auth/unknown-error',
        message: getAuthErrorMessage(error.code),
      };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    if (!user) {
      return {
        success: false,
        error: 'auth/user-not-found',
        message: 'No user is currently signed in',
      };
    }

    try {
      setIsLoading(true);
      const updatedUser = { ...user, ...updates };
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), updates);
      setUser(updatedUser);

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.code || 'firestore/unknown-error',
        message: 'Failed to update profile',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize session manager
  useEffect(() => {
    if (!sessionManagerRef.current) {
      sessionManagerRef.current = SessionManager.createDefault(() => {
        logOut();
      });
    }

    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.stopSession();
      }
    };
  }, []);

  // Reset session timer (to be called on user activity)
  const resetSessionTimer = () => {
    if (sessionManagerRef.current && isAuthenticated) {
      sessionManagerRef.current.resetActivityTimer();
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await createUserProfile(firebaseUser);
          setUser(userProfile);
          setIsAuthenticated(true);

          // Start session management
          if (sessionManagerRef.current) {
            sessionManagerRef.current.startSession(userProfile);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);

          // Stop session management
          if (sessionManagerRef.current) {
            sessionManagerRef.current.stopSession();
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    logOut,
    resetPassword,
    updateUserProfile,
    resetSessionTimer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
};

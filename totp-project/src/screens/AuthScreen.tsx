import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { isValidEmail, isValidPassword } from '@/utils/helpers';

type AuthMode = 'signin' | 'signup' | 'reset';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (mode !== 'reset') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'signup' && !isValidPassword(formData.password)) {
        newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
      }

      // Confirm password validation (signup only)
      if (mode === 'signup') {
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }

        // Display name validation
        if (!formData.displayName.trim()) {
          newErrors.displayName = 'Display name is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let result;

      switch (mode) {
        case 'signin':
          result = await signIn(formData.email, formData.password);
          break;
        case 'signup':
          result = await signUp(formData.email, formData.password, formData.displayName);
          break;
        case 'reset':
          result = await resetPassword(formData.email);
          if (result.success) {
            Alert.alert('Success', result.message, [
              { text: 'OK', onPress: () => setMode('signin') }
            ]);
            return;
          }
          break;
      }

      if (result && !result.success) {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Update form field
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Switch between modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    if (newMode === 'signin') {
      setFormData(prev => ({ ...prev, confirmPassword: '', displayName: '' }));
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'reset': return 'Reset Password';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'signin': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'reset': return 'Send Reset Email';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' && 'Sign in to access your authenticator codes'}
            {mode === 'signup' && 'Create your secure authenticator account'}
            {mode === 'reset' && 'Enter your email to reset your password'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Display Name (Signup only) */}
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={[styles.input, errors.displayName && styles.inputError]}
                value={formData.displayName}
                onChangeText={(value) => updateField('displayName', value)}
                placeholder="Enter your name"
                autoCapitalize="words"
                textContentType="name"
              />
              {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
            </View>
          )}

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password (not for reset) */}
          {mode !== 'reset' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>
          )}

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{getSubmitText()}</Text>
            )}
          </TouchableOpacity>

          {/* Mode Switch Links */}
          <View style={styles.links}>
            {mode === 'signin' && (
              <>
                <TouchableOpacity onPress={() => switchMode('reset')}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchMode('signup')}>
                  <Text style={styles.linkText}>
                    Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'signup' && (
              <TouchableOpacity onPress={() => switchMode('signin')}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'reset' && (
              <TouchableOpacity onPress={() => switchMode('signin')}>
                <Text style={styles.linkText}>
                  Remember your password? <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  passwordToggleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  links: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  linkTextBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default AuthScreen;

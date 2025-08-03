import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TOTPService } from '@/services/TOTPService';
import { LocalTOTPAccount } from '@/types';

interface AddAccountFormProps {
  onSave: (account: Omit<LocalTOTPAccount, 'id' | 'lastModified' | 'syncStatus'>) => void;
  onCancel: () => void;
  initialData?: Partial<LocalTOTPAccount>;
}

export const AddAccountForm: React.FC<AddAccountFormProps> = ({
  onSave,
  onCancel,
  initialData,
}) => {
  const [serviceName, setServiceName] = useState(initialData?.serviceName || '');
  const [accountName, setAccountName] = useState(initialData?.accountName || '');
  const [secret, setSecret] = useState(initialData?.secret || '');
  const [algorithm, setAlgorithm] = useState<'SHA1' | 'SHA256' | 'SHA512'>(
    (initialData?.algorithm as any) || 'SHA1'
  );
  const [digits, setDigits] = useState<6 | 7 | 8>((initialData?.digits as any) || 6);
  const [period, setPeriod] = useState(initialData?.period?.toString() || '30');
  const [isValidatingSecret, setIsValidatingSecret] = useState(false);

  const totpService = TOTPService.getInstance();

  const validateForm = (): boolean => {
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Service name is required');
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert('Error', 'Account name is required');
      return false;
    }

    if (!secret.trim()) {
      Alert.alert('Error', 'Secret key is required');
      return false;
    }

    if (!totpService.validateSecret(secret.trim())) {
      Alert.alert('Error', 'Invalid secret key. Please check the key format.');
      return false;
    }

    const periodNum = parseInt(period);
    if (isNaN(periodNum) || periodNum < 1 || periodNum > 300) {
      Alert.alert('Error', 'Period must be between 1 and 300 seconds');
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    try {
      // Test TOTP generation to ensure the secret works
      setIsValidatingSecret(true);
      const testCode = totpService.generateTOTP(secret.trim(), {
        algorithm,
        digits,
        period: parseInt(period),
      });

      if (!testCode) {
        throw new Error('Failed to generate TOTP code');
      }

      const accountData: Omit<LocalTOTPAccount, 'id' | 'lastModified' | 'syncStatus'> = {
        serviceName: serviceName.trim(),
        accountName: accountName.trim(),
        secret: secret.trim(),
        algorithm,
        digits,
        period: parseInt(period),
        iconUrl: undefined,
      };

      onSave(accountData);
    } catch (error) {
      Alert.alert('Error', 'Failed to validate TOTP settings. Please check your inputs.');
    } finally {
      setIsValidatingSecret(false);
    }
  };

  const testSecret = () => {
    if (!secret.trim()) {
      Alert.alert('Error', 'Please enter a secret key first');
      return;
    }

    try {
      const testCode = totpService.generateTOTP(secret.trim(), {
        algorithm,
        digits,
        period: parseInt(period) || 30,
      });
      Alert.alert('Test Successful', `Generated code: ${testCode}`);
    } catch (error) {
      Alert.alert('Test Failed', 'Invalid secret key or settings');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.title}>
            {initialData ? 'Edit Account' : 'Add Account'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="e.g., Google, GitHub, Amazon"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name *</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g., user@example.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secret Key *</Text>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={secret}
              onChangeText={setSecret}
              placeholder="Enter the secret key"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoCorrect={false}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.testButton} onPress={testSecret}>
              <Text style={styles.testButtonText}>Test Secret</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Algorithm</Text>
            <View style={styles.buttonGroup}>
              {(['SHA1', 'SHA256', 'SHA512'] as const).map((alg) => (
                <TouchableOpacity
                  key={alg}
                  style={[
                    styles.optionButton,
                    algorithm === alg && styles.optionButtonActive,
                  ]}
                  onPress={() => setAlgorithm(alg)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      algorithm === alg && styles.optionButtonTextActive,
                    ]}
                  >
                    {alg}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Digits</Text>
            <View style={styles.buttonGroup}>
              {([6, 7, 8] as const).map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.optionButton,
                    digits === num && styles.optionButtonActive,
                  ]}
                  onPress={() => setDigits(num)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      digits === num && styles.optionButtonTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Period (seconds)</Text>
            <TextInput
              style={styles.input}
              value={period}
              onChangeText={setPeriod}
              placeholder="30"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isValidatingSecret}
        >
          <Text style={styles.saveButtonText}>
            {isValidatingSecret ? 'Validating...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c2c2c',
  },
  secretInput: {
    height: 80,
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#3742fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#3742fa',
    borderColor: '#3742fa',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#3742fa',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

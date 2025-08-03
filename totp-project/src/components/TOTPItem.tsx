import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { TOTPService } from '@/services/TOTPService';
import { LocalTOTPAccount } from '@/types';

interface TOTPItemProps {
  account: LocalTOTPAccount;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const TOTPItem: React.FC<TOTPItemProps> = ({
  account,
  onPress,
  onLongPress,
}) => {
  const [totpCode, setTotpCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  const totpService = TOTPService.getInstance();

  // Generate TOTP code and calculate time remaining
  const updateTOTP = () => {
    try {
      const code = totpService.generateTOTP(account.secret, {
        algorithm: account.algorithm as any,
        digits: account.digits as any,
        period: account.period,
      });
      setTotpCode(code);

      // Calculate time remaining in current period
      const now = Math.floor(Date.now() / 1000);
      const timeInPeriod = now % account.period;
      const remaining = account.period - timeInPeriod;
      setTimeRemaining(remaining);
    } catch (error) {
      console.error('Error generating TOTP:', error);
      setTotpCode('ERROR');
      setTimeRemaining(0);
    }
  };

  // Update TOTP every second
  useEffect(() => {
    updateTOTP();
    const interval = setInterval(updateTOTP, 1000);
    return () => clearInterval(interval);
  }, [account]);

  // Copy to clipboard with feedback
  const copyToClipboard = async () => {
    if (totpCode && totpCode !== 'ERROR') {
      setIsGeneratingCode(true);
      try {
        await Clipboard.setString(totpCode);
        Alert.alert('Copied', 'TOTP code copied to clipboard');
      } catch (error) {
        Alert.alert('Error', 'Failed to copy code to clipboard');
      } finally {
        setIsGeneratingCode(false);
      }
    }
  };

  // Format TOTP code with spaces for readability
  const formatTOTPCode = (code: string): string => {
    if (code.length === 6) {
      return `${code.substring(0, 3)} ${code.substring(3)}`;
    }
    return code;
  };

  // Calculate progress for countdown timer
  const progress = timeRemaining / account.period;
  const progressColor = timeRemaining <= 10 ? '#ff4757' : '#2ed573';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>
            {account.serviceName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {account.serviceName}
          </Text>
          <Text style={styles.accountName} numberOfLines={1}>
            {account.accountName}
          </Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        <TouchableOpacity
          style={styles.codeContainer}
          onPress={copyToClipboard}
          disabled={isGeneratingCode || totpCode === 'ERROR'}
        >
          <Text style={[styles.totpCode, totpCode === 'ERROR' && styles.errorCode]}>
            {formatTOTPCode(totpCode)}
          </Text>
          <View style={styles.timerContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.timeText, { color: progressColor }]}>
              {timeRemaining}s
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3742fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 2,
  },
  accountName: {
    fontSize: 14,
    color: '#666666',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  codeContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  totpCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  errorCode: {
    color: '#ff4757',
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBarBackground: {
    width: 60,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  transparent?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = '#3742fa',
  text,
  overlay = false,
  transparent = false,
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    transparent && styles.transparent,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={[styles.text, { color }]}>{text}</Text>}
      </View>
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  color?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = 'Loading...',
  color = '#3742fa',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color={color} />
        <Text style={[styles.overlayText, { color }]}>{text}</Text>
      </View>
    </View>
  );
};

interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  textStyle?: any;
  loadingColor?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  disabled,
  children,
  onPress,
  style,
  textStyle,
  loadingColor = '#ffffff',
}) => {
  return (
    <View style={[styles.button, style, (loading || disabled) && styles.buttonDisabled]}>
      {loading ? (
        <View style={styles.buttonContent}>
          <ActivityIndicator size="small" color={loadingColor} />
          <Text style={[styles.buttonText, textStyle, styles.loadingText]}>
            Loading...
          </Text>
        </View>
      ) : (
        <Text style={[styles.buttonText, textStyle]} onPress={onPress}>
          {children}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  overlayText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3742fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
});

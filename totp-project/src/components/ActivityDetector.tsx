import React, { ComponentType, useEffect } from 'react';
import { View, ViewStyle, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface WithSessionActivityProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Higher-order component to detect user activity and reset session timer
export function withSessionActivity<P extends object>(
  WrappedComponent: ComponentType<P>
): ComponentType<P & WithSessionActivityProps> {
  return function SessionActivityWrapper(props: P & WithSessionActivityProps) {
    const { resetSessionTimer } = useAuth();

    // Handle any touch activity
    const handleActivity = () => {
      resetSessionTimer();
    };

    return (
      <TouchableWithoutFeedback onPress={handleActivity} accessible={false}>
        <View style={[{ flex: 1 }, props.style]} onTouchStart={handleActivity}>
          <WrappedComponent {...(props as P)} />
        </View>
      </TouchableWithoutFeedback>
    );
  };
}

// Simple activity detector component for screens
export const ActivityDetector: React.FC<WithSessionActivityProps> = ({ children, style }) => {
  const { resetSessionTimer } = useAuth();

  const handleActivity = () => {
    resetSessionTimer();
  };

  // Reset timer on scroll events too
  useEffect(() => {
    // Reset timer when component mounts (screen becomes active)
    handleActivity();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleActivity} accessible={false}>
      <View
        style={[{ flex: 1 }, style]}
        onTouchStart={handleActivity}
        onTouchMove={handleActivity}
      >
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

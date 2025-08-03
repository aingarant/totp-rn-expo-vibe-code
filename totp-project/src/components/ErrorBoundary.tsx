import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console and any crash reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In a production app, you would send this to a crash reporting service
    // like Sentry, Bugsnag, or Firebase Crashlytics
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportError = () => {
    const { error } = this.state;
    if (error) {
      Alert.alert(
        'Error Details',
        `${error.name}: ${error.message}\n\nStack: ${error.stack?.substring(0, 200)}...`,
        [
          { text: 'OK', style: 'default' },
          { text: 'Retry', onPress: this.handleRetry, style: 'default' },
        ]
      );
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Custom fallback UI
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              The app encountered an unexpected error. You can try restarting or report this issue.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.reportButton} onPress={this.handleReportError}>
                <Text style={styles.reportButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>{error.message}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#3742fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

// Higher-order component to wrap components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: (error: Error, retry: () => void) => ReactNode
): React.ComponentType<P> {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

import { AppState, Alert } from 'react-native';
import { User } from '@/types';

export interface SessionManagerConfig {
  sessionTimeout: number; // in milliseconds
  warningTime: number; // how long before timeout to show warning
  onSessionExpired: () => void;
  onWarning: () => void;
}

export class SessionManager {
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;
  private config: SessionManagerConfig;
  private appStateSubscription: any = null;

  constructor(config: SessionManagerConfig) {
    this.config = config;
    this.setupAppStateListener();
  }

  // Start session management for authenticated user
  public startSession(user: User): void {
    this.isActive = true;
    this.resetActivityTimer();
  }

  // Stop session management
  public stopSession(): void {
    this.isActive = false;
    this.clearTimers();
    this.cleanup();
  }

  // Reset activity timer (call on user interaction)
  public resetActivityTimer(): void {
    if (!this.isActive) return;

    this.lastActivity = Date.now();
    this.clearTimers();

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.config.sessionTimeout - this.config.warningTime);

    // Set session timeout timer
    this.sessionTimer = setTimeout(() => {
      this.handleSessionExpired();
    }, this.config.sessionTimeout);
  }

  // Check if session has expired
  public isSessionExpired(): boolean {
    if (!this.isActive) return false;
    return Date.now() - this.lastActivity > this.config.sessionTimeout;
  }

  // Get time remaining in session
  public getTimeRemaining(): number {
    if (!this.isActive) return 0;
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.config.sessionTimeout - elapsed);
  }

  private clearTimers(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private showWarning(): void {
    Alert.alert(
      'Session Expiring',
      'Your session will expire in 2 minutes due to inactivity. Tap "Continue" to extend your session.',
      [
        {
          text: 'Continue Session',
          onPress: () => this.resetActivityTimer(),
        },
        {
          text: 'Sign Out',
          onPress: () => this.handleSessionExpired(),
          style: 'destructive',
        },
      ]
    );
    this.config.onWarning();
  }

  private handleSessionExpired(): void {
    this.stopSession();
    Alert.alert(
      'Session Expired',
      'You have been signed out due to inactivity.',
      [{ text: 'OK', onPress: this.config.onSessionExpired }]
    );
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (!this.isActive) return;

        if (nextAppState === 'active') {
          // Check if session expired while app was in background
          if (this.isSessionExpired()) {
            this.handleSessionExpired();
          } else {
            this.resetActivityTimer();
          }
        } else if (nextAppState === 'background') {
          this.lastActivity = Date.now();
        }
      }
    );
  }

  private cleanup(): void {
    this.clearTimers();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  // Create default session manager instance
  public static createDefault(onSessionExpired: () => void): SessionManager {
    return new SessionManager({
      sessionTimeout: 15 * 60 * 1000, // 15 minutes
      warningTime: 2 * 60 * 1000, // 2 minutes before timeout
      onSessionExpired,
      onWarning: () => {}, // Optional callback for warning events
    });
  }
}

import { Timestamp } from "firebase/firestore"

// User-related types
export interface User {
  uid: string
  email: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  autoLock: boolean
  autoLockTimeout: number // minutes
}

// TOTP Account types
export interface TOTPAccount {
  id: string
  userId: string
  serviceName: string
  accountName: string
  encryptedSecret: string // AES encrypted
  algorithm: "SHA1" | "SHA256" | "SHA512"
  digits: 6 | 7 | 8
  period: number // seconds, typically 30
  iconUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  lastUsed?: Timestamp
}

// Local storage types (decrypted for local use)
export interface LocalTOTPAccount {
  id: string
  serviceName: string
  accountName: string
  secret: string // Decrypted for local use
  algorithm: string
  digits: number
  period: number
  iconUrl?: string
  syncStatus: "synced" | "pending" | "error"
  lastModified: number
}

// TOTP generation options
export interface TOTPOptions {
  algorithm?: "SHA1" | "SHA256" | "SHA512"
  digits?: 6 | 7 | 8
  period?: number
  window?: number
}

// TOTP code with metadata
export interface TOTPCode {
  code: string
  timeRemaining: number
  period: number
  account: LocalTOTPAccount
}

// Auth state types
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Home: undefined
  AddAccount: undefined
  Settings: undefined
  AccountDetails: { accountId: string }
}

// QR Code parsing result
export interface QRCodeResult {
  type: "totp" | "hotp"
  label: string
  secret: string
  issuer?: string
  algorithm?: string
  digits?: number
  period?: number
  counter?: number
}

// Sync status
export type SyncStatus = "synced" | "pending" | "error" | "offline"

// App state types
export interface AppState {
  isLocked: boolean
  lastActiveTime: number
  syncStatus: SyncStatus
}

// Storage service types
export interface EncryptionKey {
  key: string
  iv: string
}

export interface SecureStorageItem {
  key: string
  value: string
  timestamp: number
}

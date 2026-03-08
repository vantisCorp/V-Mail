/**
 * Two-Factor Authentication Type Definitions
 * Supports TOTP, SMS, and backup code authentication methods
 */

export type TwoFactorAuthMethod = 'totp' | 'sms' | 'backup';

export type TwoFactorAuthStatus = 'disabled' | 'enabled' | 'verified';

export interface TwoFactorAuthSetup {
  method: TwoFactorAuthMethod;
  secret?: string;
  qrCodeUri?: string;
  backupCodes?: string[];
  phoneNumber?: string;
  isVerified: boolean;
}

export interface TwoFactorAuthVerifyRequest {
  method: TwoFactorAuthMethod;
  code: string;
  backupCode?: string;
}

export interface TwoFactorAuthVerifyResponse {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

export interface TwoFactorAuthSettings {
  enabled: boolean;
  methods: TwoFactorAuthMethod[];
  defaultMethod: TwoFactorAuthMethod;
  requireOnNewDevice: boolean;
  trustedDevices: TrustedDevice[];
  backupCodesRemaining: number;
  smsPhoneNumber?: string;
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceInfo: string;
  lastUsed: Date;
  expiresAt: Date;
}

export interface TwoFactorAuthState {
  status: TwoFactorAuthStatus;
  settings: TwoFactorAuthSettings;
  setupData?: TwoFactorAuthSetup;
  isSetupPending: boolean;
}

export interface TwoFactorAuthError {
  code: string;
  message: string;
  details?: any;
}

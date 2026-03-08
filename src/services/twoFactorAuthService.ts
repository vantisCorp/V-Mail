/**
 * Two-Factor Authentication Service
 * Coordinates TOTP and SMS authentication methods
 * Manages 2FA settings and state
 */

import { TOTPService } from './totpService';
import { SMSService } from './smsService';
import {
  TwoFactorAuthSetup,
  TwoFactorAuthVerifyRequest,
  TwoFactorAuthVerifyResponse,
  TwoFactorAuthSettings,
  TrustedDevice,
  TwoFactorAuthStatus,
  TwoFactorAuthMethod,
} from '../types/twoFactorAuth';

export class TwoFactorAuthService {
  private static readonly STORAGE_KEY = 'vmail_2fa_settings';
  private static readonly TRUSTED_DEVICES_KEY = 'vmail_trusted_devices';

  /**
   * Initialize 2FA setup
   */
  static async initializeSetup(
    method: TwoFactorAuthMethod,
    username: string,
    phoneNumber?: string
  ): Promise<TwoFactorAuthSetup> {
    switch (method) {
      case 'totp':
        return await TOTPService.generateSetupData(username);
      
      case 'sms':
        if (!phoneNumber) {
          throw new Error('Phone number is required for SMS method');
        }
        if (!SMSService.isValidPhoneNumber(phoneNumber)) {
          throw new Error('Invalid phone number format');
        }
        return await SMSService.generateSetupData(phoneNumber);
      
      case 'backup':
        const backupCodes = TOTPService.generateBackupCodes();
        return {
          method: 'backup',
          backupCodes,
          isVerified: false,
        };
      
      default:
        throw new Error(`Unsupported 2FA method: ${method}`);
    }
  }

  /**
   * Verify 2FA code
   */
  static verifyCode(
    request: TwoFactorAuthVerifyRequest,
    secret: string,
    backupCodes: string[]
  ): TwoFactorAuthVerifyResponse {
    switch (request.method) {
      case 'totp':
        if (!secret) {
          return {
            success: false,
            message: 'TOTP secret not found',
          };
        }
        return TOTPService.verifyCodeWithDetails(secret, request.code);
      
      case 'sms':
        if (!request.backupCode) {
          return {
            success: false,
            message: 'Phone number required for SMS verification',
          };
        }
        return SMSService.verifySMSCode(request.backupCode, request.code);
      
      case 'backup':
        if (!request.backupCode || !backupCodes) {
          return {
            success: false,
            message: 'Backup codes not available',
          };
        }
        const result = TOTPService.verifyBackupCode(backupCodes, request.backupCode);
        
        if (result.isValid) {
          return {
            success: true,
            message: 'Backup code verified successfully',
          };
        } else {
          return {
            success: false,
            message: 'Invalid backup code',
          };
        }
      
      default:
        return {
          success: false,
          message: `Unsupported 2FA method: ${request.method}`,
        };
    }
  }

  /**
   * Save 2FA settings
   */
  static saveSettings(settings: TwoFactorAuthSettings): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  /**
   * Load 2FA settings
   */
  static loadSettings(): TwoFactorAuthSettings | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as TwoFactorAuthSettings;
      } catch (e) {
        console.error('Failed to parse 2FA settings:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Get default 2FA settings
   */
  static getDefaultSettings(): TwoFactorAuthSettings {
    return {
      enabled: false,
      methods: ['totp'],
      defaultMethod: 'totp',
      requireOnNewDevice: true,
      trustedDevices: [],
      backupCodesRemaining: 10,
    };
  }

  /**
   * Enable 2FA
   */
  static enable2FA(method: TwoFactorAuthMethod, secret?: string, phoneNumber?: string): void {
    const settings = this.loadSettings() || this.getDefaultSettings();
    
    settings.enabled = true;
    
    if (!settings.methods.includes(method)) {
      settings.methods.push(method);
    }
    
    if (secret) {
      // Store secret securely (in production, encrypt this)
      settings.defaultMethod = method;
    }
    
    if (phoneNumber) {
      settings.smsPhoneNumber = phoneNumber;
    }
    
    this.saveSettings(settings);
  }

  /**
   * Disable 2FA
   */
  static disable2FA(): void {
    const settings = this.loadSettings();
    if (settings) {
      settings.enabled = false;
      this.saveSettings(settings);
    }
  }

  /**
   * Add trusted device
   */
  static addTrustedDevice(device: TrustedDevice): void {
    const settings = this.loadSettings() || this.getDefaultSettings();
    settings.trustedDevices.push(device);
    this.saveSettings(settings);
  }

  /**
   * Remove trusted device
   */
  static removeTrustedDevice(deviceId: string): void {
    const settings = this.loadSettings();
    if (settings) {
      settings.trustedDevices = settings.trustedDevices.filter(d => d.id !== deviceId);
      this.saveSettings(settings);
    }
  }

  /**
   * Check if device is trusted
   */
  static isDeviceTrusted(deviceId: string): boolean {
    const settings = this.loadSettings();
    if (!settings) return false;
    
    const device = settings.trustedDevices.find(d => d.id === deviceId);
    if (!device) return false;
    
    // Check if device is expired
    // Convert to Date if it's a string (from JSON serialization)
    const expiresAt = device.expiresAt instanceof Date ? device.expiresAt : new Date(device.expiresAt);
    if (new Date() > expiresAt) {
      this.removeTrustedDevice(deviceId);
      return false;
    }
    
    return true;
  }

  /**
   * Get 2FA status
   */
  static getStatus(): TwoFactorAuthStatus {
    const settings = this.loadSettings();
    if (!settings || !settings.enabled) return 'disabled';
    return 'enabled';
  }

  /**
   * Regenerate backup codes
   */
  static regenerateBackupCodes(): string[] {
    const newCodes = TOTPService.generateBackupCodes();
    const settings = this.loadSettings();
    if (settings) {
      settings.backupCodesRemaining = newCodes.length;
      this.saveSettings(settings);
    }
    return newCodes;
  }

  /**
   * Clear all 2FA data (for testing purposes)
   */
  static clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TRUSTED_DEVICES_KEY);
    SMSService.clearAllCodes();
  }

  /**
   * Get current time remaining for TOTP code
   */
  static getTimeRemaining(): number {
    return TOTPService.getTimeRemaining();
  }
}
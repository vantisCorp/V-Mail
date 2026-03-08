/**
 * SMS Service for Two-Factor Authentication
 * Handles SMS code generation and verification
 * Note: In production, integrate with actual SMS providers (Twilio, AWS SNS, etc.)
 */

import { TwoFactorAuthSetup, TwoFactorAuthVerifyResponse } from '../types/twoFactorAuth';

export class SMSService {
  private static readonly CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;

  private static smsCodes: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

  /**
   * Generate SMS verification code
   */
  static generateSMSCode(phoneNumber: string): string {
    const code = this.generateRandomCode();
    const expiresAt = Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000;

    this.smsCodes.set(phoneNumber, {
      code,
      expiresAt,
      attempts: 0
    });

    // In production, send SMS via SMS provider API
    // For now, log to console
    console.log(`[SMS Service] Code for ${phoneNumber}: ${code}`);

    return code;
  }

  /**
   * Verify SMS code
   */
  static verifySMSCode(phoneNumber: string, code: string): TwoFactorAuthVerifyResponse {
    const storedData = this.smsCodes.get(phoneNumber);

    if (!storedData) {
      return {
        success: false,
        message: 'No code sent to this phone number'
      };
    }

    // Check if code has expired
    if (Date.now() > storedData.expiresAt) {
      this.smsCodes.delete(phoneNumber);
      return {
        success: false,
        message: 'Code has expired'
      };
    }

    // Check maximum attempts
    if (storedData.attempts >= this.MAX_ATTEMPTS) {
      this.smsCodes.delete(phoneNumber);
      return {
        success: false,
        message: 'Maximum attempts exceeded'
      };
    }

    // Increment attempt count
    storedData.attempts++;

    // Verify code
    if (code === storedData.code) {
      this.smsCodes.delete(phoneNumber);
      return {
        success: true,
        message: 'Code verified successfully'
      };
    }

    this.smsCodes.set(phoneNumber, storedData);
    const remainingAttempts = this.MAX_ATTEMPTS - storedData.attempts;

    return {
      success: false,
      message: 'Invalid code',
      remainingAttempts
    };
  }

  /**
   * Generate SMS setup data
   */
  static async generateSetupData(phoneNumber: string): Promise<TwoFactorAuthSetup> {
    const code = this.generateSMSCode(phoneNumber);

    return {
      method: 'sms',
      phoneNumber,
      isVerified: false
    };
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    // Simple validation - in production, use a proper phone number library
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Simple formatting - in production, use libphonenumber-js
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phoneNumber;
  }

  /**
   * Generate random 6-digit code
   */
  private static generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clear all SMS codes (for testing purposes)
   */
  static clearAllCodes(): void {
    this.smsCodes.clear();
  }

  /**
   * Get stored SMS code (for testing purposes)
   */
  static getStoredCode(phoneNumber: string): string | undefined {
    return this.smsCodes.get(phoneNumber)?.code;
  }
}

/**
 * TOTP (Time-based One-Time Password) Service
 * Handles TOTP secret generation, code verification, and QR code generation
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { TwoFactorAuthSetup, TwoFactorAuthVerifyRequest, TwoFactorAuthVerifyResponse } from '../types/twoFactorAuth';

export class TOTPService {
  private static readonly SECRET_LENGTH = 32;
  private static readonly CODE_LENGTH = 6;
  private static readonly WINDOW = 2; // Allow 2 time steps before and after
  private static readonly TIME_STEP = 30; // 30 seconds

  /**
   * Generate a new TOTP secret
   */
  static generateSecret(): string {
    return speakeasy.generateSecret({
      length: this.SECRET_LENGTH
    }).base32;
  }

  /**
   * Generate QR code URI for TOTP setup
   */
  static async generateQRCodeURI(
    secret: string,
    username: string,
    issuer: string = 'V-Mail'
  ): Promise<string> {
    return await QRCode.toDataURL(
      `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${this.CODE_LENGTH}&period=${this.TIME_STEP}`,
      {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }
    );
  }

  /**
   * Verify TOTP code
   */
  static verifyCode(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: this.WINDOW,
      time: Math.floor(Date.now() / 1000)
    });
  }

  /**
   * Verify TOTP code with detailed response
   */
  static verifyCodeWithDetails(
    secret: string,
    token: string,
    attempts: number = 3
  ): TwoFactorAuthVerifyResponse {
    const isValid = this.verifyCode(secret, token);

    return {
      success: isValid,
      message: isValid ? 'Code verified successfully' : 'Invalid code',
      remainingAttempts: isValid ? undefined : Math.max(0, attempts - 1)
    };
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        speakeasy.generateSecret({
          length: 4
        }).base32
      );
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(backupCodes: string[], code: string): { isValid: boolean; remainingCodes: string[] } {
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex === -1) {
      return {
        isValid: false,
        remainingCodes: backupCodes
      };
    }

    // Remove used backup code
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(codeIndex, 1);

    return {
      isValid: true,
      remainingCodes
    };
  }

  /**
   * Generate complete TOTP setup data
   */
  static async generateSetupData(
    username: string,
    issuer: string = 'V-Mail'
  ): Promise<TwoFactorAuthSetup> {
    const secret = this.generateSecret();
    const qrCodeUri = await this.generateQRCodeURI(secret, username, issuer);
    const backupCodes = this.generateBackupCodes();

    return {
      method: 'totp',
      secret,
      qrCodeUri,
      backupCodes,
      isVerified: false
    };
  }

  /**
   * Get current time remaining for TOTP code
   */
  static getTimeRemaining(): number {
    const now = Math.floor(Date.now() / 1000);
    return this.TIME_STEP - (now % this.TIME_STEP);
  }

  /**
   * Get TOTP code for testing purposes (should be used only in development)
   */
  static getCurrentCode(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000)
    });
  }
}

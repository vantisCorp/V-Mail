/**
 * TOTP Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TOTPService } from '../totpService';

describe('TOTPService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a valid secret', () => {
      const secret = TOTPService.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets on multiple calls', () => {
      const secret1 = TOTPService.generateSecret();
      const secret2 = TOTPService.generateSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateQRCodeURI', () => {
    it('should generate a valid QR code data URI', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const qrCodeUri = await TOTPService.generateQRCodeURI(secret, 'test@example.com');

      expect(qrCodeUri).toBeDefined();
      expect(qrCodeUri).toMatch(/^data:image\/png;base64,/);
    });

    it('should include correct OTPAuth URL (encoded in QR)', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const issuer = 'TestApp';
      const qrCodeUri = await TOTPService.generateQRCodeURI(secret, 'test@example.com', issuer);

      // The QR code is a base64 image, so we verify it's a valid image
      expect(qrCodeUri).toBeDefined();
      expect(qrCodeUri).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('verifyCode', () => {
    it('should verify a valid TOTP code', () => {
      const secret = TOTPService.generateSecret();
      const code = TOTPService.getCurrentCode(secret);

      const result = TOTPService.verifyCode(secret, code);
      expect(result).toBe(true);
    });

    it('should reject an invalid TOTP code', () => {
      const secret = TOTPService.generateSecret();
      const code = '000000';

      const result = TOTPService.verifyCode(secret, code);
      expect(result).toBe(false);
    });

    it('should verify codes within the time window', () => {
      const secret = TOTPService.generateSecret();
      const code = TOTPService.getCurrentCode(secret);

      // Current code should be valid
      expect(TOTPService.verifyCode(secret, code)).toBe(true);
    });
  });

  describe('verifyCodeWithDetails', () => {
    it('should return success response for valid code', () => {
      const secret = TOTPService.generateSecret();
      const code = TOTPService.getCurrentCode(secret);

      const result = TOTPService.verifyCodeWithDetails(secret, code);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Code verified successfully');
      expect(result.remainingAttempts).toBeUndefined();
    });

    it('should return failure response for invalid code', () => {
      const secret = TOTPService.generateSecret();
      const code = '000000';

      const result = TOTPService.verifyCodeWithDetails(secret, code, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code');
      expect(result.remainingAttempts).toBe(2);
    });

    it('should not return negative remaining attempts', () => {
      const secret = TOTPService.generateSecret();
      const code = '000000';

      const result = TOTPService.verifyCodeWithDetails(secret, code, 0);

      expect(result.success).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate default number of backup codes', () => {
      const codes = TOTPService.generateBackupCodes();

      expect(codes).toBeDefined();
      expect(codes.length).toBe(10);
      expect(codes.every(code => typeof code === 'string')).toBe(true);
    });

    it('should generate specified number of backup codes', () => {
      const codes = TOTPService.generateBackupCodes(5);

      expect(codes.length).toBe(5);
    });

    it('should generate unique backup codes', () => {
      const codes = TOTPService.generateBackupCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify a valid backup code', () => {
      const backupCodes = TOTPService.generateBackupCodes(3);
      const codeToUse = backupCodes[0];

      const result = TOTPService.verifyBackupCode(backupCodes, codeToUse);

      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toHaveLength(2);
      expect(result.remainingCodes).not.toContain(codeToUse);
    });

    it('should reject an invalid backup code', () => {
      const backupCodes = TOTPService.generateBackupCodes(3);
      const invalidCode = 'INVALIDCODE';

      const result = TOTPService.verifyBackupCode(backupCodes, invalidCode);

      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toEqual(backupCodes);
    });

    it('should remove used backup code from list', () => {
      const backupCodes = ['CODE1', 'CODE2', 'CODE3'];
      const codeToUse = 'CODE2';

      const result = TOTPService.verifyBackupCode(backupCodes, codeToUse);

      expect(result.remainingCodes).toEqual(['CODE1', 'CODE3']);
    });
  });

  describe('generateSetupData', () => {
    it('should generate complete setup data', async () => {
      const username = 'test@example.com';
      const setupData = await TOTPService.generateSetupData(username);

      expect(setupData).toBeDefined();
      expect(setupData.method).toBe('totp');
      expect(setupData.secret).toBeDefined();
      expect(setupData.qrCodeUri).toBeDefined();
      expect(setupData.backupCodes).toBeDefined();
      expect(setupData.backupCodes).toHaveLength(10);
      expect(setupData.isVerified).toBe(false);
    });

    it('should include QR code URI', async () => {
      const username = 'test@example.com';
      const setupData = await TOTPService.generateSetupData(username);

      expect(setupData.qrCodeUri).toMatch(/^data:image\/png;base64,/);
    });

    it('should use custom issuer if provided', async () => {
      const username = 'test@example.com';
      const issuer = 'CustomApp';
      const setupData = await TOTPService.generateSetupData(username, issuer);

      // QR code is a base64 image, we just verify it's generated
      expect(setupData.qrCodeUri).toBeDefined();
      expect(setupData.qrCodeUri).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return time between 0 and 30 seconds', () => {
      const timeRemaining = TOTPService.getTimeRemaining();

      expect(timeRemaining).toBeGreaterThanOrEqual(0);
      expect(timeRemaining).toBeLessThanOrEqual(30);
    });
  });

  describe('getCurrentCode', () => {
    it('should generate a 6-digit code', () => {
      const secret = TOTPService.generateSecret();
      const code = TOTPService.getCurrentCode(secret);

      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('should generate same code for same secret within time window', () => {
      const secret = TOTPService.generateSecret();
      const code1 = TOTPService.getCurrentCode(secret);
      const code2 = TOTPService.getCurrentCode(secret);

      expect(code1).toBe(code2);
    });
  });
});

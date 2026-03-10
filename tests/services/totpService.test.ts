import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TOTPService } from '../../src/services/totpService';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Mock external dependencies
vi.mock('speakeasy', () => {
  let callCount = 0;
  return {
    default: {},
    generateSecret: vi.fn().mockImplementation(({ length }: { length: number }) => ({
      base32: 'MOCK_SECRET_' + length + '_' + callCount++
    })),
    totp: Object.assign(vi.fn().mockReturnValue('123456'), {
      verify: vi.fn().mockReturnValue(true)
    })
  };
});

vi.mock('qrcode', () => ({
  default: {},
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode')
}));

describe('TOTPService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =============================================
  // generateSecret
  // =============================================
  describe('generateSecret', () => {
    it('should generate a base32 secret', () => {
      const secret = TOTPService.generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({ length: 32 });
    });

    it('should call speakeasy with correct secret length', () => {
      TOTPService.generateSecret();
      expect(speakeasy.generateSecret).toHaveBeenCalledWith(expect.objectContaining({ length: 32 }));
    });
  });

  // =============================================
  // generateQRCodeURI
  // =============================================
  describe('generateQRCodeURI', () => {
    it('should generate a QR code data URL', async () => {
      const result = await TOTPService.generateQRCodeURI('TESTSECRET', 'user@example.com');
      expect(result).toBe('data:image/png;base64,mockQRCode');
      expect(QRCode.toDataURL).toHaveBeenCalled();
    });

    it('should use default issuer V-Mail', async () => {
      await TOTPService.generateQRCodeURI('TESTSECRET', 'user@example.com');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('issuer=V-Mail');
      expect(uri).toContain('V-Mail:user@example.com');
    });

    it('should use custom issuer when provided', async () => {
      await TOTPService.generateQRCodeURI('TESTSECRET', 'user@example.com', 'CustomApp');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('issuer=CustomApp');
      expect(uri).toContain('CustomApp:user@example.com');
    });

    it('should include secret in the URI', async () => {
      await TOTPService.generateQRCodeURI('MYSECRET123', 'user@example.com');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('secret=MYSECRET123');
    });

    it('should include correct algorithm and digits', async () => {
      await TOTPService.generateQRCodeURI('TESTSECRET', 'user@example.com');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });

    it('should pass correct QR code options', async () => {
      await TOTPService.generateQRCodeURI('TESTSECRET', 'user@example.com');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const options = call[1] as Record<string, unknown>;
      expect(options).toEqual({
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    });
  });

  // =============================================
  // verifyCode
  // =============================================
  describe('verifyCode', () => {
    it('should return true for valid code', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);
      const result = TOTPService.verifyCode('TESTSECRET', '123456');
      expect(result).toBe(true);
    });

    it('should return false for invalid code', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      const result = TOTPService.verifyCode('TESTSECRET', '000000');
      expect(result).toBe(false);
    });

    it('should call speakeasy.totp.verify with correct params', () => {
      TOTPService.verifyCode('MYSECRET', '654321');
      expect(speakeasy.totp.verify).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: 'MYSECRET',
          encoding: 'base32',
          token: '654321',
          window: 2
        })
      );
    });
  });

  // =============================================
  // verifyCodeWithDetails
  // =============================================
  describe('verifyCodeWithDetails', () => {
    it('should return success response for valid code', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(true);
      const result = TOTPService.verifyCodeWithDetails('TESTSECRET', '123456');
      expect(result).toEqual({
        success: true,
        message: 'Code verified successfully',
        remainingAttempts: undefined
      });
    });

    it('should return failure response with remaining attempts for invalid code', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      const result = TOTPService.verifyCodeWithDetails('TESTSECRET', '000000', 3);
      expect(result).toEqual({
        success: false,
        message: 'Invalid code',
        remainingAttempts: 2
      });
    });

    it('should use default attempts of 3', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      const result = TOTPService.verifyCodeWithDetails('TESTSECRET', '000000');
      expect(result.remainingAttempts).toBe(2);
    });

    it('should not go below 0 remaining attempts', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      const result = TOTPService.verifyCodeWithDetails('TESTSECRET', '000000', 0);
      expect(result.remainingAttempts).toBe(0);
    });

    it('should handle 1 remaining attempt', () => {
      vi.mocked(speakeasy.totp.verify).mockReturnValue(false);
      const result = TOTPService.verifyCodeWithDetails('TESTSECRET', '000000', 1);
      expect(result.remainingAttempts).toBe(0);
    });
  });

  // =============================================
  // generateBackupCodes
  // =============================================
  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes by default', () => {
      const codes = TOTPService.generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it('should generate specified number of codes', () => {
      const codes = TOTPService.generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it('should generate string codes', () => {
      const codes = TOTPService.generateBackupCodes(3);
      codes.forEach((code) => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should call speakeasy.generateSecret for each code', () => {
      vi.clearAllMocks();
      TOTPService.generateBackupCodes(5);
      expect(speakeasy.generateSecret).toHaveBeenCalledTimes(5);
      expect(speakeasy.generateSecret).toHaveBeenCalledWith({ length: 4 });
    });
  });

  // =============================================
  // verifyBackupCode
  // =============================================
  describe('verifyBackupCode', () => {
    it('should return valid and remove used code', () => {
      const codes = ['CODE1', 'CODE2', 'CODE3'];
      const result = TOTPService.verifyBackupCode(codes, 'CODE2');
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toEqual(['CODE1', 'CODE3']);
      expect(result.remainingCodes).toHaveLength(2);
    });

    it('should return invalid for non-existent code', () => {
      const codes = ['CODE1', 'CODE2', 'CODE3'];
      const result = TOTPService.verifyBackupCode(codes, 'INVALID');
      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toEqual(['CODE1', 'CODE2', 'CODE3']);
    });

    it('should not mutate the original array', () => {
      const codes = ['CODE1', 'CODE2', 'CODE3'];
      TOTPService.verifyBackupCode(codes, 'CODE2');
      expect(codes).toEqual(['CODE1', 'CODE2', 'CODE3']);
    });

    it('should handle empty backup codes array', () => {
      const result = TOTPService.verifyBackupCode([], 'CODE1');
      expect(result.isValid).toBe(false);
      expect(result.remainingCodes).toEqual([]);
    });

    it('should handle removing the first code', () => {
      const codes = ['FIRST', 'SECOND', 'THIRD'];
      const result = TOTPService.verifyBackupCode(codes, 'FIRST');
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toEqual(['SECOND', 'THIRD']);
    });

    it('should handle removing the last code', () => {
      const codes = ['FIRST', 'SECOND', 'THIRD'];
      const result = TOTPService.verifyBackupCode(codes, 'THIRD');
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toEqual(['FIRST', 'SECOND']);
    });

    it('should handle single code array', () => {
      const codes = ['ONLY'];
      const result = TOTPService.verifyBackupCode(codes, 'ONLY');
      expect(result.isValid).toBe(true);
      expect(result.remainingCodes).toEqual([]);
    });
  });

  // =============================================
  // generateSetupData
  // =============================================
  describe('generateSetupData', () => {
    it('should generate complete setup data', async () => {
      const setup = await TOTPService.generateSetupData('user@example.com');
      expect(setup.method).toBe('totp');
      expect(setup.secret).toBeDefined();
      expect(setup.qrCodeUri).toBe('data:image/png;base64,mockQRCode');
      expect(setup.backupCodes).toBeDefined();
      expect(setup.backupCodes).toHaveLength(10);
      expect(setup.isVerified).toBe(false);
    });

    it('should use custom issuer', async () => {
      await TOTPService.generateSetupData('user@example.com', 'MyApp');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('issuer=MyApp');
    });

    it('should use default V-Mail issuer', async () => {
      await TOTPService.generateSetupData('user@example.com');
      const call = vi.mocked(QRCode.toDataURL).mock.calls[0];
      const uri = call[0] as string;
      expect(uri).toContain('issuer=V-Mail');
    });
  });

  // =============================================
  // getTimeRemaining
  // =============================================
  describe('getTimeRemaining', () => {
    it('should return a number between 1 and 30', () => {
      const remaining = TOTPService.getTimeRemaining();
      expect(remaining).toBeGreaterThanOrEqual(1);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should return correct time remaining based on current time', () => {
      const now = Math.floor(Date.now() / 1000);
      const expected = 30 - (now % 30);
      const result = TOTPService.getTimeRemaining();
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(result - expected)).toBeLessThanOrEqual(1);
    });
  });

  // =============================================
  // getCurrentCode
  // =============================================
  describe('getCurrentCode', () => {
    it('should return a TOTP code string', () => {
      const code = TOTPService.getCurrentCode('TESTSECRET');
      expect(typeof code).toBe('string');
    });

    it('should call speakeasy.totp with correct params', () => {
      TOTPService.getCurrentCode('MYSECRET');
      expect(speakeasy.totp).toHaveBeenCalledWith(
        expect.objectContaining({
          secret: 'MYSECRET',
          encoding: 'base32'
        })
      );
    });
  });
});

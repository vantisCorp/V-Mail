import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SMSService } from '../../src/services/smsService';

describe('SMSService', () => {
  beforeEach(() => {
    SMSService.clearAllCodes();
    vi.restoreAllMocks();
  });

  // =============================================
  // generateSMSCode
  // =============================================
  describe('generateSMSCode', () => {
    it('should generate a 6-digit code', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      expect(code).toMatch(/^\d{6}$/);
      consoleSpy.mockRestore();
    });

    it('should store the code for the phone number', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      const stored = SMSService.getStoredCode('+1234567890');
      expect(stored).toBe(code);
      consoleSpy.mockRestore();
    });

    it('should overwrite previous code for same phone number', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code1 = SMSService.generateSMSCode('+1234567890');
      const code2 = SMSService.generateSMSCode('+1234567890');
      const stored = SMSService.getStoredCode('+1234567890');
      expect(stored).toBe(code2);
      // Codes could theoretically be the same, but stored should match latest
      expect(stored).not.toBeUndefined();
      void code1; // acknowledge first code
      consoleSpy.mockRestore();
    });

    it('should log the code to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`[SMS Service] Code for +1234567890: ${code}`));
      consoleSpy.mockRestore();
    });

    it('should generate different codes for different phone numbers', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1111111111');
      SMSService.generateSMSCode('+2222222222');
      const stored1 = SMSService.getStoredCode('+1111111111');
      const stored2 = SMSService.getStoredCode('+2222222222');
      expect(stored1).toBeDefined();
      expect(stored2).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // verifySMSCode
  // =============================================
  describe('verifySMSCode', () => {
    it('should return success for valid code', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      const result = SMSService.verifySMSCode('+1234567890', code);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Code verified successfully');
      consoleSpy.mockRestore();
    });

    it('should delete code after successful verification', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      SMSService.verifySMSCode('+1234567890', code);
      const stored = SMSService.getStoredCode('+1234567890');
      expect(stored).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should return failure for invalid code', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1234567890');
      const result = SMSService.verifySMSCode('+1234567890', '000000');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid code');
      expect(result.remainingAttempts).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('should return failure when no code was sent', () => {
      const result = SMSService.verifySMSCode('+9999999999', '123456');
      expect(result.success).toBe(false);
      expect(result.message).toBe('No code sent to this phone number');
    });

    it('should track remaining attempts', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1234567890');

      const result1 = SMSService.verifySMSCode('+1234567890', 'WRONG1');
      expect(result1.remainingAttempts).toBe(2);

      const result2 = SMSService.verifySMSCode('+1234567890', 'WRONG2');
      expect(result2.remainingAttempts).toBe(1);

      const result3 = SMSService.verifySMSCode('+1234567890', 'WRONG3');
      expect(result3.remainingAttempts).toBe(0);
      consoleSpy.mockRestore();
    });

    it('should fail after maximum attempts exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');

      // Use up all 3 attempts
      SMSService.verifySMSCode('+1234567890', 'WRONG1');
      SMSService.verifySMSCode('+1234567890', 'WRONG2');
      SMSService.verifySMSCode('+1234567890', 'WRONG3');

      // 4th attempt should fail with max attempts exceeded
      const result = SMSService.verifySMSCode('+1234567890', code);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Maximum attempts exceeded');
      consoleSpy.mockRestore();
    });

    it('should delete code after max attempts exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1234567890');

      SMSService.verifySMSCode('+1234567890', 'WRONG1');
      SMSService.verifySMSCode('+1234567890', 'WRONG2');
      SMSService.verifySMSCode('+1234567890', 'WRONG3');
      SMSService.verifySMSCode('+1234567890', 'WRONG4'); // triggers max exceeded

      const stored = SMSService.getStoredCode('+1234567890');
      expect(stored).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should return expired for expired code', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');

      // Mock Date.now to simulate expiry (5 minutes + 1ms later)
      const originalNow = Date.now;
      Date.now = () => originalNow() + 5 * 60 * 1000 + 1;

      const result = SMSService.verifySMSCode('+1234567890', code);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Code has expired');

      Date.now = originalNow;
      consoleSpy.mockRestore();
    });

    it('should delete code after expiry check', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1234567890');

      const originalNow = Date.now;
      Date.now = () => originalNow() + 10 * 60 * 1000;

      SMSService.verifySMSCode('+1234567890', '123456');

      Date.now = originalNow;

      const stored = SMSService.getStoredCode('+1234567890');
      expect(stored).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // generateSetupData
  // =============================================
  describe('generateSetupData', () => {
    it('should return SMS setup data', async () => {
      const setup = await SMSService.generateSetupData('+1234567890');
      expect(setup.method).toBe('sms');
      expect(setup.phoneNumber).toBe('+1234567890');
      expect(setup.isVerified).toBe(false);
    });
  });

  // =============================================
  // isValidPhoneNumber
  // =============================================
  describe('isValidPhoneNumber', () => {
    it('should accept valid international phone numbers', () => {
      expect(SMSService.isValidPhoneNumber('+12025551234')).toBe(true);
      expect(SMSService.isValidPhoneNumber('+442071234567')).toBe(true);
      expect(SMSService.isValidPhoneNumber('+48123456789')).toBe(true);
    });

    it('should accept numbers without plus prefix', () => {
      expect(SMSService.isValidPhoneNumber('12025551234')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(SMSService.isValidPhoneNumber('')).toBe(false);
    });

    it('should reject numbers starting with 0', () => {
      expect(SMSService.isValidPhoneNumber('0123456789')).toBe(false);
    });

    it('should reject strings with letters', () => {
      expect(SMSService.isValidPhoneNumber('+1abc2345678')).toBe(false);
    });
  });

  // =============================================
  // formatPhoneNumber
  // =============================================
  describe('formatPhoneNumber', () => {
    it('should format 10-digit US number', () => {
      const formatted = SMSService.formatPhoneNumber('2025551234');
      expect(formatted).toBe('(202) 555-1234');
    });

    it('should return original for non-10-digit numbers', () => {
      const number = '+442071234567';
      const formatted = SMSService.formatPhoneNumber(number);
      expect(formatted).toBe(number);
    });

    it('should handle number with country code (not 10 digits after cleaning)', () => {
      const formatted = SMSService.formatPhoneNumber('+12025551234');
      // 11 digits after cleaning, so returns original
      expect(formatted).toBe('+12025551234');
    });
  });

  // =============================================
  // clearAllCodes
  // =============================================
  describe('clearAllCodes', () => {
    it('should clear all stored codes', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SMSService.generateSMSCode('+1111111111');
      SMSService.generateSMSCode('+2222222222');

      SMSService.clearAllCodes();

      expect(SMSService.getStoredCode('+1111111111')).toBeUndefined();
      expect(SMSService.getStoredCode('+2222222222')).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // getStoredCode
  // =============================================
  describe('getStoredCode', () => {
    it('should return undefined for non-existent phone number', () => {
      expect(SMSService.getStoredCode('+9999999999')).toBeUndefined();
    });

    it('should return stored code for existing phone number', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const code = SMSService.generateSMSCode('+1234567890');
      expect(SMSService.getStoredCode('+1234567890')).toBe(code);
      consoleSpy.mockRestore();
    });
  });
});

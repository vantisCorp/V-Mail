import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TwoFactorAuthService } from '../../src/services/twoFactorAuthService';
import { TOTPService } from '../../src/services/totpService';
import { SMSService } from '../../src/services/smsService';
import { TwoFactorAuthSettings, TrustedDevice } from '../../src/types/twoFactorAuth';

// Mock dependencies
vi.mock('../../src/services/totpService', () => ({
  TOTPService: {
    generateSetupData: vi.fn().mockResolvedValue({
      method: 'totp',
      secret: 'MOCK_SECRET',
      qrCodeUri: 'data:image/png;base64,mock',
      backupCodes: ['CODE1', 'CODE2', 'CODE3'],
      isVerified: false
    }),
    verifyCodeWithDetails: vi.fn().mockReturnValue({
      success: true,
      message: 'Code verified successfully'
    }),
    generateBackupCodes: vi
      .fn()
      .mockReturnValue([
        'BACKUP1',
        'BACKUP2',
        'BACKUP3',
        'BACKUP4',
        'BACKUP5',
        'BACKUP6',
        'BACKUP7',
        'BACKUP8',
        'BACKUP9',
        'BACKUP10'
      ]),
    verifyBackupCode: vi.fn().mockReturnValue({
      isValid: true,
      remainingCodes: ['BACKUP2', 'BACKUP3']
    }),
    getTimeRemaining: vi.fn().mockReturnValue(15)
  }
}));

vi.mock('../../src/services/smsService', () => ({
  SMSService: {
    generateSetupData: vi.fn().mockResolvedValue({
      method: 'sms',
      phoneNumber: '+1234567890',
      isVerified: false
    }),
    isValidPhoneNumber: vi.fn().mockReturnValue(true),
    verifySMSCode: vi.fn().mockReturnValue({
      success: true,
      message: 'Code verified successfully'
    }),
    clearAllCodes: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null)
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('TwoFactorAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // =============================================
  // initializeSetup
  // =============================================
  describe('initializeSetup', () => {
    it('should initialize TOTP setup', async () => {
      const setup = await TwoFactorAuthService.initializeSetup('totp', 'user@example.com');
      expect(TOTPService.generateSetupData).toHaveBeenCalledWith('user@example.com');
      expect(setup.method).toBe('totp');
      expect(setup.secret).toBe('MOCK_SECRET');
    });

    it('should initialize SMS setup with valid phone number', async () => {
      const setup = await TwoFactorAuthService.initializeSetup('sms', 'user@example.com', '+1234567890');
      expect(SMSService.isValidPhoneNumber).toHaveBeenCalledWith('+1234567890');
      expect(SMSService.generateSetupData).toHaveBeenCalledWith('+1234567890');
      expect(setup.method).toBe('sms');
    });

    it('should throw error for SMS without phone number', async () => {
      await expect(TwoFactorAuthService.initializeSetup('sms', 'user@example.com')).rejects.toThrow(
        'Phone number is required for SMS method'
      );
    });

    it('should throw error for SMS with invalid phone number', async () => {
      vi.mocked(SMSService.isValidPhoneNumber).mockReturnValue(false);
      await expect(TwoFactorAuthService.initializeSetup('sms', 'user@example.com', 'invalid')).rejects.toThrow(
        'Invalid phone number format'
      );
    });

    it('should initialize backup codes setup', async () => {
      const setup = await TwoFactorAuthService.initializeSetup('backup', 'user@example.com');
      expect(TOTPService.generateBackupCodes).toHaveBeenCalled();
      expect(setup.method).toBe('backup');
      expect(setup.backupCodes).toHaveLength(10);
      expect(setup.isVerified).toBe(false);
    });

    it('should throw error for unsupported method', async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TwoFactorAuthService.initializeSetup('unknown' as any, 'user@example.com')
      ).rejects.toThrow('Unsupported 2FA method: unknown');
    });
  });

  // =============================================
  // verifyCode
  // =============================================
  describe('verifyCode', () => {
    it('should verify TOTP code', () => {
      const result = TwoFactorAuthService.verifyCode({ method: 'totp', code: '123456' }, 'SECRET', []);
      expect(TOTPService.verifyCodeWithDetails).toHaveBeenCalledWith('SECRET', '123456');
      expect(result.success).toBe(true);
    });

    it('should fail TOTP verification without secret', () => {
      const result = TwoFactorAuthService.verifyCode({ method: 'totp', code: '123456' }, '', []);
      expect(result.success).toBe(false);
      expect(result.message).toBe('TOTP secret not found');
    });

    it('should verify SMS code', () => {
      const result = TwoFactorAuthService.verifyCode(
        { method: 'sms', code: '123456', backupCode: '+1234567890' },
        '',
        []
      );
      expect(SMSService.verifySMSCode).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result.success).toBe(true);
    });

    it('should fail SMS verification without phone number (backupCode field)', () => {
      const result = TwoFactorAuthService.verifyCode({ method: 'sms', code: '123456' }, '', []);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Phone number required for SMS verification');
    });

    it('should verify backup code', () => {
      const result = TwoFactorAuthService.verifyCode({ method: 'backup', code: '', backupCode: 'BACKUP1' }, '', [
        'BACKUP1',
        'BACKUP2',
        'BACKUP3'
      ]);
      expect(TOTPService.verifyBackupCode).toHaveBeenCalledWith(['BACKUP1', 'BACKUP2', 'BACKUP3'], 'BACKUP1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Backup code verified successfully');
    });

    it('should fail backup code verification when invalid', () => {
      vi.mocked(TOTPService.verifyBackupCode).mockReturnValue({
        isValid: false,
        remainingCodes: ['BACKUP1', 'BACKUP2', 'BACKUP3']
      });

      const result = TwoFactorAuthService.verifyCode({ method: 'backup', code: '', backupCode: 'INVALID' }, '', [
        'BACKUP1',
        'BACKUP2',
        'BACKUP3'
      ]);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid backup code');
    });

    it('should fail backup verification without backup code', () => {
      const result = TwoFactorAuthService.verifyCode({ method: 'backup', code: '' }, '', ['BACKUP1']);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Backup codes not available');
    });

    it('should return error for unsupported method', () => {
      const result = TwoFactorAuthService.verifyCode(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { method: 'unknown' as any, code: '123456' },
        '',
        []
      );
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported 2FA method');
    });
  });

  // =============================================
  // saveSettings / loadSettings
  // =============================================
  describe('saveSettings / loadSettings', () => {
    const mockSettings: TwoFactorAuthSettings = {
      enabled: true,
      methods: ['totp'],
      defaultMethod: 'totp',
      requireOnNewDevice: true,
      trustedDevices: [],
      backupCodesRemaining: 10
    };

    it('should save settings to localStorage', () => {
      TwoFactorAuthService.saveSettings(mockSettings);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('vmail_2fa_settings', JSON.stringify(mockSettings));
    });

    it('should load settings from localStorage', () => {
      TwoFactorAuthService.saveSettings(mockSettings);
      const loaded = TwoFactorAuthService.loadSettings();
      expect(loaded).toEqual(mockSettings);
    });

    it('should return null when no settings stored', () => {
      const loaded = TwoFactorAuthService.loadSettings();
      expect(loaded).toBeNull();
    });

    it('should return null for invalid JSON in localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValueOnce('invalid json{{{');
      const loaded = TwoFactorAuthService.loadSettings();
      expect(loaded).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // =============================================
  // getDefaultSettings
  // =============================================
  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const defaults = TwoFactorAuthService.getDefaultSettings();
      expect(defaults.enabled).toBe(false);
      expect(defaults.methods).toEqual(['totp']);
      expect(defaults.defaultMethod).toBe('totp');
      expect(defaults.requireOnNewDevice).toBe(true);
      expect(defaults.trustedDevices).toEqual([]);
      expect(defaults.backupCodesRemaining).toBe(10);
    });
  });

  // =============================================
  // enable2FA / disable2FA
  // =============================================
  describe('enable2FA', () => {
    it('should enable 2FA with TOTP method', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET123');
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.enabled).toBe(true);
      expect(settings?.methods).toContain('totp');
      expect(settings?.defaultMethod).toBe('totp');
    });

    it('should enable 2FA with SMS method and phone number', () => {
      TwoFactorAuthService.enable2FA('sms', undefined, '+1234567890');
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.enabled).toBe(true);
      expect(settings?.smsPhoneNumber).toBe('+1234567890');
    });

    it('should add method if not already present', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      TwoFactorAuthService.enable2FA('sms', undefined, '+1234567890');
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.methods).toContain('totp');
      expect(settings?.methods).toContain('sms');
    });

    it('should not duplicate existing method', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET1');
      TwoFactorAuthService.enable2FA('totp', 'SECRET2');
      const settings = TwoFactorAuthService.loadSettings();
      const totpCount = settings?.methods.filter((m) => m === 'totp').length;
      expect(totpCount).toBe(1);
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      TwoFactorAuthService.disable2FA();
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.enabled).toBe(false);
    });

    it('should do nothing if no settings exist', () => {
      TwoFactorAuthService.disable2FA();
      // Should not throw
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  // =============================================
  // Trusted devices
  // =============================================
  describe('addTrustedDevice', () => {
    const mockDevice: TrustedDevice = {
      id: 'device1',
      name: 'My Laptop',
      deviceInfo: 'Chrome on macOS',
      lastUsed: new Date('2024-01-01'),
      expiresAt: new Date('2025-01-01')
    };

    it('should add a trusted device', () => {
      TwoFactorAuthService.addTrustedDevice(mockDevice);
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.trustedDevices).toHaveLength(1);
      expect(settings?.trustedDevices[0].id).toBe('device1');
    });

    it('should add multiple trusted devices', () => {
      TwoFactorAuthService.addTrustedDevice(mockDevice);
      TwoFactorAuthService.addTrustedDevice({
        ...mockDevice,
        id: 'device2',
        name: 'My Phone'
      });
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.trustedDevices).toHaveLength(2);
    });
  });

  describe('removeTrustedDevice', () => {
    const mockDevice: TrustedDevice = {
      id: 'device1',
      name: 'My Laptop',
      deviceInfo: 'Chrome on macOS',
      lastUsed: new Date('2024-01-01'),
      expiresAt: new Date('2025-01-01')
    };

    it('should remove a trusted device', () => {
      TwoFactorAuthService.addTrustedDevice(mockDevice);
      TwoFactorAuthService.removeTrustedDevice('device1');
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.trustedDevices).toHaveLength(0);
    });

    it('should do nothing if no settings exist', () => {
      TwoFactorAuthService.removeTrustedDevice('nonexistent');
      // Should not throw
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('isDeviceTrusted', () => {
    it('should return true for valid trusted device', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      TwoFactorAuthService.addTrustedDevice({
        id: 'device1',
        name: 'My Laptop',
        deviceInfo: 'Chrome',
        lastUsed: new Date(),
        expiresAt: futureDate
      });

      expect(TwoFactorAuthService.isDeviceTrusted('device1')).toBe(true);
    });

    it('should return false for non-existent device', () => {
      expect(TwoFactorAuthService.isDeviceTrusted('nonexistent')).toBe(false);
    });

    it('should return false when no settings exist', () => {
      expect(TwoFactorAuthService.isDeviceTrusted('device1')).toBe(false);
    });

    it('should return false and remove expired device', () => {
      const pastDate = new Date('2020-01-01');

      TwoFactorAuthService.addTrustedDevice({
        id: 'device1',
        name: 'Old Device',
        deviceInfo: 'Chrome',
        lastUsed: new Date('2019-01-01'),
        expiresAt: pastDate
      });

      expect(TwoFactorAuthService.isDeviceTrusted('device1')).toBe(false);

      // Device should be removed
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.trustedDevices.find((d) => d.id === 'device1')).toBeUndefined();
    });
  });

  // =============================================
  // getStatus
  // =============================================
  describe('getStatus', () => {
    it('should return disabled when no settings', () => {
      expect(TwoFactorAuthService.getStatus()).toBe('disabled');
    });

    it('should return disabled when 2FA is disabled', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      TwoFactorAuthService.disable2FA();
      expect(TwoFactorAuthService.getStatus()).toBe('disabled');
    });

    it('should return enabled when 2FA is enabled', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      expect(TwoFactorAuthService.getStatus()).toBe('enabled');
    });
  });

  // =============================================
  // regenerateBackupCodes
  // =============================================
  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', () => {
      const codes = TwoFactorAuthService.regenerateBackupCodes();
      expect(TOTPService.generateBackupCodes).toHaveBeenCalled();
      expect(codes).toHaveLength(10);
    });

    it('should update backupCodesRemaining in settings', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      TwoFactorAuthService.regenerateBackupCodes();
      const settings = TwoFactorAuthService.loadSettings();
      expect(settings?.backupCodesRemaining).toBe(10);
    });
  });

  // =============================================
  // clearAllData
  // =============================================
  describe('clearAllData', () => {
    it('should clear all 2FA data', () => {
      TwoFactorAuthService.enable2FA('totp', 'SECRET');
      TwoFactorAuthService.clearAllData();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vmail_2fa_settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vmail_trusted_devices');
      expect(SMSService.clearAllCodes).toHaveBeenCalled();
    });
  });

  // =============================================
  // getTimeRemaining
  // =============================================
  describe('getTimeRemaining', () => {
    it('should delegate to TOTPService', () => {
      const remaining = TwoFactorAuthService.getTimeRemaining();
      expect(TOTPService.getTimeRemaining).toHaveBeenCalled();
      expect(remaining).toBe(15);
    });
  });
});

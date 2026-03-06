/**
 * Two-Factor Auth Service Integration Tests
 */

import { TwoFactorAuthService } from '../twoFactorAuthService';
import { TwoFactorAuthMethod } from '../../types/twoFactorAuth';

describe('TwoFactorAuthService Integration', () => {
  beforeEach(() => {
    TwoFactorAuthService.clearAllData();
    jest.clearAllMocks();
  });

  describe('settings management', () => {
    it('should get default settings', () => {
      const settings = TwoFactorAuthService.getDefaultSettings();
      
      expect(settings).toBeDefined();
      expect(settings.enabled).toBe(false);
      expect(settings.methods).toEqual(['totp']);
      expect(settings.defaultMethod).toBe('totp');
      expect(settings.requireOnNewDevice).toBe(true);
      expect(settings.trustedDevices).toEqual([]);
      expect(settings.backupCodesRemaining).toBe(10);
    });

    it('should save and load settings', () => {
      const settings = TwoFactorAuthService.getDefaultSettings();
      settings.enabled = true;
      
      TwoFactorAuthService.saveSettings(settings);
      const loaded = TwoFactorAuthService.loadSettings();
      
      expect(loaded).toEqual(settings);
    });

    it('should return null when no settings exist', () => {
      TwoFactorAuthService.clearAllData();
      
      const loaded = TwoFactorAuthService.loadSettings();
      
      expect(loaded).toBeNull();
    });
  });

  describe('enable/disable 2FA', () => {
    it('should enable 2FA with TOTP', () => {
      TwoFactorAuthService.enable2FA('totp', 'test-secret');
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.enabled).toBe(true);
      expect(settings?.defaultMethod).toBe('totp');
    });

    it('should enable 2FA with SMS', () => {
      TwoFactorAuthService.enable2FA('sms', undefined, '+1234567890');
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.enabled).toBe(true);
      expect(settings?.defaultMethod).toBe('sms');
      expect(settings?.smsPhoneNumber).toBe('+1234567890');
    });

    it('should disable 2FA', () => {
      TwoFactorAuthService.enable2FA('totp', 'test-secret');
      
      TwoFactorAuthService.disable2FA();
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.enabled).toBe(false);
    });

    it('should add method to methods list', () => {
      TwoFactorAuthService.enable2FA('totp', 'test-secret');
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.methods).toContain('totp');
    });
  });

  describe('status management', () => {
    it('should return disabled status when 2FA is off', () => {
      const status = TwoFactorAuthService.getStatus();
      
      expect(status).toBe('disabled');
    });

    it('should return enabled status when 2FA is on', () => {
      TwoFactorAuthService.enable2FA('totp', 'test-secret');
      
      const status = TwoFactorAuthService.getStatus();
      
      expect(status).toBe('enabled');
    });
  });

  describe('trusted devices', () => {
    it('should add trusted device', () => {
      const device = {
        id: '1',
        name: 'Test Device',
        deviceInfo: 'Test Browser',
        lastUsed: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      
      TwoFactorAuthService.addTrustedDevice(device);
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.trustedDevices).toHaveLength(1);
      expect(settings?.trustedDevices[0]).toEqual(device);
    });

    it('should remove trusted device', () => {
      const device = {
        id: '1',
        name: 'Test Device',
        deviceInfo: 'Test Browser',
        lastUsed: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      
      TwoFactorAuthService.addTrustedDevice(device);
      TwoFactorAuthService.removeTrustedDevice('1');
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.trustedDevices).toHaveLength(0);
    });

    it('should check if device is trusted', () => {
      const device = {
        id: '1',
        name: 'Test Device',
        deviceInfo: 'Test Browser',
        lastUsed: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      
      TwoFactorAuthService.addTrustedDevice(device);
      
      const isTrusted = TwoFactorAuthService.isDeviceTrusted('1');
      
      expect(isTrusted).toBe(true);
    });

    it('should not trust expired device', () => {
      const device = {
        id: '1',
        name: 'Test Device',
        deviceInfo: 'Test Browser',
        lastUsed: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      
      TwoFactorAuthService.addTrustedDevice(device);
      
      const isTrusted = TwoFactorAuthService.isDeviceTrusted('1');
      
      expect(isTrusted).toBe(false);
    });
  });

  describe('backup codes', () => {
    it('should regenerate backup codes', () => {
      const newCodes = TwoFactorAuthService.regenerateBackupCodes();
      
      expect(newCodes).toBeDefined();
      expect(newCodes.length).toBe(10);
      
      const settings = TwoFactorAuthService.loadSettings();
      
      expect(settings?.backupCodesRemaining).toBe(10);
    });
  });

  describe('verify code', () => {
    it('should verify TOTP code', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const request = {
        method: 'totp' as TwoFactorAuthMethod,
        code: '123456',
      };
      
      const result = TwoFactorAuthService.verifyCode(request, secret, []);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should verify backup code', () => {
      const backupCodes = ['CODE1', 'CODE2', 'CODE3'];
      const request = {
        method: 'backup' as TwoFactorAuthMethod,
        code: '',
        backupCode: 'CODE1',
      };
      
      const result = TwoFactorAuthService.verifyCode(request, '', backupCodes);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should return error for invalid method', () => {
      const request = {
        method: 'invalid' as TwoFactorAuthMethod,
        code: '123456',
      };
      
      const result = TwoFactorAuthService.verifyCode(request, '', []);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unsupported');
    });
  });

  describe('initialize setup', () => {
    it('should initialize TOTP setup', async () => {
      const setupData = await TwoFactorAuthService.initializeSetup('totp', 'test@example.com');
      
      expect(setupData).toBeDefined();
      expect(setupData.method).toBe('totp');
      expect(setupData.secret).toBeDefined();
      expect(setupData.qrCodeUri).toBeDefined();
      expect(setupData.backupCodes).toBeDefined();
      expect(setupData.isVerified).toBe(false);
    });

    it('should initialize SMS setup', async () => {
      const setupData = await TwoFactorAuthService.initializeSetup('sms', 'test@example.com', '+1234567890');
      
      expect(setupData).toBeDefined();
      expect(setupData.method).toBe('sms');
      expect(setupData.phoneNumber).toBe('+1234567890');
    });

    it('should throw error for SMS without phone number', async () => {
      await expect(TwoFactorAuthService.initializeSetup('sms', 'test@example.com')).rejects.toThrow();
    });

    it('should throw error for unsupported method', async () => {
      await expect(
        TwoFactorAuthService.initializeSetup('invalid' as TwoFactorAuthMethod, 'test@example.com')
      ).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should clear all data', () => {
      TwoFactorAuthService.enable2FA('totp', 'test-secret');
      const device = {
        id: '1',
        name: 'Test Device',
        deviceInfo: 'Test Browser',
        lastUsed: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      TwoFactorAuthService.addTrustedDevice(device);
      
      TwoFactorAuthService.clearAllData();
      
      expect(TwoFactorAuthService.loadSettings()).toBeNull();
    });
  });
});
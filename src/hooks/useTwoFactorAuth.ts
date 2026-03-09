/**
 * React Hook for Two-Factor Authentication
 * Manages 2FA state, setup, and verification
 */

import { useState, useEffect, useCallback } from 'react';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';

import {
  TwoFactorAuthState,
  TwoFactorAuthSetup,
  TwoFactorAuthVerifyRequest,
  TwoFactorAuthMethod,
  TrustedDevice
} from '../types/twoFactorAuth';

export const useTwoFactorAuth = (username: string = 'user@example.com') => {
  const [state, setState] = useState<TwoFactorAuthState>({
    status: 'disabled',
    settings: TwoFactorAuthService.getDefaultSettings(),
    isSetupPending: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = TwoFactorAuthService.loadSettings();
    if (settings) {
      setState((prev) => ({
        ...prev,
        settings,
        status: settings.enabled ? 'enabled' : 'disabled'
      }));
    }
  }, []);

  /**
   * Initialize 2FA setup
   */
  const initializeSetup = useCallback(
    async (method: TwoFactorAuthMethod, phoneNumber?: string): Promise<TwoFactorAuthSetup | null> => {
      setLoading(true);
      setError(null);

      try {
        const setupData = await TwoFactorAuthService.initializeSetup(method, username, phoneNumber);

        setState((prev) => ({
          ...prev,
          setupData,
          isSetupPending: true
        }));

        return setupData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize 2FA setup';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  /**
   * Verify and enable 2FA
   */
  const verifyAndEnable = useCallback(
    async (request: TwoFactorAuthVerifyRequest, secret?: string, backupCodes?: string[]): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const result = TwoFactorAuthService.verifyCode(request, secret || '', backupCodes || []);

        if (result.success) {
          TwoFactorAuthService.enable2FA(request.method, secret, state.setupData?.phoneNumber);

          setState((prev) => ({
            ...prev,
            status: 'enabled',
            settings: {
              ...prev.settings,
              enabled: true,
              defaultMethod: request.method,
              backupCodesRemaining: backupCodes?.length || 10
            },
            isSetupPending: false,
            setupData: undefined
          }));

          return true;
        } else {
          setError(result.message);
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [state.setupData]
  );

  /**
   * Disable 2FA
   */
  const disable2FA = useCallback((): void => {
    TwoFactorAuthService.disable2FA();

    setState((prev) => ({
      ...prev,
      status: 'disabled',
      settings: {
        ...prev.settings,
        enabled: false
      }
    }));
  }, []);

  /**
   * Regenerate backup codes
   */
  const regenerateBackupCodes = useCallback((): string[] => {
    const newCodes = TwoFactorAuthService.regenerateBackupCodes();

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        backupCodesRemaining: newCodes.length
      }
    }));

    return newCodes;
  }, []);

  /**
   * Add trusted device
   */
  const addTrustedDevice = useCallback((device: TrustedDevice): void => {
    TwoFactorAuthService.addTrustedDevice(device);

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        trustedDevices: [...prev.settings.trustedDevices, device]
      }
    }));
  }, []);

  /**
   * Remove trusted device
   */
  const removeTrustedDevice = useCallback((deviceId: string): void => {
    TwoFactorAuthService.removeTrustedDevice(deviceId);

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        trustedDevices: prev.settings.trustedDevices.filter((d) => d.id !== deviceId)
      }
    }));
  }, []);

  /**
   * Get time remaining for TOTP code
   */
  const getTimeRemaining = useCallback((): number => {
    return TwoFactorAuthService.getTimeRemaining();
  }, []);

  /**
   * Cancel setup
   */
  const cancelSetup = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      isSetupPending: false,
      setupData: undefined
    }));
    setError(null);
  }, []);

  return {
    state,
    loading,
    error,
    initializeSetup,
    verifyAndEnable,
    disable2FA,
    regenerateBackupCodes,
    addTrustedDevice,
    removeTrustedDevice,
    getTimeRemaining,
    cancelSetup
  };
};

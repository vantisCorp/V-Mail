/**
 * Two-Factor Authentication Component
 * Handles 2FA setup, verification, and management
 */

import React, { useState, useEffect } from 'react';
import { useTwoFactorAuth } from '../hooks/useTwoFactorAuth';
import { TwoFactorAuthMethod } from '../types/twoFactorAuth';
import '../styles/twoFactorAuth.css';

interface TwoFactorAuthProps {
  username?: string;
  onSetupComplete?: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  username = 'user@example.com',
  onSetupComplete,
}) => {
  const {
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
    cancelSetup,
  } = useTwoFactorAuth(username);

  const [selectedMethod, setSelectedMethod] = useState<TwoFactorAuthMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [regeneratedCodes, setRegeneratedCodes] = useState<string[] | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Timer countdown for TOTP
  useEffect(() => {
    if (state.status === 'enabled' && state.settings.defaultMethod === 'totp') {
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.status, state.settings.defaultMethod, getTimeRemaining]);

  const handleMethodSelect = async (method: TwoFactorAuthMethod) => {
    setSelectedMethod(method);
    await initializeSetup(method, phoneNumber);
  };

  const handleVerifyCode = async () => {
    const success = await verifyAndEnable(
      {
        method: selectedMethod || state.settings.defaultMethod,
        code: verificationCode,
        backupCode: phoneNumber,
      },
      state.setupData?.secret,
      state.setupData?.backupCodes
    );

    if (success && onSetupComplete) {
      onSetupComplete();
    }
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
      disable2FA();
    }
  };

  const handleRegenerateBackupCodes = () => {
    const codes = regenerateBackupCodes();
    setRegeneratedCodes(codes);
    setShowBackupCodes(true);
  };

  const handleAddTrustedDevice = () => {
    const device = {
      id: Date.now().toString(),
      name: 'Current Device',
      deviceInfo: navigator.userAgent,
      lastUsed: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    addTrustedDevice(device);
  };

  const renderStatusIndicator = () => (
    <div className="status-indicator">
      <span className={`status-dot ${state.status}`} />
      {state.status === 'enabled' ? '2FA Enabled' : state.status === 'verified' ? '2FA Verified' : '2FA Disabled'}
    </div>
  );

  const renderMethodSelection = () => (
    <div className="method-selection">
      <div
        className={`method-option ${selectedMethod === 'totp' ? 'selected' : ''}`}
        onClick={() => handleMethodSelect('totp')}
      >
        <div className="method-option-header">
          <span className="method-icon">📱</span>
          <h4>Authenticator App</h4>
        </div>
        <p>Use Google Authenticator, Authy, or any TOTP-compatible app</p>
      </div>

      <div
        className={`method-option ${selectedMethod === 'sms' ? 'selected' : ''}`}
        onClick={() => setSelectedMethod('sms')}
      >
        <div className="method-option-header">
          <span className="method-icon">💬</span>
          <h4>SMS Verification</h4>
        </div>
        <p>Receive verification codes via text message</p>
      </div>

      <div
        className={`method-option ${selectedMethod === 'backup' ? 'selected' : ''}`}
        onClick={() => setSelectedMethod('backup')}
      >
        <div className="method-option-header">
          <span className="method-icon">🔑</span>
          <h4>Backup Codes</h4>
        </div>
        <p>Generate one-time backup codes for emergencies</p>
      </div>
    </div>
  );

  const renderSMSInput = () => (
    selectedMethod === 'sms' && (
      <div className="two-factor-auth-section">
        <h3>Enter Phone Number</h3>
        <input
          type="tel"
          className="phone-input"
          placeholder="+1 (555) 123-4567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <div className="two-factor-actions">
          <button onClick={() => handleMethodSelect('sms')} disabled={!phoneNumber || loading}>
            {loading ? <span className="loading-spinner" /> : 'Send Code'}
          </button>
        </div>
      </div>
    )
  );

  const renderQRCode = () => (
    state.setupData?.qrCodeUri && (
      <div className="qr-code-container">
        <img src={state.setupData.qrCodeUri} alt="QR Code" />
        <div className="qr-code-instructions">
          <p>Scan this QR code with your authenticator app</p>
          <p>Or enter this code manually:</p>
          <div className="secret-display">{state.setupData.secret}</div>
        </div>
      </div>
    )
  );

  const renderBackupCodes = (codes: string[]) => (
    <div className="backup-codes-container">
      <h4>⚠️ Save These Backup Codes</h4>
      <p>Store these codes in a safe place. You can use them if you lose access to your authenticator app.</p>
      <div className="backup-codes-grid">
        {codes.map((code, index) => (
          <div key={index} className="backup-code">
            {code}
          </div>
        ))}
      </div>
      <div className="backup-code-warning">
        <span>⚠️</span>
        <span>These codes will only be shown once. Save them now!</span>
      </div>
    </div>
  );

  const renderVerificationInput = () => (
    <div className="two-factor-auth-section">
      <h3>Enter Verification Code</h3>
      <input
        type="text"
        className="single-code-input"
        placeholder="123456"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        maxLength={6}
      />
      {state.settings.defaultMethod === 'totp' && (
        <div className={`timer-display ${timeRemaining <= 10 ? 'expiring' : ''}`}>
          Code expires in {timeRemaining} seconds
        </div>
      )}
    </div>
  );

  const renderEnabledState = () => (
    <div className="two-factor-auth-content">
      <div className="two-factor-auth-header">
        <h2>Two-Factor Authentication</h2>
        {renderStatusIndicator()}
      </div>

      <div className="two-factor-auth-section">
        <h3>Current Settings</h3>
        <p>Two-factor authentication is currently enabled using {state.settings.defaultMethod.toUpperCase()}.</p>
        <div className="settings-item">
          <div className="settings-item-label">
            <h4>Backup Codes Remaining</h4>
            <p>Number of unused backup codes available</p>
          </div>
          <div className="settings-item-value">{state.settings.backupCodesRemaining}</div>
        </div>
        <div className="settings-item">
          <div className="settings-item-label">
            <h4>Require on New Device</h4>
            <p>Ask for verification when signing in from a new device</p>
          </div>
          <div className="toggle-switch">
            <input type="checkbox" checked={state.settings.requireOnNewDevice} readOnly />
            <span className="toggle-slider" />
          </div>
        </div>
      </div>

      <div className="two-factor-auth-section">
        <h3>Trusted Devices</h3>
        {state.settings.trustedDevices.length > 0 ? (
          <div className="trusted-devices-list">
            {state.settings.trustedDevices.map((device) => (
              <div key={device.id} className="trusted-device-item">
                <div className="trusted-device-info">
                  <h4>{device.name}</h4>
                  <p>{device.deviceInfo}</p>
                  <p className="last-used">Last used: {new Date(device.lastUsed).toLocaleDateString()}</p>
                </div>
                <button
                  className="remove-device-btn"
                  onClick={() => removeTrustedDevice(device.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No trusted devices. Add your current device to skip 2FA in the future.</p>
        )}
        <div className="two-factor-actions">
          <button onClick={handleAddTrustedDevice}>Add Trusted Device</button>
        </div>
      </div>

      <div className="two-factor-auth-section">
        <h3>Actions</h3>
        <div className="two-factor-actions">
          <button onClick={handleRegenerateBackupCodes}>Regenerate Backup Codes</button>
          <button onClick={handleDisable2FA} className="remove-device-btn">
            Disable 2FA
          </button>
        </div>
      </div>

      {showBackupCodes && regeneratedCodes && (
        <div className="two-factor-auth-section">
          {renderBackupCodes(regeneratedCodes)}
          <div className="two-factor-actions">
            <button onClick={() => setShowBackupCodes(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSetupState = () => (
    <div className="two-factor-auth-content">
      <div className="two-factor-auth-header">
        <h2>Setup Two-Factor Authentication</h2>
        <p>Choose a method to secure your account</p>
      </div>

      {error && (
        <div className="two-factor-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!selectedMethod ? (
        renderMethodSelection()
      ) : (
        <>
          {selectedMethod === 'sms' && renderSMSInput()}

          {state.setupData && (
            <>
              {selectedMethod === 'totp' && renderQRCode()}

              {selectedMethod === 'backup' && state.setupData.backupCodes && (
                renderBackupCodes(state.setupData.backupCodes)
              )}

              {renderVerificationInput()}

              <div className="two-factor-actions">
                <button onClick={handleVerifyCode} disabled={!verificationCode || loading}>
                  {loading ? <span className="loading-spinner" /> : 'Verify & Enable'}
                </button>
                <button onClick={cancelSetup}>Cancel</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="two-factor-auth-container">
      {state.status === 'enabled' ? renderEnabledState() : renderSetupState()}
    </div>
  );
};
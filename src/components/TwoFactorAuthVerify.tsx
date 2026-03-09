/**
 * Two-Factor Authentication Verification Modal
 * Used during login to verify 2FA code
 */

import React, { useState, useEffect } from 'react';
import { TwoFactorAuthMethod } from '../types/twoFactorAuth';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import '../styles/twoFactorAuth.css';

interface TwoFactorAuthVerifyProps {
  username: string;
  onSuccess: () => void;
  onCancel: () => void;
  onUseBackupCode?: () => void;
}

export const TwoFactorAuthVerify: React.FC<TwoFactorAuthVerifyProps> = ({
  username: _username,
  onSuccess,
  onCancel,
  onUseBackupCode
}) => {
  const [method, setMethod] = useState<TwoFactorAuthMethod>('totp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);

  useEffect(() => {
    const settings = TwoFactorAuthService.loadSettings();
    if (settings) {
      setMethod(settings.defaultMethod);
    }
  }, []);

  // Timer countdown for TOTP
  useEffect(() => {
    if (method === 'totp') {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 30));
      }, 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [method]);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, this would call an API endpoint
      // For now, we'll simulate verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simple validation for demo purposes
      if (code.length === 6 && /^\d+$/.test(code)) {
        onSuccess();
      } else {
        setError('Invalid verification code');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="two-factor-auth-container">
      <div className="two-factor-auth-content">
        <div className="two-factor-auth-header">
          <h2>Two-Factor Authentication</h2>
          <p>Enter the code from your authenticator app to continue</p>
        </div>

        {error && (
          <div className="two-factor-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="two-factor-auth-section">
          <h3>Verification Code</h3>
          <input
            type="text"
            className="single-code-input"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            maxLength={6}
            autoFocus
            disabled={loading}
          />

          {method === 'totp' && (
            <div className={`timer-display ${timeRemaining <= 10 ? 'expiring' : ''}`}>
              Code expires in {timeRemaining} seconds
            </div>
          )}
        </div>

        <div className="two-factor-actions">
          <button onClick={handleVerify} disabled={code.length !== 6 || loading}>
            {loading ? <span className="loading-spinner" /> : 'Verify'}
          </button>
          <button onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>

        {onUseBackupCode && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#4CAF50',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onClick={onUseBackupCode}
            >
              Use a backup code instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

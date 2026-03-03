import React from 'react';

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content panic-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">⚠️ PANIC MODE</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="panic-warning">
            <div className="panic-icon">🚨</div>
            <h3>Are you sure you want to activate Panic Mode?</h3>
            <p>
              This action will:
            </p>
            <ul>
              <li>Immediately lock your account</li>
              <li>Delete all local data</li>
              <li>Revoke all active sessions</li>
              <li>Send security alert to your recovery email</li>
            </ul>
            <p className="panic-warning-text">
              This action cannot be undone!
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Activate Panic Mode
          </button>
        </div>
      </div>
    </div>
  );
};

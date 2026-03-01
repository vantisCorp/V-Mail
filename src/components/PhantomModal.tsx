import React from 'react';
import { useAliases } from '../hooks/useAliases';

interface PhantomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (alias: string) => void;
}

export const PhantomModal: React.FC<PhantomModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { aliases } = useAliases();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content phantom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Select Phantom Alias</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Choose a Phantom Alias to hide your real email address
          </p>

          <div className="alias-list">
            {aliases.map((alias) => (
              <button
                key={alias.id}
                className="alias-option"
                onClick={() => onSelect(alias.email)}
              >
                <div className="alias-icon">👻</div>
                <div className="alias-info">
                  <div className="alias-email">{alias.email}</div>
                  <div className="alias-domain">{alias.domain}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

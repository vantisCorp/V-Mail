import React from 'react';

interface SelfDestructModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

export const SelfDestructModal: React.FC<SelfDestructModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const options = [
    { label: '15 minutes', minutes: 15 },
    { label: '1 hour', minutes: 60 },
    { label: '24 hours', minutes: 1440 },
    { label: '7 days', minutes: 10080 }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content self-destruct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Set Self-Destruct Timer</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Choose when this message should be automatically deleted
          </p>

          <div className="self-destruct-options">
            {options.map((option) => (
              <button
                key={option.label}
                className="self-destruct-option"
                onClick={() => {
                  const date = new Date();
                  date.setMinutes(date.getMinutes() + option.minutes);
                  onSelect(date);
                }}
              >
                <div className="option-icon">⏰</div>
                <div className="option-label">{option.label}</div>
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

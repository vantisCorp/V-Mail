import React, { useState } from 'react';

interface SortBarProps {
  sortField: 'date' | 'from' | 'subject';
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: 'date' | 'from' | 'subject') => void;
}

export const SortBar: React.FC<SortBarProps> = ({
  sortField,
  sortOrder,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { key: 'date' as const, label: 'Date', icon: '📅' },
    { key: 'from' as const, label: 'From', icon: '👤' },
    { key: 'subject' as const, label: 'Subject', icon: '📝' },
  ];

  const selectedOption = sortOptions.find((opt) => opt.key === sortField);

  return (
    <div className="sort-bar">
      <button
        className="sort-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sort-icon">{selectedOption?.icon}</span>
        <span>Sort by: {selectedOption?.label}</span>
        <span className="sort-order">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      </button>

      {isOpen && (
        <div className="sort-dropdown">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              className={`sort-option ${sortField === option.key ? 'active' : ''}`}
              onClick={() => {
                onSortChange(option.key);
                setIsOpen(false);
              }}
            >
              <span className="sort-option-icon">{option.icon}</span>
              <span className="sort-option-label">{option.label}</span>
              {sortField === option.key && (
                <span className="sort-option-order">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

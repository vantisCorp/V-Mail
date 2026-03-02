import React, { useState } from 'react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  activeFilterCount: number;
  onToggleFilter: (filter: keyof FilterOptions) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filters = [
    { key: 'encrypted', label: 'Encrypted', icon: '🔒' },
    { key: 'hasAttachments', label: 'Has Attachments', icon: '📎' },
    { key: 'unread', label: 'Unread', icon: '📬' },
    { key: 'starred', label: 'Starred', icon: '⭐' },
    { key: 'hasPhantomAlias', label: 'Phantom Alias', icon: '👻' },
    { key: 'hasSelfDestruct', label: 'Self-Destruct', icon: '⏰' },
  ];

  return (
    <div className="filter-bar">
      <button
        className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="filter-icon">🔽</span>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="filter-count">{activeFilterCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="filter-dropdown">
          <div className="filter-list">
            {filters.map((filter) => (
              <button
                key={filter.key}
                className="filter-option"
                onClick={() => onToggleFilter(filter.key as keyof FilterOptions)}
              >
                <span className="filter-option-icon">{filter.icon}</span>
                <span className="filter-option-label">{filter.label}</span>
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <button className="filter-clear-btn" onClick={onClearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

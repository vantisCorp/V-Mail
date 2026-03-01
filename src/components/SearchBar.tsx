import React from 'react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
  resultCount?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
  resultCount,
}) => {
  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search emails"
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={onClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {resultCount !== undefined && (
        <span className="search-results-count">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

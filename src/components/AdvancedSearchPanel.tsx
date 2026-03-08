import React, { useState } from 'react';
import {
  SearchCondition,
  SearchField,
  SearchOperator,
  SearchMatchMode,
  SavedSearch
} from '../types/search';

interface AdvancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: SearchCondition[];
  matchMode: SearchMatchMode;
  caseSensitive: boolean;
  savedSearches: SavedSearch[];
  recentSearches: string[];
  onAddCondition: (condition: Omit<SearchCondition, 'id'>) => void;
  onUpdateCondition: (id: string, updates: Partial<SearchCondition>) => void;
  onRemoveCondition: (id: string) => void;
  onClearConditions: () => void;
  onSetMatchMode: (mode: SearchMatchMode) => void;
  onToggleCaseSensitive: () => void;
  onSaveSearch: (name: string) => void;
  onLoadSavedSearch: (search: SavedSearch) => void;
  onDeleteSavedSearch: (id: string) => void;
}

const SEARCH_FIELDS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'All Fields' },
  { value: 'from', label: 'From' },
  { value: 'to', label: 'To' },
  { value: 'subject', label: 'Subject' },
  { value: 'body', label: 'Body' },
  { value: 'date', label: 'Date' },
  { value: 'has_attachment', label: 'Has Attachment' },
  { value: 'is_read', label: 'Read Status' },
  { value: 'is_starred', label: 'Starred Status' },
  { value: 'has_label', label: 'Has Label' }
];

const SEARCH_OPERATORS: { value: SearchOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does Not Equal' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' }
];

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  isOpen,
  onClose,
  conditions,
  matchMode,
  caseSensitive,
  savedSearches,
  recentSearches,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  onClearConditions,
  onSetMatchMode,
  onToggleCaseSensitive,
  onSaveSearch,
  onLoadSavedSearch,
  onDeleteSavedSearch
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'saved' | 'recent'>('builder');

  if (!isOpen) {
return null;
}

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      onSaveSearch(searchName.trim());
      setSearchName('');
      setShowSaveDialog(false);
    }
  };

  const getOperatorPlaceholder = (operator: SearchOperator, field: SearchField): string => {
    if (field === 'date') {
      switch (operator) {
        case 'before':
        case 'after':
          return 'YYYY-MM-DD';
        case 'between':
          return 'YYYY-MM-DD, YYYY-MM-DD';
        default:
          return 'Enter date...';
      }
    }
    if (field === 'has_attachment' || field === 'is_read' || field === 'is_starred') {
      return 'true or false';
    }
    return 'Enter value...';
  };

  const getFieldOperators = (field: SearchField): SearchOperator[] => {
    if (field === 'date') {
      return ['before', 'after', 'between', 'equals'];
    }
    if (field === 'has_attachment' || field === 'is_read' || field === 'is_starred') {
      return ['equals', 'not_equals'];
    }
    return ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with'];
  };

  return (
    <div className="advanced-search-overlay">
      <div className="advanced-search-panel">
        <div className="advanced-search-header">
          <h2>Advanced Search</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="advanced-search-tabs">
          <button
            className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            🔍 Builder
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            💾 Saved ({savedSearches.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            🕐 Recent
          </button>
        </div>

        <div className="advanced-search-content">
          {activeTab === 'builder' && (
            <>
              <div className="search-options">
                <div className="match-mode-selector">
                  <span>Match:</span>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="matchMode"
                      checked={matchMode === 'all'}
                      onChange={() => onSetMatchMode('all')}
                    />
                    All conditions
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="matchMode"
                      checked={matchMode === 'any'}
                      onChange={() => onSetMatchMode('any')}
                    />
                    Any condition
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={onToggleCaseSensitive}
                  />
                  Case sensitive
                </label>
              </div>

              <div className="conditions-list">
                {conditions.length === 0 ? (
                  <div className="no-conditions">
                    <p>No search conditions defined.</p>
                    <p>Click "Add Condition" to start building your search.</p>
                  </div>
                ) : (
                  conditions.map((condition, index) => (
                    <div key={condition.id} className="condition-row">
                      <span className="condition-number">{index + 1}</span>
                      <select
                        value={condition.field}
                        onChange={(e) => onUpdateCondition(condition.id, {
                          field: e.target.value as SearchField,
                          operator: 'contains' // Reset operator when field changes
                        })}
                        className="field-select"
                      >
                        {SEARCH_FIELDS.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => onUpdateCondition(condition.id, {
                          operator: e.target.value as SearchOperator
                        })}
                        className="operator-select"
                      >
                        {getFieldOperators(condition.field)
                          .map(op => SEARCH_OPERATORS.find(o => o.value === op))
                          .filter(Boolean)
                          .map(op => (
                            <option key={op!.value} value={op!.value}>
                              {op!.label}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => onUpdateCondition(condition.id, {
                          value: e.target.value
                        })}
                        placeholder={getOperatorPlaceholder(condition.operator, condition.field)}
                        className="value-input"
                      />
                      <button
                        className="remove-condition-btn"
                        onClick={() => onRemoveCondition(condition.id)}
                        aria-label="Remove condition"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="condition-actions">
                <button className="add-condition-btn" onClick={() => onAddCondition({ field: 'all', operator: 'contains', value: '' })}>
                  ➕ Add Condition
                </button>
                {conditions.length > 0 && (
                  <>
                    <button className="clear-conditions-btn" onClick={onClearConditions}>
                      🧹 Clear All
                    </button>
                    <button className="save-search-btn" onClick={() => setShowSaveDialog(true)}>
                      💾 Save Search
                    </button>
                  </>
                )}
              </div>

              {showSaveDialog && (
                <div className="save-dialog">
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Enter search name..."
                    className="search-name-input"
                    autoFocus
                  />
                  <div className="save-dialog-actions">
                    <button className="cancel-btn" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </button>
                    <button
                      className="confirm-save-btn"
                      onClick={handleSaveSearch}
                      disabled={!searchName.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <div className="saved-searches-list">
              {savedSearches.length === 0 ? (
                <div className="empty-state">
                  <p>No saved searches yet.</p>
                  <p>Build a search and save it to quickly access it later.</p>
                </div>
              ) : (
                savedSearches.map(search => (
                  <div key={search.id} className="saved-search-item">
                    <div className="saved-search-info">
                      <span className="saved-search-name">{search.name}</span>
                      <span className="saved-search-conditions">
                        {search.conditions.length} condition{search.conditions.length !== 1 ? 's' : ''}
                      </span>
                      {search.lastUsed && (
                        <span className="saved-search-last-used">
                          Last used: {new Date(search.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="saved-search-actions">
                      <button
                        className="load-search-btn"
                        onClick={() => onLoadSavedSearch(search)}
                      >
                        Load
                      </button>
                      <button
                        className="delete-search-btn"
                        onClick={() => onDeleteSavedSearch(search.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="recent-searches-list">
              {recentSearches.length === 0 ? (
                <div className="empty-state">
                  <p>No recent searches.</p>
                </div>
              ) : (
                recentSearches.map((search, index) => (
                  <div key={index} className="recent-search-item">
                    <span className="recent-search-query">{search}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

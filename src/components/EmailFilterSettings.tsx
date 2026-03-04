import React, { useState } from 'react';
import { useEmailFilters } from '../hooks/useEmailFilters';
import { useNotifications } from '../hooks/useNotifications';
import type { EmailFilter, FilterCondition, FilterAction, FilterConditionField, FilterOperator, FilterActionType } from '../types/filters';

interface EmailFilterSettingsProps {
  onClose: () => void;
}

export const EmailFilterSettings: React.FC<EmailFilterSettingsProps> = ({ onClose }) => {
  const { filters, stats, addFilter, updateFilter, deleteFilter, toggleFilter, duplicateFilter } = useEmailFilters();
  const { addNotification } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<EmailFilter | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAddFilter = () => {
    setSelectedFilter({
      id: '',
      name: '',
      enabled: true,
      conditions: [],
      actions: [],
      matchAll: true,
      priority: filters.length,
      createdAt: '',
      updatedAt: '',
    });
    setIsEditing(true);
  };

  const handleEditFilter = (filter: EmailFilter) => {
    setSelectedFilter(filter);
    setIsEditing(true);
  };

  const handleDeleteFilter = (id: string) => {
    deleteFilter(id);
    if (selectedFilter?.id === id) {
      setSelectedFilter(null);
      setIsEditing(false);
    }
  };

  const handleSaveFilter = (filter: EmailFilter) => {
    if (filter.id) {
      updateFilter(filter.id, filter);
    } else {
      addFilter({
        name: filter.name,
        enabled: filter.enabled,
        conditions: filter.conditions,
        actions: filter.actions,
        matchAll: filter.matchAll,
        priority: filter.priority,
      });
    }
    setIsEditing(false);
    setSelectedFilter(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFilter(null);
  };

  return (
    <div className="filter-settings">
      <div className="filter-settings-header">
        <h2>Email Filters</h2>
        <button className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="filter-settings-content">
        {isEditing && selectedFilter ? (
          <FilterEditForm
            filter={selectedFilter}
            onSave={handleSaveFilter}
            onCancel={handleCancelEdit}
          />
        ) : (
          <>
            <div className="filter-stats">
              <div className="stat-card">
                <span className="stat-value">{stats.totalRules}</span>
                <span className="stat-label">Total Rules</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.activeRules}</span>
                <span className="stat-label">Active Rules</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.emailsProcessed}</span>
                <span className="stat-label">Emails Processed</span>
              </div>
            </div>

            <div className="filter-list">
              <div className="filter-list-header">
                <h3>Filter Rules</h3>
                <button className="btn-primary" onClick={handleAddFilter}>
                  Add Filter
                </button>
              </div>

              {filters.length === 0 ? (
                <div className="no-filters">
                  <p>No filter rules configured</p>
                  <p className="hint">Create filters to automatically organize your incoming emails</p>
                  <button className="btn-primary" onClick={handleAddFilter}>
                    Create First Filter
                  </button>
                </div>
              ) : (
                <div className="filters-grid">
                  {filters.map((filter) => (
                    <FilterCard
                      key={filter.id}
                      filter={filter}
                      onEdit={() => handleEditFilter(filter)}
                      onDelete={() => handleDeleteFilter(filter.id)}
                      onToggle={() => toggleFilter(filter.id)}
                      onDuplicate={() => duplicateFilter(filter.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="filter-info">
              <h3>About Email Filters</h3>
              <p>
                Email filters automatically process incoming emails based on conditions you define.
              </p>
              <h4>How it works:</h4>
              <ol>
                <li>Create a filter with one or more conditions</li>
                <li>Choose actions to apply when conditions match</li>
                <li>Filters are processed in priority order</li>
              </ol>
              <h4>Available Conditions:</h4>
              <ul>
                <li><strong>From:</strong> Sender email address</li>
                <li><strong>To:</strong> Recipient email address</li>
                <li><strong>Subject:</strong> Email subject line</li>
                <li><strong>Body:</strong> Email content</li>
                <li><strong>Has Attachment:</strong> Check for attachments</li>
                <li><strong>Size:</strong> Email size in bytes</li>
                <li><strong>Priority:</strong> Email priority level</li>
              </ul>
              <h4>Available Actions:</h4>
              <ul>
                <li>Move to folder</li>
                <li>Mark as read</li>
                <li>Mark as important</li>
                <li>Delete</li>
                <li>Forward</li>
                <li>Auto-reply</li>
                <li>Add label</li>
                <li>Archive</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface FilterCardProps {
  filter: EmailFilter;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

const FilterCard: React.FC<FilterCardProps> = ({ filter, onEdit, onDelete, onToggle, onDuplicate }) => {
  return (
    <div className={`filter-card ${filter.enabled ? 'enabled' : 'disabled'}`}>
      <div className="filter-card-header">
        <div className="filter-card-title">
          <h4>{filter.name || 'Untitled Filter'}</h4>
          <span className={`filter-status ${filter.enabled ? 'enabled' : 'disabled'}`}>
            {filter.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>
        <span className="filter-priority">Priority: {filter.priority + 1}</span>
      </div>

      <div className="filter-card-body">
        <div className="filter-section">
          <strong>Conditions ({filter.conditions.length}):</strong>
          <ul className="condition-list">
            {filter.conditions.slice(0, 3).map((c, idx) => (
              <li key={idx}>
                {c.field} {c.operator} "{c.value}"
              </li>
            ))}
            {filter.conditions.length > 3 && (
              <li>...and {filter.conditions.length - 3} more</li>
            )}
          </ul>
        </div>

        <div className="filter-section">
          <strong>Actions ({filter.actions.length}):</strong>
          <ul className="action-list">
            {filter.actions.map((a, idx) => (
              <li key={idx}>{a.type.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>

        <div className="filter-match-type">
          Match: {filter.matchAll ? 'All conditions' : 'Any condition'}
        </div>
      </div>

      <div className="filter-card-footer">
        <button className="btn-secondary" onClick={onEdit}>
          Edit
        </button>
        <button className="btn-secondary" onClick={onDuplicate}>
          Duplicate
        </button>
        <button className="btn-toggle" onClick={onToggle}>
          {filter.enabled ? 'Disable' : 'Enable'}
        </button>
        <button className="btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

interface FilterEditFormProps {
  filter: EmailFilter;
  onSave: (filter: EmailFilter) => void;
  onCancel: () => void;
}

const FilterEditForm: React.FC<FilterEditFormProps> = ({ filter, onSave, onCancel }) => {
  const [formData, setFormData] = useState<EmailFilter>(filter);
  const [newCondition, setNewCondition] = useState<Omit<FilterCondition, 'id'>>({
    field: 'from',
    operator: 'contains',
    value: '',
  });
  const [newAction, setNewAction] = useState<Omit<FilterAction, 'id'>>({
    type: 'move_to_folder',
    value: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.conditions.length === 0) {
      alert('At least one condition is required');
      return;
    }
    if (formData.actions.length === 0) {
      alert('At least one action is required');
      return;
    }
    onSave(formData);
  };

  const addCondition = () => {
    if (!newCondition.value.trim()) return;
    const condition: FilterCondition = {
      id: `cond-${Date.now()}`,
      ...newCondition,
    };
    setFormData({
      ...formData,
      conditions: [...formData.conditions, condition],
    });
    setNewCondition({ field: 'from', operator: 'contains', value: '' });
  };

  const removeCondition = (id: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter(c => c.id !== id),
    });
  };

  const addAction = () => {
    const action: FilterAction = {
      id: `act-${Date.now()}`,
      ...newAction,
    };
    setFormData({
      ...formData,
      actions: [...formData.actions, action],
    });
    setNewAction({ type: 'move_to_folder', value: '' });
  };

  const removeAction = (id: string) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter(a => a.id !== id),
    });
  };

  return (
    <form className="filter-edit-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{filter.id ? 'Edit Filter' : 'Create Filter'}</h3>
      </div>

      <div className="form-body">
        <div className="form-field">
          <label htmlFor="name">Filter Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Newsletter Filter"
          />
        </div>

        <div className="form-field checkbox">
          <input
            id="matchAll"
            type="checkbox"
            checked={formData.matchAll}
            onChange={(e) => setFormData({ ...formData, matchAll: e.target.checked })}
          />
          <label htmlFor="matchAll">Match ALL conditions (unchecked = match ANY)</label>
        </div>

        <div className="form-section">
          <h4>Conditions</h4>
          <p className="hint">Define when this filter should apply</p>

          <div className="conditions-list">
            {formData.conditions.map((condition) => (
              <div key={condition.id} className="condition-item">
                <span className="condition-text">
                  <strong>{condition.field}</strong> {condition.operator} "{condition.value}"
                </span>
                <button type="button" className="btn-remove" onClick={() => removeCondition(condition.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-condition-form">
            <select
              value={newCondition.field}
              onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value as FilterConditionField })}
            >
              <option value="from">From</option>
              <option value="to">To</option>
              <option value="subject">Subject</option>
              <option value="body">Body</option>
              <option value="has_attachment">Has Attachment</option>
              <option value="size_greater">Size Greater Than</option>
              <option value="size_less">Size Less Than</option>
              <option value="priority">Priority</option>
            </select>

            <select
              value={newCondition.operator}
              onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value as FilterOperator })}
            >
              <option value="contains">Contains</option>
              <option value="not_contains">Does Not Contain</option>
              <option value="equals">Equals</option>
              <option value="not_equals">Does Not Equal</option>
              <option value="starts_with">Starts With</option>
              <option value="ends_with">Ends With</option>
              <option value="matches_regex">Matches Regex</option>
            </select>

            <input
              type="text"
              value={newCondition.value}
              onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
              placeholder="Value..."
            />

            <button type="button" className="btn-add" onClick={addCondition}>
              Add
            </button>
          </div>
        </div>

        <div className="form-section">
          <h4>Actions</h4>
          <p className="hint">Define what happens when the filter matches</p>

          <div className="actions-list">
            {formData.actions.map((action) => (
              <div key={action.id} className="action-item">
                <span className="action-text">
                  {action.type.replace('_', ' ')}
                  {action.value && `: ${action.value}`}
                </span>
                <button type="button" className="btn-remove" onClick={() => removeAction(action.id)}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-action-form">
            <select
              value={newAction.type}
              onChange={(e) => setNewAction({ ...newAction, type: e.target.value as FilterAction['type'] })}
            >
              <option value="move_to_folder">Move to Folder</option>
              <option value="mark_as_read">Mark as Read</option>
              <option value="mark_as_important">Mark as Important</option>
              <option value="delete">Delete</option>
              <option value="forward">Forward</option>
              <option value="auto_reply">Auto Reply</option>
              <option value="label">Add Label</option>
              <option value="archive">Archive</option>
            </select>

            {['move_to_folder', 'forward', 'label'].includes(newAction.type) && (
              <input
                type="text"
                value={newAction.value || ''}
                onChange={(e) => setNewAction({ ...newAction, value: e.target.value })}
                placeholder={
                  newAction.type === 'move_to_folder' ? 'Folder name...' :
                  newAction.type === 'forward' ? 'Email address...' :
                  'Label name...'
                }
              />
            )}

            <button type="button" className="btn-add" onClick={addAction}>
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Filter
        </button>
      </div>
    </form>
  );
};